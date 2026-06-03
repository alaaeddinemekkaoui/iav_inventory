import { ShieldCheck, Users } from "lucide-react";
import { createUserAction } from "@/app/auth-actions";
import { Content, Field, PageHeader, Panel } from "@/components/inventory-ui";
import { listUsers, requireRole } from "@/lib/auth";
import { buttonStyles, cn, fieldStyles } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requireRole("SUPER_ADMIN");
  const users = await listUsers();

  return (
    <main>
      <PageHeader
        eyebrow="Super Admin"
        title="Utilisateurs"
        description="Creer les comptes utilisateurs, administrateurs et super administrateurs de l'application."
      />
      <Content>
        <section className="space-y-5">
          <Panel title="Creer un compte" icon={<ShieldCheck size={18} />} aside="Super admin uniquement">
            <form action={createUserAction} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_220px_auto] lg:items-end">
              <Field name="fullName" label="Nom complet" required />
              <Field name="username" label="Username" required />
              <Field name="password" label="Mot de passe" type="password" required minLength={6} />
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-slate-700">Role</span>
                <select name="role" required className={cn(fieldStyles, "h-10")}>
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Admin app</option>
                  <option value="SUPER_ADMIN">Super admin IT</option>
                </select>
              </label>
              <button className={buttonStyles()}>
                Creer
              </button>
            </form>
          </Panel>

          <Panel title="Comptes" icon={<Users size={18} />} aside={`${users.length} comptes`}>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 px-4 py-4 font-semibold">Nom complet</th>
                    <th className="border-b border-slate-200 px-4 py-4 font-semibold">Username</th>
                    <th className="border-b border-slate-200 px-4 py-4 font-semibold">Role</th>
                    <th className="border-b border-slate-200 px-4 py-4 font-semibold">Creation</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="even:bg-slate-50/60 hover:bg-teal-50/45">
                      <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-900">{user.fullName}</td>
                      <td className="border-b border-slate-100 px-4 py-4">{user.username}</td>
                      <td className="border-b border-slate-100 px-4 py-4">{roleLabel(user.role)}</td>
                      <td className="border-b border-slate-100 px-4 py-4">{new Date(user.createdAt).toLocaleDateString("fr-MA")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      </Content>
    </main>
  );
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    USER: "Utilisateur",
    ADMIN: "Admin app",
    SUPER_ADMIN: "Super admin IT",
  };
  return labels[role] ?? role;
}
