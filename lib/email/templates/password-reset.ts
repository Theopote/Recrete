export function passwordResetEmail(resetUrl: string) {
  const subject = "Reset your Recrete · 砼憶 password";

  const text = [
    "You requested a password reset for your Recrete account.",
    "",
    `Reset your password: ${resetUrl}`,
    "",
    "This link expires in 1 hour. If you did not request this, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;font-size:18px;">Reset your password</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;">
        You requested a password reset for your <strong>Recrete · 砼憶</strong> account.
      </p>
      <p style="margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#b87333;color:#fff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:14px;">
          Reset Password
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">
        Or copy this link:<br />
        <a href="${resetUrl}" style="color:#b87333;word-break:break-all;">${resetUrl}</a>
      </p>
      <p style="color:#94a3b8;font-size:11px;margin-top:24px;">
        This link expires in 1 hour. If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `;

  return { subject, html, text };
}
