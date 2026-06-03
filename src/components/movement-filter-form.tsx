"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";
import type { SortDirection } from "@/lib/search";

export function MovementFilterForm({
  basePath,
  query,
  sort,
  direction,
}: {
  basePath: string;
  query: string;
  sort: string;
  direction: SortDirection;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      replaceIfChanged(router, createHref(basePath, search, sort, direction));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [basePath, direction, router, search, sort]);

  function resetFilter() {
    setSearch("");
    replaceIfChanged(router, createHref(basePath, "", sort, direction));
  }

  return (
    <form action={basePath} className="grid gap-3 border-b border-slate-100 bg-[#f8faf8] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Recherche globale</span>
        <span className="relative">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nom, code, serie, localite, decision..."
            className={cn(fieldStyles, "h-10 w-full pl-10")}
          />
        </span>
      </label>
      <button type="button" onClick={resetFilter} className={buttonStyles({ variant: "secondary" })}>
        Reinitialiser
      </button>
    </form>
  );
}

function createHref(basePath: string, query: string, sort: string, direction: SortDirection) {
  const searchParams = new URLSearchParams();
  if (query.trim()) searchParams.set("q", query.trim());
  searchParams.set("sort", sort);
  searchParams.set("dir", direction);
  const queryString = searchParams.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function replaceIfChanged(router: ReturnType<typeof useRouter>, href: string) {
  if (`${window.location.pathname}${window.location.search}` !== href) {
    router.replace(href, { scroll: false });
  }
}
