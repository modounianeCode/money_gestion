import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSavingsGoal, contributeGoal } from "@/app/actions";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function EpargnePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");
  const [goals, wallets] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    prisma.wallet.findMany({ where: { userId: user.id } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Épargne — objectifs</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Nouvel objectif (FCFA)</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await createSavingsGoal({
              name: String(fd.get("name")),
              targetAmount: Math.trunc(Number(fd.get("targetAmount"))),
              walletId: String(fd.get("walletId") || "") || undefined,
              deadline: String(fd.get("deadline") || "") || undefined,
            });
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <input name="name" required placeholder="Ex: Fonds urgence" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="targetAmount" type="number" min={1} required placeholder="Cible FCFA" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <select name="walletId" className="rounded-xl border px-3 py-2 dark:bg-zinc-900">
            <option value="">Compte lié (optionnel)</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <input name="deadline" type="date" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <button className="rounded-xl bg-emerald-600 py-2 font-medium text-white md:col-span-4">Créer</button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
          return (
            <Card key={g.id}>
              <div className="flex justify-between">
                <h3 className="font-semibold">{g.name}</h3>
                <span className="text-sm">{pct}%</span>
              </div>
              <p className="text-sm text-zinc-500">{formatFCFA(g.currentAmount)} / {formatFCFA(g.targetAmount)}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
              </div>
              <form
                action={async (fd: FormData) => {
                  "use server";
                  await contributeGoal(g.id, Math.trunc(Number(fd.get("amount"))));
                }}
                className="mt-3 flex gap-2"
              >
                <input name="amount" type="number" min={1} required placeholder="+ FCFA" className="flex-1 rounded-xl border px-3 py-2 dark:bg-zinc-900" />
                <button className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white">Épargner</button>
              </form>
            </Card>
          );
        })}
      </div>
      {goals.length === 0 && <Card><p className="text-sm text-zinc-500">Aucun objectif. Exemples : Urgence 300 000 F, Projet 500 000 F.</p></Card>}
    </div>
  );
}
