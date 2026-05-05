// SQL audit — Fashion Hoodies & Sweatshirts on TheLook eCommerce.
// Used as the readable "code annex" of the TheLook planet overlay.

export const thelookQuery = `-- ============================================================
-- AUDIT FASHION HOODIES & SWEATSHIRTS — TheLook E-commerce
-- Dataset : bigquery-public-data.thelook_ecommerce
-- Période : Janvier 2025 → aujourd'hui
-- Auteur   : BINGANGOYE AURIAN
-- ============================================================
-- Structure : 12 CTEs enchaînées + 1 requête finale
-- Chaque CTE est une étape logique indépendante.
-- On part des données brutes et on enrichit progressivement
-- jusqu'à obtenir un tableau analytique complet par mois.
-- ============================================================

-- Les deux variables de période permettent de changer la plage
-- d'analyse en modifiant uniquement ces deux lignes.
-- current_date() = aujourd'hui automatiquement, pas besoin de le mettre à jour.
DECLARE date_debut DATE DEFAULT '2025-01-01';
DECLARE date_fin   DATE DEFAULT current_date();

WITH

-- ============================================================
-- ÉTAPE 1 : Récupérer toutes les lignes de commandes sur la période
-- ============================================================
-- On joint order_items (les articles) et orders (les commandes)
-- via leur colonne commune order_id.
-- INNER JOIN : chaque article appartient obligatoirement à une commande,
-- pas de risque de perte de données avec ce type de jointure.
-- FORMAT_DATE transforme 2025-01-15 en 2025-01 pour pouvoir
-- grouper par mois dans les étapes suivantes.
commandes_periode AS (
  SELECT
    oi.order_id,
    oi.user_id,
    oi.product_id,
    oi.sale_price,
    oi.status                                        AS statut_article,
    o.created_at                                     AS date_commande,
    FORMAT_DATE('%Y-%m', DATE(o.created_at))         AS mois,
    o.shipped_at
  FROM \`bigquery-public-data.thelook_ecommerce.order_items\` AS oi
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.orders\` AS o
    ON oi.order_id = o.order_id
  WHERE DATE(o.created_at) BETWEEN date_debut AND date_fin
),

-- ============================================================
-- ÉTAPE 2 : Enrichir avec les infos produit et filtrer les hoodies
-- ============================================================
-- On repart de commandes_periode et on y colle le tableau products
-- pour récupérer le nom, la catégorie et le coût de fabrication.
-- Le WHERE filtre uniquement la catégorie qui nous intéresse.
ventes_completes AS (
  SELECT
    cp.order_id,
    cp.user_id,
    cp.sale_price,
    cp.statut_article,
    cp.date_commande,
    cp.mois,
    cp.shipped_at,
    p.id       AS product_id,
    p.name     AS nom_produit,
    p.category AS categorie,
    p.cost     AS cout_fabrication
  FROM commandes_periode AS cp
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.products\` AS p
    ON cp.product_id = p.id
  WHERE p.category = 'Fashion Hoodies & Sweatshirts'
),

-- ============================================================
-- ÉTAPE 3 : Calculer tous les KPIs commerciaux par mois
-- ============================================================
-- GROUP BY mois : tous les calculs sont faits séparément pour chaque mois.
-- COUNT(DISTINCT order_id) : évite de compter plusieurs fois la même commande
--   quand elle contient plusieurs articles.
-- NULLIF(x, 0) : sécurité sur toutes les divisions pour éviter
--   une erreur si le dénominateur vaut zéro.
-- panier_moyen = CA / nb_commandes : permet plus tard de détecter
--   si une hausse du CA vient d'une hausse des prix ou du volume.
-- taux_retour : COUNTIF compte uniquement les articles retournés,
--   divisé par le total d'articles pour obtenir un pourcentage.
-- delai_expedition : moyenne des écarts en heures entre la date
--   de commande et la date d'expédition — mesure l'efficacité logistique.
kpis_commerciaux AS (
  SELECT
    categorie,
    mois,
    ROUND(SUM(sale_price), 2)                                    AS chiffre_affaires,
    ROUND(SUM(cout_fabrication), 2)                              AS cout_total,
    COUNT(DISTINCT order_id)                                     AS nb_commandes,
    ROUND(
      SUM(sale_price) - SUM(cout_fabrication)
    , 2)                                                         AS marge_brute,
    ROUND(
      SUM(sale_price) / NULLIF(COUNT(DISTINCT order_id), 0)
    , 2)                                                         AS panier_moyen,
    ROUND(
      COUNTIF(statut_article = 'Returned')
      / NULLIF(COUNT(*), 0) * 100
    , 2)                                                         AS taux_retour_pct,
    ROUND(
      AVG(TIMESTAMP_DIFF(shipped_at, date_commande, HOUR))
    , 1)                                                         AS delai_expedition_heures
  FROM ventes_completes
  GROUP BY categorie, mois
),

-- ============================================================
-- ÉTAPE 4 : Calculer la croissance mois sur mois
-- ============================================================
-- On reprend toutes les colonnes de kpis_commerciaux pour que
-- cette CTE soit le seul point d'entrée dans la requête finale —
-- pas besoin de joindre kpis_commerciaux séparément.
-- LAG(x) OVER (ORDER BY mois) : window function qui récupère
--   la valeur de x du mois précédent sans réduire le nombre de lignes.
-- Formule de croissance : (valeur actuelle - valeur précédente)
--   / valeur précédente * 100.
-- Lecture clé :
--   → croissance_ca_pct >> croissance_commandes_pct = hausse des prix
--   → les deux évoluent pareil = hausse du volume (campagne marketing)
--   Particulièrement révélateur sur nov→fév (période EGAlim en France).
croissance_mensuelle AS (
  SELECT
    mois,
    chiffre_affaires,
    cout_total,
    nb_commandes,
    marge_brute,
    panier_moyen,
    taux_retour_pct,
    delai_expedition_heures,
    ROUND(
      (chiffre_affaires - LAG(chiffre_affaires) OVER (ORDER BY mois))
      / NULLIF(LAG(chiffre_affaires) OVER (ORDER BY mois), 0) * 100
    , 2)                                                         AS croissance_ca_pct,
    ROUND(
      (nb_commandes - LAG(nb_commandes) OVER (ORDER BY mois))
      / NULLIF(LAG(nb_commandes) OVER (ORDER BY mois), 0) * 100
    , 2)                                                         AS croissance_commandes_pct,
    ROUND(
      (panier_moyen - LAG(panier_moyen) OVER (ORDER BY mois))
      / NULLIF(LAG(panier_moyen) OVER (ORDER BY mois), 0) * 100
    , 2)                                                         AS croissance_panier_pct
  FROM kpis_commerciaux
),

-- ============================================================
-- ÉTAPE 5 : Compter les articles effectivement vendus par mois
-- ============================================================
-- sold_at IS NOT NULL : l'article a une date de vente → il est sorti du stock.
-- Cette CTE est le numérateur du ratio de rotation calculé à l'étape 6.
-- On sépare cette logique en CTE indépendante pour rester lisible
-- et ne pas mélanger les articles vendus et non vendus dans la même requête.
articles_vendus AS (
  SELECT
    FORMAT_DATE('%Y-%m', DATE(ii.sold_at))           AS mois,
    COUNT(ii.id)                                     AS nb_articles_vendus
  FROM \`bigquery-public-data.thelook_ecommerce.inventory_items\` AS ii
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.products\` AS p
    ON ii.product_id = p.id
  WHERE ii.sold_at IS NOT NULL
    AND p.category = 'Fashion Hoodies & Sweatshirts'
    AND DATE(ii.sold_at) BETWEEN date_debut AND date_fin
  GROUP BY mois
),

-- ============================================================
-- ÉTAPE 6 : Calculer le stock restant et la rotation par mois
-- ============================================================
-- sold_at IS NULL : l'article n'a pas encore été vendu → il est en stock.
-- On ne somme jamais les stocks entre plusieurs mois, on prend
-- MAX(created_at) pour photographier le stock au dernier jour du mois.
-- LEFT JOIN sur articles_vendus : certains mois pourraient ne pas avoir
--   d'articles vendus — on préfère un NULL qu'une ligne manquante.
-- rotation_stock = articles vendus / stock restant :
--   → ratio élevé : le stock s'écoule vite → risque de rupture imminente
--   → ratio faible : le stock dort → risque de surstock et coûts cachés
stock_fin_mois AS (
  SELECT
    FORMAT_DATE('%Y-%m', DATE(ii.created_at))        AS mois,
    MAX(DATE(ii.created_at))                         AS dernier_jour_du_mois,
    COUNT(ii.id)                                     AS stock_fin_mois,
    av.nb_articles_vendus,
    ROUND(
      av.nb_articles_vendus / NULLIF(COUNT(ii.id), 0)
    , 2)                                             AS rotation_stock
  FROM \`bigquery-public-data.thelook_ecommerce.inventory_items\` AS ii
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.products\` AS p
    ON ii.product_id = p.id
  LEFT JOIN articles_vendus AS av
    ON FORMAT_DATE('%Y-%m', DATE(ii.created_at)) = av.mois
  WHERE ii.sold_at IS NULL
    AND p.category = 'Fashion Hoodies & Sweatshirts'
    AND DATE(ii.created_at) BETWEEN date_debut AND date_fin
  GROUP BY mois, av.nb_articles_vendus
),

-- ============================================================
-- ÉTAPE 7 : Compter les ventes par canal d'acquisition par mois
-- ============================================================
-- On joint ventes_completes avec users pour récupérer traffic_source
-- (Search, Email, Social...) associé à chaque commande.
-- COUNT(DISTINCT order_id) : on compte des commandes uniques,
--   pas des articles, pour éviter les doublons.
canaux_acquisition AS (
  SELECT
    vc.mois,
    u.traffic_source                                 AS canal,
    COUNT(DISTINCT vc.order_id)                      AS nb_ventes_canal
  FROM ventes_completes AS vc
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.users\` AS u
    ON vc.user_id = u.id
  GROUP BY vc.mois, u.traffic_source
),

-- ============================================================
-- ÉTAPE 8 : Garder uniquement le canal dominant par mois
-- ============================================================
-- ROW_NUMBER() OVER (PARTITION BY mois ORDER BY nb_ventes_canal DESC) :
--   numérote les canaux du plus performant au moins performant,
--   en repartant de 1 à chaque nouveau mois.
-- WHERE rang = 1 : garde uniquement le premier de chaque mois.
-- La sous-requête est nécessaire car SQL évalue les colonnes
-- avant le WHERE — on ne peut pas filtrer sur rang dans le même SELECT
-- où on le calcule.
top_canal_par_mois AS (
  SELECT mois, canal, nb_ventes_canal
  FROM (
    SELECT
      mois,
      canal,
      nb_ventes_canal,
      ROW_NUMBER() OVER (PARTITION BY mois ORDER BY nb_ventes_canal DESC) AS rang
    FROM canaux_acquisition
  )
  WHERE rang = 1
),

-- ============================================================
-- ÉTAPE 9 : Compter les événements par session
-- ============================================================
-- On groupe par user_id + session_id pour avoir le nombre
-- d'actions par session.
-- Une session avec nb_events_session = 1 = l'utilisateur est arrivé
-- sur le site et reparti immédiatement sans rien faire → rebond.
sessions AS (
  SELECT
    user_id,
    session_id,
    COUNT(*) AS nb_events_session
  FROM \`bigquery-public-data.thelook_ecommerce.events\`
  WHERE DATE(created_at) BETWEEN date_debut AND date_fin
  GROUP BY user_id, session_id
),

-- ============================================================
-- ÉTAPE 10 : Calculer les taux de rebond et de conversion par mois
-- ============================================================
-- LEFT JOIN entre sessions et orders :
--   tous les visiteurs ne passent pas commande.
--   Un INNER JOIN exclurait les sessions sans achat et fausserait
--   les deux taux en divisant par un nombre trop petit.
-- taux_rebond : part des sessions avec un seul événement.
-- taux_conversion : nb de commandes uniques / nb de sessions uniques.
conversion_rebond AS (
  SELECT
    FORMAT_DATE('%Y-%m', DATE(o.created_at))         AS mois,
    ROUND(
      COUNTIF(s.nb_events_session = 1)
      / NULLIF(COUNT(*), 0) * 100
    , 2)                                             AS taux_rebond_pct,
    ROUND(
      COUNT(DISTINCT o.order_id)
      / NULLIF(COUNT(DISTINCT s.session_id), 0) * 100
    , 2)                                             AS taux_conversion_pct
  FROM sessions AS s
  LEFT JOIN \`bigquery-public-data.thelook_ecommerce.orders\` AS o
    ON s.user_id = o.user_id
    AND DATE(o.created_at) BETWEEN date_debut AND date_fin
  GROUP BY mois
),

-- ============================================================
-- ÉTAPE 11 : Répartition géographique des ventes par mois
-- ============================================================
-- On compte les commandes et le CA par pays + région pour
-- identifier les marchés les plus performants.
geo AS (
  SELECT
    vc.mois,
    u.country                                        AS pays,
    u.state                                          AS region,
    COUNT(DISTINCT vc.order_id)                      AS nb_commandes_geo,
    ROUND(SUM(vc.sale_price), 2)                     AS ca_geo
  FROM ventes_completes AS vc
  INNER JOIN \`bigquery-public-data.thelook_ecommerce.users\` AS u
    ON vc.user_id = u.id
  GROUP BY vc.mois, u.country, u.state
),

-- ============================================================
-- ÉTAPE 12 : Garder uniquement la région dominante par mois
-- ============================================================
-- Même logique que top_canal_par_mois avec ROW_NUMBER() :
-- on classe par CA décroissant et on filtre sur rang = 1
-- pour ne garder que la meilleure région par mois.
top_geo_par_mois AS (
  SELECT mois, pays, region, nb_commandes_geo, ca_geo
  FROM (
    SELECT
      mois,
      pays,
      region,
      nb_commandes_geo,
      ca_geo,
      ROW_NUMBER() OVER (PARTITION BY mois ORDER BY ca_geo DESC) AS rang
    FROM geo
  )
  WHERE rang = 1
)

-- ============================================================
-- REQUÊTE FINALE : Assembler toutes les CTEs en un seul tableau
-- ============================================================
-- On part de croissance_mensuelle qui contient déjà toutes les
-- colonnes de kpis_commerciaux + les colonnes de croissance.
-- Les autres CTEs sont collées via LEFT JOIN sur le mois :
-- LEFT JOIN et non INNER JOIN car certains mois peuvent ne pas
-- avoir de données dans toutes les CTEs — on préfère un NULL
-- qu'une ligne qui disparaît du résultat final.
-- ORDER BY mois ASC : résultats triés du plus ancien au plus récent.
SELECT
  cm.mois,
  cm.chiffre_affaires,
  cm.cout_total,
  cm.nb_commandes,
  cm.panier_moyen,
  cm.marge_brute,
  cm.taux_retour_pct,
  cm.delai_expedition_heures,
  cm.croissance_ca_pct,
  cm.croissance_commandes_pct,
  cm.croissance_panier_pct,
  s.stock_fin_mois,
  s.nb_articles_vendus,
  s.rotation_stock,
  s.dernier_jour_du_mois,
  tc.canal                                           AS top_canal,
  tc.nb_ventes_canal                                 AS nb_ventes_top_canal,
  cr.taux_rebond_pct,
  cr.taux_conversion_pct,
  tg.pays                                            AS top_pays,
  tg.region                                          AS top_region,
  tg.nb_commandes_geo,
  tg.ca_geo
FROM croissance_mensuelle AS cm
LEFT JOIN stock_fin_mois AS s
  ON cm.mois = s.mois
LEFT JOIN top_canal_par_mois AS tc
  ON cm.mois = tc.mois
LEFT JOIN conversion_rebond AS cr
  ON cm.mois = cr.mois
LEFT JOIN top_geo_par_mois AS tg
  ON cm.mois = tg.mois
ORDER BY cm.mois ASC;`;
