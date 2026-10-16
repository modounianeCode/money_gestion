# Money Gestion 💰

Application web de gestion d'argent personnel en **FCFA** : suivi Espèces & Épargne, budgets mensuels avec alertes, objectifs épargne, dettes, import PDF et export CSV.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Neon Postgres** + Prisma 6 (`mg_*` tables)
- **Auth.js v5** : Google OAuth + Email magic link (Gmail SMTP en dev, Resend en prod — 0 FCFA)
- **Recharts** pour le dashboard

## Démarrage

```bash
npm install
cp .env.example .env   # puis renseignez DATABASE_URL, AUTH_SECRET, clés Google/Email
npm run dev            # http://localhost:3000/login
```

Première connexion : les comptes (Espèces, Épargne) et catégories par défaut sont créés automatiquement.

## Scripts

| Commande            | Usage                              |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Serveur de développement           |
| `npm run build`     | Build de production                |
| `npm run lint`      | Lint ESLint                        |
| `npx prisma studio` | Explorer la base Neon              |

## Pages

`/dashboard` · `/transactions` · `/budgets` · `/epargne` · `/dettes` · `/import` (PDF + export CSV) · `/login`
