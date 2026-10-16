import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertBudget } from "@/app/actions";
import { formatFCFA, currentYearMonth } from "@/lib/format";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");
  const { year, month } = currentYearMonth();
  const categories = await prisma.category.findMany({ where: { userId: user.id, type: { in: ["DEPENSE", "MIXTE"] } }, orderBy: { name: "asc" } });
  const budgets = await prisma.budget.findMany({ where: { userId: user.id, year, month }, include: { category: true } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Budgets — {month}/{year}</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Définir un plafond mensuel (FCFA)</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await upsertBudget({
              categoryId: String(fd.get("categoryId")),
              year,
              month,
              limit: Math.trunc(Number(fd.get("limit"))),
            });
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <select name="categoryId" required className="rounded-xl border px-3 py-2 dark:bg-zinc-900">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="limit" type="number" min={1} required placeholder="Plafond FCFA (ex: 50000)" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <button className="rounded-xl bg-emerald-600 py-2 font-medium text-white">Enregistrer</button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Plafonds actifs</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {budgets.map((b) => (
            <li key={b.id} className="flex justify-between">
              <span>{b.category.name} (alerte {b.alertThreshold}%)</span>
              <span className="font-bold">{formatFCFA(b.limit)}</span>
            </li>
          ))}
          {budgets.length === 0 && <p className="text-zinc-500">Aucun budget ce mois. Exemple : Nourriture 50 000 F, Transport 20 000 F.</p>}
        </ul>
      </Card>
    </div>
  );
}
