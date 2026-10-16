import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

// Auth.js v5 : Google OAuth + Email magic link
// Email utilise Resend en prod, Gmail SMTP en dev (voir lib/email.ts)
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Nodemailer({
      from:
        (process.env.EMAIL_PROVIDER ?? "gmail") === "resend"
          ? process.env.RESEND_FROM
          : process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendEmail({
          to: identifier,
          subject: "Connexion à Money Gestion",
          text: `Cliquez sur ce lien pour vous connecter : ${url}\nCe lien expire dans 24h.`,
          html: `<p>Cliquez sur ce lien pour vous connecter à <strong>Money Gestion</strong> :</p><p><a href="${url}">Se connecter</a></p><p>Ce lien expire dans 24h.</p>`,
        });
      },
      // Si Gmail configuré, NextAuth peut aussi envoyer directement via SMTP.
      // Sinon sendVerificationRequest ci-dessus prend le relais (log dev).
      ...(gmailUser && gmailPass
        ? {
            server: {
              host: "smtp.gmail.com",
              port: 587,
              auth: { user: gmailUser, pass: gmailPass },
            },
          }
        : { server: "smtp://localhost:1025?secure=false" }),
    }),
  ],
});
