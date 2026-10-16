import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaults } from "@/app/actions";
import { getDashboard } from "@/lib/data";
import { formatFCFA, currentYearMonth, MONTHS_FR } from "@/lib/format";
import { Card, Kpi, Badge } from "@/components/ui";
import { DonutDepenses, CourbeMensuelle } from "@/components/charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  await ensureDefaults(user.id);
  const { year, month } = currentYearMonth();
  const d = await getDashboard(user.id, year, month);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="text-sm text-zinc-500">
            {MONTHS_FR[month - 1]} {year} • {d.wallets.length} comptes • FCFA
          </p>
        </div>
        <Badge tone={d.tauxEpargne >= 20 ? "green" : d.tauxEpargne >= 0 ? "amber" : "red"}>
          Épargne {d.tauxEpargne}%
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Solde total" value={formatFCFA(d.totalBalance)} sub={d.wallets.map((w) => `${w.name}: ${formatFCFA(w.balance)}`).join(" • ")} />
        <Kpi label="Revenus du mois" value={formatFCFA(d.revenus)} sub="Entrées" />
        <Kpi label="Dépenses du mois" value={formatFCFA(d.depenses)} sub="Sorties" />
        <Kpi label="Reste à vivre" value={formatFCFA(d.revenus - d.depenses)} sub="Revenus - dépenses" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Dépenses par catégorie</h2>
          <DonutDepenses data={d.byCategory} />
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">6 derniers mois</h2>
          <CourbeMensuelle data={d.months} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Budgets du mois</h2>
          {d.budgetStatus.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun budget. Créez-en depuis la page Budgets.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {d.budgetStatus.map((b) => (
                <li key={b.id}>
                  <div className="flex justify-between text-sm">
                    <span>{b.category.name}</span>
                    <span className={b.alert ? "font-bold text-red-600" : ""}>
                      {formatFCFA(b.spent)} / {formatFCFA(b.limit)} • {b.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${b.pct >= 100 ? "bg-red-600" : b.alert ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(100, b.pct)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Dernières transactions</h2>
          {d.recent.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune transaction ce mois.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {d.recent.map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <span>
                    {t.category?.name ?? t.type} <span className="text-zinc-400">• {t.wallet.name}</span>
                    {t.note ? <span className="text-zinc-400"> — {t.note}</span> : null}
                  </span>
                  <span className={t.type === "REVENU" ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                    {t.type === "REVENU" ? "+" : "-"}
                    {formatFCFA(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Objectifs épargne</h2>
          {d.goals.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun objectif. Créez-en depuis Épargne.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {d.goals.slice(0, 4).map((g) => (
                <li key={g.id} className="flex justify-between">
                  <span>{g.name}</span>
                  <span>
                    {formatFCFA(g.currentAmount)} / {formatFCFA(g.targetAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Dettes en cours</h2>
          {d.debts.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucune dette. 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {d.debts.slice(0, 4).map((x) => (
                <li key={x.id} className="flex justify-between">
                  <span>{x.creditor}</span>
                  <span className="font-semibold">reste {formatFCFA(x.remainingAmount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
