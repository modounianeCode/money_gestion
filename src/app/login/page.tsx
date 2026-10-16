import { signIn } from "@/lib/auth";
import { Card } from "@/components/ui";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md pt-16">
      <Card className="text-center">
        <h1 className="text-2xl font-bold">Money Gestion</h1>
        <p className="mt-1 text-sm text-zinc-500">Connectez-vous pour piloter votre argent en FCFA.</p>
        <div className="mt-6 flex flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button className="w-full rounded-xl bg-zinc-900 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
              Continuer avec Google
            </button>
          </form>
          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("nodemailer", { email: formData.get("email"), redirectTo: "/dashboard" });
            }}
            className="flex flex-col gap-2"
          >
            <input
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="rounded-xl border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-500">
              Recevoir un lien par email
            </button>
          </form>
          <p className="text-xs text-zinc-400">Gratuit : Gmail SMTP en dev, Resend en prod.</p>
        </div>
      </Card>
    </div>
  );
}
