"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { clearFlashAction } from "@/app/flash-actions";
import type { FlashMessage } from "@/lib/flash";
import { buttonStyles, cn } from "@/lib/ui";

export function FlashToast({ flash }: { flash: FlashMessage }) {
  const [visible, setVisible] = useState(true);
  const isSuccess = flash.type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setVisible(false);
      void clearFlashAction();
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, []);

  function dismiss() {
    setVisible(false);
    void clearFlashAction();
  }

  if (!visible) return null;

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={cn(
        "fixed right-4 top-4 z-50 flex w-[min(420px,calc(100vw-32px))] items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg",
        isSuccess ? "border-iav-green/25 text-iav-green" : "border-iav-red/25 text-iav-red",
      )}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium leading-5">{flash.message}</p>
      <button type="button" onClick={dismiss} aria-label="Fermer le message" className={buttonStyles({ variant: "ghost", size: "icon-sm", className: "shrink-0" })}>
        <X size={17} />
      </button>
    </div>
  );
}
