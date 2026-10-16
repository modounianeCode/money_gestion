import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaults, createTransaction, deleteTransaction } from "@/app/actions";
import { formatFCFA } from "@/lib/format";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");
  await ensureDefaults(user.id);

  const [wallets, categories, transactions] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: user.id } }),
    prisma.category.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Transactions</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Nouvelle transaction (FCFA)</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await createTransaction({
              walletId: String(fd.get("walletId")),
              categoryId: String(fd.get("categoryId") || "") || undefined,
              type: (String(fd.get("type")) as "REVENU" | "DEPENSE" | "TRANSFERT") ?? "DEPENSE",
              amount: Math.trunc(Number(fd.get("amount"))),
              date: String(fd.get("date")),
              note: String(fd.get("note") || "") || undefined,
            });
          }}
          className="grid gap-3 md:grid-cols-3"
        >
          <select name="walletId" required className="rounded-xl border px-3 py-2 dark:bg-zinc-900">
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select name="categoryId" className="rounded-xl border px-3 py-2 dark:bg-zinc-900">
            <option value="">Sans catégorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select name="type" className="rounded-xl border px-3 py-2 dark:bg-zinc-900">
            <option value="DEPENSE">Dépense</option>
            <option value="REVENU">Revenu</option>
            <option value="TRANSFERT">Transfert</option>
          </select>
          <input name="amount" type="number" min={1} required placeholder="Montant FCFA" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="note" placeholder="Note (optionnel)" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <button className="rounded-xl bg-emerald-600 py-2 font-medium text-white md:col-span-3">Ajouter</button>
        </form>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Historique (100 dernières)</h2>
        <ul className="flex flex-col gap-2">
          {transactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 text-sm">
              <span>
                {t.date.toLocaleDateString("fr-FR")} • {t.category?.name ?? t.type} • {t.wallet.name}
                {t.note ? ` — ${t.note}` : ""}
              </span>
              <span className="flex items-center gap-3">
                <span className={t.type === "REVENU" ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                  {t.type === "REVENU" ? "+" : "-"}{formatFCFA(t.amount)}
                </span>
                <form action={async () => { "use server"; await deleteTransaction(t.id); }}>
                  <button className="text-zinc-400 hover:text-red-600">✕</button>
                </form>
              </span>
            </li>
          ))}
          {transactions.length === 0 && <p className="text-sm text-zinc-500">Aucune transaction.</p>}
        </ul>
      </Card>
    </div>
  );
}
