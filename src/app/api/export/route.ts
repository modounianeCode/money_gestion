import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return new Response("Non connecté", { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Introuvable", { status: 404 });
  const txs = await prisma.transaction.findMany({
    where: { userId: user.id },
    include: { category: true, wallet: true },
    orderBy: { date: "asc" },
  });
  const header = "date;type;montant_fcfa;compte;categorie;note\n";
  const rows = txs
    .map((t) =>
      [
        t.date.toISOString().slice(0, 10),
        t.type,
        String(t.amount),
        `"${t.wallet.name}"`,
        `"${t.category?.name ?? ""}"`,
        `"${(t.note ?? "").replace(/"/g, "'")}"`,
      ].join(";")
    )
    .join("\n");
  return new Response(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=transactions.csv",
    },
  });
}
