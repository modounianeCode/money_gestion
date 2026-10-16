import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDebt, payDebt } from "@/app/actions";
import { formatFCFA } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DettesPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");
  const debts = await prisma.debt.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Dettes</h1>
      <Card>
        <h2 className="mb-3 font-semibold">Nouvelle dette (FCFA)</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            await createDebt({
              creditor: String(fd.get("creditor")),
              initialAmount: Math.trunc(Number(fd.get("initialAmount"))),
              monthlyPayment: fd.get("monthlyPayment") ? Math.trunc(Number(fd.get("monthlyPayment"))) : undefined,
              dueDate: String(fd.get("dueDate") || "") || undefined,
            });
          }}
          className="grid gap-3 md:grid-cols-4"
        >
          <input name="creditor" required placeholder="Créancier" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="initialAmount" type="number" min={1} required placeholder="Montant FCFA" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="monthlyPayment" type="number" min={1} placeholder="Mensualité (opt.)" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <input name="dueDate" type="date" className="rounded-xl border px-3 py-2 dark:bg-zinc-900" />
          <button className="rounded-xl bg-emerald-600 py-2 font-medium text-white md:col-span-4">Ajouter</button>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {debts.map((d) => (
          <Card key={d.id}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{d.creditor}</h3>
              <Badge tone={d.status === "SOLDE" ? "green" : "red"}>{d.status}</Badge>
            </div>
            <p className="mt-1 text-sm">Initial : {formatFCFA(d.initialAmount)} • Reste : <strong>{formatFCFA(d.remainingAmount)}</strong></p>
            {d.status === "EN_COURS" && (
              <form action={async (fd: FormData) => { "use server"; await payDebt(d.id, Math.trunc(Number(fd.get("amount")))); }} className="mt-3 flex gap-2">
                <input name="amount" type="number" min={1} required placeholder="Rembourser FCFA" className="flex-1 rounded-xl border px-3 py-2 dark:bg-zinc-900" />
                <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white dark:bg-white dark:text-black">Payer</button>
              </form>
            )}
          </Card>
        ))}
      </div>
      {debts.length === 0 && <Card><p className="text-sm text-zinc-500">Aucune dette enregistrée.</p></Card>}
    </div>
  );
}
