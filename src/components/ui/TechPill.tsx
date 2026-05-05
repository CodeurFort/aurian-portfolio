interface TechPillProps {
  label: string;
}
export function TechPill({ label }: TechPillProps) {
  return (
    <span className="mono inline-flex items-center px-2.5 py-1 text-[11px] uppercase tracking-widest text-text-muted border border-hairline rounded-full">
      {label}
    </span>
  );
}
