"use client";
import { motion } from "framer-motion";

interface EditorialTitleProps {
  children: React.ReactNode;
  size?: "xl" | "lg" | "md";
  as?: "h1" | "h2" | "h3";
  className?: string;
}

const sizes = {
  xl: "text-[clamp(72px,12vw,160px)] leading-[0.95]",
  lg: "text-[clamp(40px,6vw,72px)] leading-[1.05]",
  md: "text-[clamp(28px,4vw,44px)] leading-[1.1]",
};

export function EditorialTitle({
  children,
  size = "lg",
  as = "h2",
  className = "",
}: EditorialTitleProps) {
  // Cast to avoid Framer Motion 12 strict children-typing issue on dynamic tags
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag = motion[as] as any;
  return (
    <Tag
      className={`serif-italic text-text ${sizes[size]} ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </Tag>
  );
}
