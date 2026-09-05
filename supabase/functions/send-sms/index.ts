import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type SendSmsPayload = {
  user: { phone?: string };
  sms: { otp?: string };
};

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function hookSecret(): string {
  const raw = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "";
  return raw.replace(/^v1,whsec_/, "");
}

async function sendViaMsg91(mobile: string, otp: string): Promise<{ ok: boolean; detail: string }> {
  const authkey = Deno.env.get("MSG91_AUTHKEY");
  const templateId = Deno.env.get("MSG91_TEMPLATE_ID");
  const sender = Deno.env.get("MSG91_SENDER");
  const otpVar = Deno.env.get("MSG91_OTP_VAR") ?? "otp";

  if (!authkey || !templateId) {
    return { ok: false, detail: "MSG91_AUTHKEY or MSG91_TEMPLATE_ID is not set" };
  }

  const body: Record<string, unknown> = {
    flow_id: templateId,
    template_id: templateId,
    recipients: [
      {
        mobiles: mobile,
        [otpVar]: otp,
        VAR1: otp,
      },
    ],
  };
  if (sender) {
    body.sender = sender;
  }

  const response = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: { type?: string; message?: string } = {};
  try {
    parsed = JSON.parse(text) as { type?: string; message?: string };
  } catch {
    parsed = { message: text.slice(0, 180) };
  }

  const ok = response.ok && parsed.type !== "error";
  return { ok, detail: parsed.message ?? `HTTP ${response.status}` };
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, service: "send-sms" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = await req.text();
  const secret = hookSecret();
  if (!secret) {
    return jsonError(500, "SEND_SMS_HOOK_SECRET is not configured");
  }

  let event: SendSmsPayload;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(payload, Object.fromEntries(req.headers)) as SendSmsPayload;
  } catch {
    return jsonError(401, "Invalid send-sms hook signature");
  }

  const otp = event.sms?.otp;
  const mobile = event.user?.phone ? digitsOnly(event.user.phone) : "";
  if (!otp || !mobile) {
    return jsonError(400, "Missing phone or OTP");
  }

  try {
    const result = await sendViaMsg91(mobile, otp);
    if (!result.ok) {
      return jsonError(502, "MSG91 rejected the SMS");
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonError(500, "Failed to send SMS");
  }
});

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { http_code: status, message } }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
