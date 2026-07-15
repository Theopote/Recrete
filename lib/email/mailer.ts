import "server-only";

import nodemailer from "nodemailer";
import { passwordResetEmail } from "@/lib/email/templates/password-reset";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
  );
}

function getFromAddress() {
  return process.env.SMTP_FROM ?? "Recrete <noreply@recrete.io>";
}

function createTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendEmail(input: SendEmailInput): Promise<{
  sent: boolean;
  devMode?: boolean;
  previewUrl?: string;
}> {
  if (!isEmailConfigured()) {
    console.log(`[email:dev] To: ${input.to}`);
    console.log(`[email:dev] Subject: ${input.subject}`);
    console.log(`[email:dev] Body:\n${input.text ?? input.html}`);
    return { sent: false, devMode: true };
  }

  const transport = createTransport();
  const info = await transport.sendMail({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  return { sent: true, previewUrl: nodemailer.getTestMessageUrl(info) || undefined };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { subject, html, text } = passwordResetEmail(resetUrl);
  return sendEmail({ to, subject, html, text });
}
