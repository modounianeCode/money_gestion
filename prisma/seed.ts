import { prisma } from "@/lib/prisma";

// Seed idempotent : wallets + categories par defaut (FCFA)
// Usage : npx tsx prisma/seed.ts  (ou node --loader ts-node/esm)
// Pour V1 on cree pour un user donne via USER_EMAIL, sinon affiche la liste.
const DEFAULT_WALLETS = [
  { name: "Espèces", type: "ESPECES" as const, color: "#10b981", icon: "wallet" },
  { name: "Épargne", type: "EPARGNE" as const, color: "#f59e0b", icon: "piggy-bank" },
];

const DEFAULT_CATEGORIES: { name: string; type: "REVENU" | "DEPENSE"; color: string }[] = [
  { name: "Salaire", type: "REVENU", color: "#10b981" },
  { name: "Business", type: "REVENU", color: "#0ea5e9" },
  { name: "Autres revenus", type: "REVENU", color: "#8b5cf6" },
  { name: "Nourriture", type: "DEPENSE", color: "#f97316" },
  { name: "Transport", type: "DEPENSE", color: "#6366f1" },
  { name: "Logement", type: "DEPENSE", color: "#ef4444" },
  { name: "Santé", type: "DEPENSE", color: "#ec4899" },
  { name: "Éducation", type: "DEPENSE", color: "#14b8a6" },
  { name: "Loisirs", type: "DEPENSE", color: "#eab308" },
  { name: "Épargne", type: "DEPENSE", color: "#f59e0b" },
  { name: "Dettes", type: "DEPENSE", color: "#991b1b" },
  { name: "Autres dépenses", type: "DEPENSE", color: "#6b7280" },
];

async function main() {
  const email = process.env.USER_EMAIL;
  if (!email) {
    const users = await prisma.user.findMany({ select: { email: true } });
    console.log("Passez USER_EMAIL=... pour seeder. Users existants :", users);
    return;
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`User introuvable : ${email}`);

  for (const w of DEFAULT_WALLETS) {
    await prisma.wallet.upsert({
      where: { id: `${user.id}-${w.name}` },
      update: {},
      create: { id: `${user.id}-${w.name}`, userId: user.id, ...w, initialBalance: 0 },
    });
  }
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: c.name } },
      update: {},
      create: { userId: user.id, ...c },
    });
  }
  console.log(`Seed OK pour ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
