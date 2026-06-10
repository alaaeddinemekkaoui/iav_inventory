"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { buttonStyles } from "@/lib/ui";

type LanShareInfo = {
  currentUrl: string;
  links: Array<{ label: string; url: string }>;
  primaryUrl: string;
  urls: string[];
  isLanReady: boolean;
};

export function LanShareSettings() {
  const [shareInfo, setShareInfo] = useState<LanShareInfo>();
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function loadShareInfo() {
    if (shareInfo) return shareInfo;

    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/lan-share", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load LAN link.");
      const data = (await response.json()) as LanShareInfo;
      setShareInfo(data);
      return data;
    } catch {
      setFailed(true);
      return undefined;
    } finally {
      setLoading(false);
    }
  }

  async function toggleReveal() {
    if (!revealed) await loadShareInfo();
    setRevealed((value) => !value);
  }

  async function copyShareUrl() {
    const data = await loadShareInfo();
    if (!data?.primaryUrl) return;

    try {
      await navigator.clipboard.writeText(data.primaryUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setFailed(true);
    }
  }

  const shareUrl = shareInfo?.primaryUrl;

  return (
    <div className="bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-medium text-slate-500">Lien web app</p>
          <p className="mt-1 truncate font-mono text-sm text-slate-800">
            {revealed && shareUrl ? shareUrl : failed ? "Lien indisponible" : "••••••••••••••••••••"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={toggleReveal} className={buttonStyles({ variant: "secondary" })}>
            {revealed ? <EyeOff size={17} /> : <Eye size={17} />}
            {revealed ? "Masquer" : "Afficher"}
          </button>
          <button type="button" onClick={copyShareUrl} disabled={loading} className={buttonStyles()}>
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? "Copie" : loading ? "Chargement" : "Copier"}
          </button>
          {revealed && shareUrl ? (
            <a href={shareUrl} target="_blank" rel="noreferrer" className={buttonStyles({ variant: "secondary" })}>
              <ExternalLink size={17} />
              Ouvrir
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
