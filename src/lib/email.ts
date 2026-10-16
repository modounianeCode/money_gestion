import nodemailer from "nodemailer";
import { Resend } from "resend";

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

// Abstraction gratuite V1 :
// - dev local : Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
// - prod : Resend (RESEND_API_KEY), fallback Gmail
// Piloté par EMAIL_PROVIDER=gmail|resend
export async function sendEmail({ to, subject, text, html }: SendEmailArgs) {
  const provider = (process.env.EMAIL_PROVIDER ?? "gmail").toLowerCase();
  const from =
    provider === "resend"
      ? (process.env.RESEND_FROM ?? "Money Gestion <onboarding@resend.dev>")
      : (process.env.EMAIL_FROM ?? "Money Gestion <no-reply@example.com>");

  if (provider === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY manquant");
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html: html ?? `<p>${text}</p>`,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  // Gmail SMTP gratuit (mot de passe d'application)
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    // En dev sans config : log au lieu d'envoyer (magic link visible en console)
    console.log(`[email:dev] To=${to} Subject=${subject}\n${text}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  await transporter.sendMail({ from, to, subject, text, html: html ?? text });
}
