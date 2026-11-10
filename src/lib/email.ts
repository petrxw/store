import "server-only";
import { Resend } from "resend";
import { brand } from "@/config/brand";

export type DeliveredItem = {
  productName: string;
  codes: string[];
  activationInstructions: string | null;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendDeliveryEmail(input: { to: string; reference: string; items: DeliveredItem[] }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("RESEND_API_KEY or EMAIL_FROM is not set");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin:0 0 8px">Your ${esc(brand.name)} order</h2>
    <p style="margin:0 0 20px;color:#555">Order reference ${esc(input.reference)}</p>
    ${input.items
      .map(
        (i) => `
      <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px">
        <strong>${esc(i.productName)}</strong>
        ${i.codes.map((c) => `<pre style="background:#f4f4f6;padding:10px;border-radius:6px;margin:10px 0;font-size:15px">${esc(c)}</pre>`).join("")}
        ${i.activationInstructions ? `<p style="margin:8px 0 0;white-space:pre-line">${esc(i.activationInstructions)}</p>` : ""}
      </div>`,
      )
      .join("")}
    <p style="color:#555;font-size:13px">Keep this email private. Anyone with a code can use it. Questions: ${esc(brand.supportEmail)}</p>
    <p style="color:#888;font-size:12px">${esc(brand.disclaimer)}</p>
  </div>`;

  const text = [
    `Your ${brand.name} order (${input.reference})`,
    ...input.items.flatMap((i) => [``, i.productName, ...i.codes, i.activationInstructions ?? ""]),
    ``,
    `Keep this email private. Questions: ${brand.supportEmail}`,
  ].join("\n");

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: input.to,
    subject: `Your ${brand.name} order ${input.reference}`,
    html,
    text,
  });
  if (error) throw new Error(`Email send failed: ${error.message}`);
}
