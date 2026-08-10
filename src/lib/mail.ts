import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "./prisma";

/**
 * Envio de e-mails transacionais.
 *
 * Com SMTP configurado (SMTP_HOST/SMTP_USER/SMTP_PASS) o e-mail é enviado de
 * verdade. Sem SMTP, que é o caso da avaliação em ambiente local, a mensagem
 * é gravada na tabela EmailLog e impressa no console, ficando visível em
 * /admin/emails. O restante do sistema não precisa saber a diferença.
 */

type SendInput = {
  to: string;
  subject: string;
  html: string;
};

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
}

export async function sendEmail({ to, subject, html }: SendInput): Promise<void> {
  let status = "REGISTRADO";
  let error: string | null = null;

  if (smtpConfigured()) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT ?? 587) === 465,
        auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
      });

      await transport.sendMail({
        from: process.env.SMTP_FROM ?? "COMPIA Editora <nao-responda@compia.com.br>",
        to,
        subject,
        html,
      });
      status = "ENVIADO";
    } catch (err) {
      status = "FALHOU";
      error = err instanceof Error ? err.message : String(err);
      console.error("[mail] falha no envio:", error);
    }
  } else {
    console.info(`[mail] (sem SMTP) para ${to}: ${subject}`);
  }

  try {
    await prisma.emailLog.create({
      data: { to, subject, body: html, status, error },
    });
  } catch (err) {
    console.error("[mail] falha ao registrar e-mail:", err);
  }
}

// Modelos de mensagem

function layout(title: string, content: string): string {
  return `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f1f5f9;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0f172a;color:#ffffff;padding:20px 24px">
      <strong style="font-size:18px;letter-spacing:.02em">COMPIA Editora</strong>
      <div style="opacity:.7;font-size:13px">Livros e materiais de Inteligência Artificial</div>
    </div>
    <div style="padding:24px;color:#0f172a;font-size:15px;line-height:1.6">
      <h1 style="font-size:19px;margin:0 0 14px">${title}</h1>
      ${content}
    </div>
    <div style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px">
      Esta é uma mensagem automática, não responda a este e-mail.
    </div>
  </div>
</div>`;
}

export function welcomeEmail(name: string): { subject: string; html: string } {
  return {
    subject: "Bem-vindo(a) à COMPIA Editora",
    html: layout(
      `Olá, ${name}!`,
      `<p>Sua conta foi criada com sucesso. Agora você pode acompanhar seus pedidos e baixar seus e-books na área do cliente.</p>`
    ),
  };
}

type OrderEmailData = {
  number: string;
  customerName: string;
  totalFormatted: string;
  statusLabel: string;
  itemLines: string[];
  extra?: string;
  url: string;
};

export function orderPlacedEmail(data: OrderEmailData) {
  return {
    subject: `Pedido ${data.number} recebido`,
    html: layout(
      `Recebemos seu pedido, ${data.customerName}!`,
      `
      <p>Pedido <strong>${data.number}</strong>, situação: <strong>${data.statusLabel}</strong>.</p>
      <ul style="padding-left:18px;margin:12px 0">${data.itemLines
        .map((line) => `<li>${line}</li>`)
        .join("")}</ul>
      <p>Total: <strong>${data.totalFormatted}</strong></p>
      ${data.extra ?? ""}
      <p><a href="${data.url}" style="display:inline-block;margin-top:12px;background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Acompanhar pedido</a></p>`
    ),
  };
}

export function paymentApprovedEmail(data: OrderEmailData) {
  return {
    subject: `Pagamento aprovado - pedido ${data.number}`,
    html: layout(
      "Pagamento aprovado!",
      `
      <p>O pagamento do pedido <strong>${data.number}</strong> foi confirmado.</p>
      ${data.extra ?? ""}
      <p><a href="${data.url}" style="display:inline-block;margin-top:12px;background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver pedido</a></p>`
    ),
  };
}

export function orderStatusEmail(data: OrderEmailData) {
  return {
    subject: `Pedido ${data.number}: ${data.statusLabel}`,
    html: layout(
      `Seu pedido está: ${data.statusLabel}`,
      `<p>Pedido <strong>${data.number}</strong>.</p>
       ${data.extra ?? ""}
       <p><a href="${data.url}" style="display:inline-block;margin-top:12px;background:#0f172a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ver pedido</a></p>`
    ),
  };
}
