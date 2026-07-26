import nodemailer from "nodemailer";

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export async function sendTravelerEmail({ to, title, message, actionUrl }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("Demo email notification", { to, title, message, actionUrl });
    return { messageId: `logged_${Date.now()}`, accepted: [to], rejected: [], mode: "console" };
  }

  const host = requireEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const from = process.env.EMAIL_FROM || user;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #172033;">
      <h2>${title}</h2>
      <p>${message}</p>
      ${actionUrl ? `<p><a href="${actionUrl}" style="display:inline-block;background:#006fcf;color:white;padding:12px 16px;text-decoration:none;border-radius:4px;">View recovery plan</a></p>` : ""}
    </div>
  `;

  return transporter.sendMail({
    from,
    to,
    subject: title,
    text: actionUrl ? `${message}\n\n${actionUrl}` : message,
    html
  });
}
