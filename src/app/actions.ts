"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requireUserId() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) throw new Error("Non connecté");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Utilisateur introuvable");
  return user.id;
}

export async function ensureDefaults(userId: string) {
  const walletCount = await prisma.wallet.count({ where: { userId } });
  if (walletCount === 0) {
    await prisma.wallet.createMany({
      data: [
        { userId, name: "Espèces", type: "ESPECES", color: "#10b981", icon: "wallet" },
        { userId, name: "Épargne", type: "EPARGNE", color: "#f59e0b", icon: "piggy-bank" },
      ],
    });
  }
  const catCount = await prisma.category.count({ where: { userId } });
  if (catCount === 0) {
    const defaults: { name: string; type: "REVENU" | "DEPENSE"; color: string }[] = [
      { name: "Salaire", type: "REVENU", color: "#10b981" },
      { name: "Business", type: "REVENU", color: "#0ea5e9" },
      { name: "Autres revenus", type: "REVENU", color: "#8b5cf6" },
      { name: "Nourriture", type: "DEPENSE", color: "#f97316" },
      { name: "Transport", type: "DEPENSE", color: "#6366f1" },
      { name: "Logement", type: "DEPENSE", color: "#ef4444" },
      { name: "Santé", type: "DEPENSE", color: "#ec4899" },
      { name: "Loisirs", type: "DEPENSE", color: "#eab308" },
      { name: "Épargne", type: "DEPENSE", color: "#f59e0b" },
      { name: "Dettes", type: "DEPENSE", color: "#991b1b" },
      { name: "Autres dépenses", type: "DEPENSE", color: "#6b7280" },
    ];
    await prisma.category.createMany({ data: defaults.map((c) => ({ userId, ...c })) });
  }
}

const transactionSchema = z.object({
  walletId: z.string().min(1),
  categoryId: z.string().optional(),
  type: z.enum(["REVENU", "DEPENSE", "TRANSFERT"]),
  amount: z.number().int().positive(),
  date: z.string().min(1),
  note: z.string().max(500).optional(),
  toWalletId: z.string().optional(),
});

export async function createTransaction(input: z.infer<typeof transactionSchema>) {
  const userId = await requireUserId();
  const parsed = transactionSchema.parse(input);
  await prisma.transaction.create({
    data: {
      userId,
      walletId: parsed.walletId,
      toWalletId: parsed.toWalletId || null,
      categoryId: parsed.categoryId || null,
      type: parsed.type,
      amount: parsed.amount,
      date: new Date(parsed.date),
      note: parsed.note || null,
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

export async function deleteTransaction(id: string) {
  const userId = await requireUserId();
  await prisma.transaction.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  year: z.number().int(),
  month: z.number().int().min(1).max(12),
  limit: z.number().int().positive(),
});

export async function upsertBudget(input: z.infer<typeof budgetSchema>) {
  const userId = await requireUserId();
  const parsed = budgetSchema.parse(input);
  await prisma.budget.upsert({
    where: {
      userId_categoryId_year_month: {
        userId,
        categoryId: parsed.categoryId,
        year: parsed.year,
        month: parsed.month,
      },
    },
    update: { limit: parsed.limit },
    create: { userId, ...parsed },
  });
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.number().int().positive(),
  walletId: z.string().optional(),
  deadline: z.string().optional(),
});

export async function createSavingsGoal(input: z.infer<typeof goalSchema>) {
  const userId = await requireUserId();
  const parsed = goalSchema.parse(input);
  await prisma.savingsGoal.create({
    data: {
      userId,
      name: parsed.name,
      targetAmount: parsed.targetAmount,
      walletId: parsed.walletId || null,
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
    },
  });
  revalidatePath("/epargne");
  revalidatePath("/dashboard");
}

export async function contributeGoal(id: string, amount: number) {
  const userId = await requireUserId();
  await prisma.savingsGoal.updateMany({
    where: { id, userId },
    data: { currentAmount: { increment: Math.trunc(amount) } },
  });
  revalidatePath("/epargne");
}

const debtSchema = z.object({
  creditor: z.string().min(1).max(100),
  initialAmount: z.number().int().positive(),
  monthlyPayment: z.number().int().optional(),
  dueDate: z.string().optional(),
  description: z.string().max(500).optional(),
});

export async function createDebt(input: z.infer<typeof debtSchema>) {
  const userId = await requireUserId();
  const parsed = debtSchema.parse(input);
  await prisma.debt.create({
    data: {
      userId,
      creditor: parsed.creditor,
      initialAmount: parsed.initialAmount,
      remainingAmount: parsed.initialAmount,
      monthlyPayment: parsed.monthlyPayment ?? null,
      dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
      description: parsed.description || null,
    },
  });
  revalidatePath("/dettes");
}

export async function payDebt(id: string, amount: number) {
  const userId = await requireUserId();
  const debt = await prisma.debt.findFirst({ where: { id, userId } });
  if (!debt) throw new Error("Dette introuvable");
  const remaining = Math.max(0, debt.remainingAmount - Math.trunc(amount));
  await prisma.debt.update({
    where: { id },
    data: { remainingAmount: remaining, status: remaining === 0 ? "SOLDE" : "EN_COURS" },
  });
  revalidatePath("/dettes");
}
