// use require to avoid missing type package for nodemailer in some environments
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
});
export async function sendEmail(to, subject, html) {
    const from = process.env.EMAIL_FROM || `no-reply@${process.env.SMTP_HOST || 'localhost'}`;
    const info = await transporter.sendMail({ from, to, subject, html });
    return info;
}
export function verificationEmailHtml(name, link) {
    return `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Verify your email</h2>
    <p>Hi ${name || ''},</p>
    <p>Thanks for registering. Please verify your email address by clicking the button below:</p>
    <p><a href="${link}" style="background:#7b1f2f;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Verify Email</a></p>
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p><a href="${link}">${link}</a></p>
    <hr />
    <p style="font-size:12px;color:#666">If you didn't request this, you can safely ignore this email.</p>
  </div>
  `;
}
export function resetPasswordEmailHtml(name, link) {
    return `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Password reset</h2>
    <p>Hi ${name || ''},</p>
    <p>We received a request to reset your password. Click the button below to set a new password:</p>
    <p><a href="${link}" style="background:#7b1f2f;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
    <p>If you didn't request this, you can ignore this email.</p>
    <hr />
    <p style="font-size:12px;color:#666">If you didn't request this, you can safely ignore this email.</p>
  </div>
  `;
}
