import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FlashToast } from "@/components/flash-toast";
import { Navbar } from "@/components/navbar";
import { getCurrentUser } from "@/lib/auth";
import { getFlashMessage } from "@/lib/flash";
import { cn } from "@/lib/ui";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inventaire IAV",
  description: "Application de gestion d'inventaire IAV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userPromise = getCurrentUser();
  const flashPromise = getFlashMessage();

  return (
    <html lang="fr" className={cn(geistSans.variable, geistMono.variable, "h-full antialiased")}>
      <body className="min-h-full bg-iav-background text-slate-950">
        <Shell userPromise={userPromise} flashPromise={flashPromise}>{children}</Shell>
      </body>
    </html>
  );
}

async function Shell({
  userPromise,
  flashPromise,
  children,
}: {
  userPromise: ReturnType<typeof getCurrentUser>;
  flashPromise: ReturnType<typeof getFlashMessage>;
  children: React.ReactNode;
}) {
  const [user, flash] = await Promise.all([userPromise, flashPromise]);

  return (
    <div className="min-h-dvh">
      {flash ? <FlashToast key={flash.id} flash={flash} /> : null}
      <Navbar user={user} />
      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}
