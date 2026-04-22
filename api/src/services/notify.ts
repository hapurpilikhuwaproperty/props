import nodemailer from 'nodemailer';
import { config } from '../config';

// simple SMTP mailer; in prod swap to SES/SendGrid provider
export async function sendLeadEmail(subject: string, body: string, toOverride?: string) {
  if (!config.email.host) return;
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
  });
  await transporter.sendMail({
    from: config.email.from,
    to: toOverride || config.email.from,
    subject,
    text: body,
  });
}
