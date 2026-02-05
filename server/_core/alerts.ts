import { createHmac } from "crypto";
import * as db from "../db";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL?.trim();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim();

export type AlertLevel = "info" | "warning" | "critical";

export type AlertPayload = {
  level: AlertLevel;
  title: string;
  message: string;
  jobId?: string;
  userId?: number;
  error?: string;
  costCents?: number;
  action?: string;
  timestamp?: number;
};

class AlertService {
  async send(alert: AlertPayload) {
    const timestamp = alert.timestamp ?? Date.now();

    await db.createAlert({
      level: alert.level,
      title: alert.title,
      message: alert.message,
      jobId: alert.jobId ?? null,
      userId: alert.userId ?? null,
      error: alert.error ?? null,
      action: alert.action ?? null,
      costCents: alert.costCents ?? null,
      createdAt: new Date(timestamp),
    });

    if (alert.level === "critical") {
      await Promise.all([
        this.sendDiscord(alert, 0xff0000),
        this.sendTelegram(alert),
      ]);
      return;
    }

    if (alert.level === "warning") {
      await this.sendDiscord(alert, 0xffaa00);
    }
  }

  private async sendDiscord(alert: AlertPayload, color: number) {
    if (!DISCORD_WEBHOOK_URL) return;

    const fields = [
      { name: "Job ID", value: alert.jobId || "N/A", inline: true },
      { name: "User", value: alert.userId ? String(alert.userId) : "N/A", inline: true },
      { name: "Time", value: new Date(alert.timestamp ?? Date.now()).toLocaleTimeString(), inline: true },
    ];

    if (alert.costCents !== undefined) {
      fields.push({
        name: "Cost Impact",
        value: `$${(alert.costCents / 100).toFixed(2)}`,
        inline: true,
      });
    }

    if (alert.action) {
      fields.push({ name: "Suggested Action", value: alert.action, inline: false });
    }

    const embed = {
      title: `${alert.level.toUpperCase()}: ${alert.title}`,
      description: alert.message,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "UVGO Mission Control" },
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  }

  private async sendTelegram(alert: AlertPayload) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

    const emoji = alert.level === "critical" ? "🚨" : "⚠️";
    const text = [
      `${emoji} *${alert.title}*`,
      "```",
      alert.message,
      "```",
      alert.jobId ? `Job: \`${alert.jobId}\`` : "",
      alert.userId ? `User: ${alert.userId}` : "",
      alert.action ? `\n🔧 *Action:* ${alert.action}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "Markdown",
          disable_notification: alert.level !== "critical",
        }),
      }
    );
  }
}

export const alerts = new AlertService();

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return expected === signature;
}
