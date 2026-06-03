import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "icon" | "icon-sm";
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
      "bg-teal-700 text-white shadow-sm hover:bg-teal-800": variant === "primary",
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950":
        variant === "secondary",
      "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50": variant === "danger",
      "text-slate-500 hover:bg-slate-100 hover:text-slate-950": variant === "ghost",
      "h-10 px-4 text-sm": size === "md",
      "h-9 px-3 text-xs": size === "sm",
      "size-10": size === "icon",
      "size-8": size === "icon-sm",
    },
    className,
  );
}

export const fieldStyles =
  "min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15";

export const dialogStyles =
  "fixed inset-0 m-auto max-h-[calc(100dvh-48px)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-xl backdrop:bg-slate-950/45";

