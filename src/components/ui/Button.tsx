import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

// Primary is a light pill on the dark page; secondary an outline of the same shape. Both give way under the press.
const styles: Record<Variant, string> = {
  primary: "bg-ink text-bg hover:bg-white",
  secondary: "border border-white/20 text-ink hover:border-white/40 hover:bg-white/[0.04]",
  ghost: "text-subtle hover:text-ink hover:bg-white/[0.05]",
};

const sizes = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-12 px-6 text-[16px]",
  sm: "h-9 px-3.5 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[transform,background-color,border-color,color] duration-100 ease-out active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${styles[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
