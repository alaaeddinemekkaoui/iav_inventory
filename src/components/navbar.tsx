"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  Boxes,
  ChevronDown,
  FileClock,
  FileInput,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { logoutAction } from "@/app/auth-actions";
import type { CurrentUser, UserRole } from "@/lib/auth";
import { buttonStyles, cn } from "@/lib/ui";

const navItems: Array<{ href: string; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventaire", icon: Boxes },
  { href: "/dispatch", label: "Dispatch", icon: FileInput },
  { href: "/mutation", label: "Mutation", icon: ArrowRightLeft },
  { href: "/decharge", label: "Decharge", icon: ShieldCheck },
];

const roleRank: Record<UserRole, number> = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

function canSee(user: CurrentUser, minRole: UserRole) {
  return roleRank[user.role] >= roleRank[minRole];
}

export function Navbar({ user }: { user?: CurrentUser }) {
  const pathname = usePathname();
  if (pathname === "/login" || !user) return null;

  return (
    <header className="sticky top-0 z-20 px-3 pt-3 sm:px-5">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-md">
        <Link href="/" aria-label="Accueil Inventaire IAV" className="flex shrink-0 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-teal-700">
          <span className="grid size-10 place-items-center rounded-lg border border-slate-100 bg-white">
            <Image src="/iav-logo.png" alt="" width={36} height={36} className="size-9 rounded-full object-contain" priority />
          </span>
          <span className="hidden sm:block">
            <span className="block text-sm font-semibold text-slate-950">Inventaire IAV</span>
            <span className="mt-0.5 block text-xs text-slate-500">Gestion du parc</span>
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 lg:justify-center" aria-label="Navigation principale">
          {navItems.map((item) => {
            const Icon = item.icon;
            const path = item.href.split("?")[0];
            const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-teal-700",
                  isActive ? "bg-teal-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <details className="group relative shrink-0">
          <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-700 [&::-webkit-details-marker]:hidden">
            <span className="grid size-7 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <UserRound size={16} />
            </span>
            <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-700 xl:block">{user.fullName}</span>
            <ChevronDown size={14} className="hidden text-slate-400 sm:block" />
          </summary>
          <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-md">
            <div className="border-b border-slate-100 px-2 pb-3 pt-1">
              <p className="text-xs font-medium text-slate-500">Profil</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-950">{user.fullName}</p>
              <p className="mt-0.5 text-xs text-slate-500">{user.role}</p>
            </div>
            <div className="grid gap-1 py-2">
              <ProfileLink href="/history" icon={<FileClock size={16} />} label="Historique" />
              {canSee(user, "ADMIN") ? <ProfileLink href="/settings" icon={<Settings size={16} />} label="Parametres" /> : null}
              {canSee(user, "SUPER_ADMIN") ? <ProfileLink href="/users" icon={<Users size={16} />} label="Utilisateurs" /> : null}
            </div>
            <form action={logoutAction} className="border-t border-slate-100 pt-2">
              <button className={buttonStyles({ variant: "ghost", size: "sm", className: "w-full justify-start text-slate-600" })}>
                <LogOut size={16} />
                Deconnexion
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}

function ProfileLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 outline-none hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-teal-700">
      {icon}
      {label}
    </Link>
  );
}
