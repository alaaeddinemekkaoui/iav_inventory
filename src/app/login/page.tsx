import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { defaultSuperAdmin, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center bg-[#eef3ef] px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-[#f8faf8] px-6 py-6">
          <div className="flex items-center gap-4">
            <Image src="/iav-logo.png" alt="Logo IAV Hassan II" width={72} height={72} className="size-18 rounded-full object-contain" priority />
            <div>
              <p className="text-lg font-semibold text-slate-950 text-balance">Inventaire IAV</p>
              <p className="mt-1 text-sm text-slate-500 text-pretty">Connexion admin et utilisateurs</p>
            </div>
          </div>
        </div>

        <LoginForm defaultUsername={defaultSuperAdmin.username} defaultPassword={defaultSuperAdmin.password} />
      </section>
    </main>
  );
}
