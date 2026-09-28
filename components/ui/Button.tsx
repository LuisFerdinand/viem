import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "ghost-light" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-forest-700 text-white shadow-soft hover:bg-forest-800",
  accent: "bg-leaf-400 text-forest-950 shadow-soft hover:bg-leaf-300",
  secondary: "border border-forest-200 bg-white text-forest-800 hover:border-forest-300 hover:bg-forest-50",
  ghost: "text-forest-700 hover:bg-forest-100",
  "ghost-light": "border border-white/30 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/10",
  danger: "bg-crit-700 text-white hover:bg-crit-500",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", size = "md", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type ButtonAnchorProps = ComponentProps<"a"> & { variant?: ButtonVariant; size?: ButtonSize };

/** For downloads and external links, where next/link is not appropriate. */
export function ButtonAnchor({ variant = "primary", size = "md", className, ...props }: ButtonAnchorProps) {
  return <a className={buttonClass(variant, size, className)} {...props} />;
}
