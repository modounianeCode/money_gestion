import { prisma } from "@/lib/prisma";

export async function getDashboard(userId: string, year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [wallets, transactions, budgets, goals, debts, categories] = await Promise.all([
    prisma.wallet.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true, wallet: true },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.budget.findMany({ where: { userId, year, month }, include: { category: true } }),
    prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.debt.findMany({ where: { userId, status: "EN_COURS" }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  // Soldes par wallet = initial + revenus - depenses (+ transferts)
  const allTx = await prisma.transaction.findMany({ where: { userId }, select: { walletId: true, toWalletId: true, type: true, amount: true } });
  const balanceByWallet = new Map<string, number>();
  for (const w of wallets) balanceByWallet.set(w.id, w.initialBalance);
  for (const t of allTx) {
    if (t.type === "REVENU") balanceByWallet.set(t.walletId, (balanceByWallet.get(t.walletId) ?? 0) + t.amount);
    else if (t.type === "DEPENSE") balanceByWallet.set(t.walletId, (balanceByWallet.get(t.walletId) ?? 0) - t.amount);
    else {
      balanceByWallet.set(t.walletId, (balanceByWallet.get(t.walletId) ?? 0) - t.amount);
      if (t.toWalletId) balanceByWallet.set(t.toWalletId, (balanceByWallet.get(t.toWalletId) ?? 0) + t.amount);
    }
  }
  const totalBalance = [...balanceByWallet.values()].reduce((a, b) => a + b, 0);

  const revenus = transactions.filter((t) => t.type === "REVENU").reduce((a, t) => a + t.amount, 0);
  const depenses = transactions.filter((t) => t.type === "DEPENSE").reduce((a, t) => a + t.amount, 0);
  const tauxEpargne = revenus > 0 ? Math.round(((revenus - depenses) / revenus) * 100) : 0;

  // Depenses par categorie
  const byCategory = new Map<string, { name: string; color: string; total: number }>();
  for (const t of transactions) {
    if (t.type !== "DEPENSE") continue;
    const key = t.categoryId ?? "sans";
    const prev = byCategory.get(key) ?? { name: t.category?.name ?? "Sans catégorie", color: t.category?.color ?? "#6b7280", total: 0 };
    prev.total += t.amount;
    byCategory.set(key, prev);
  }

  // Budget vs reel
  const budgetStatus = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.type === "DEPENSE" && t.categoryId === b.categoryId)
      .reduce((a, t) => a + t.amount, 0);
    const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
    return { ...b, spent, pct, alert: pct >= b.alertThreshold };
  });

  // Courbe 6 derniers mois (revenus vs depenses)
  const months: { key: string; label: string; revenus: number; depenses: number }[] = [];
  const now = new Date(year, month - 1, 1);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleDateString("fr-FR", { month: "short" }),
      revenus: 0,
      depenses: 0,
    });
  }
  const sixStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const sixTx = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixStart, lt: end } },
    select: { date: true, type: true, amount: true },
  });
  for (const t of sixTx) {
    const k = `${t.date.getFullYear()}-${t.date.getMonth() + 1}`;
    const m = months.find((x) => x.key === k);
    if (!m) continue;
    if (t.type === "REVENU") m.revenus += t.amount;
    else if (t.type === "DEPENSE") m.depenses += t.amount;
  }

  return {
    wallets: wallets.map((w) => ({ ...w, balance: balanceByWallet.get(w.id) ?? w.initialBalance })),
    totalBalance,
    revenus,
    depenses,
    tauxEpargne,
    byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    budgetStatus,
    months,
    recent: transactions.slice(0, 8),
    goals,
    debts,
    categories,
  };
}
