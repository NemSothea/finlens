import type { HealthReport, StageHealth } from './health'

/**
 * Outbound alerting.
 *
 * Three rules, all learned the same way:
 *
 * 1. **Alerting must never break the thing it watches.** Every send is
 *    best-effort: a dead Telegram API cannot be allowed to fail the cron run
 *    that ingests data.
 * 2. **Repeat the same problem sparingly.** One outage that sends hourly gets
 *    the channel muted, and a muted channel is no alerting at all.
 * 3. **Announce recovery.** Otherwise the only signal is silence, which is
 *    indistinguishable from a broken alerter.
 */

/** How long the same problem set stays quiet after being reported. */
export const ALERT_COOLDOWN_HOURS = 6

const HOUR = 3_600_000

export function shouldSend(
  lastSentAt: Date | null,
  now: Date,
  cooldownHours = ALERT_COOLDOWN_HOURS,
): boolean {
  if (!lastSentAt) return true
  return now.getTime() - lastSentAt.getTime() >= cooldownHours * HOUR
}

function describeAge(stage: StageHealth): string {
  if (stage.ageHours === null) return 'never succeeded'
  if (stage.ageHours < 1) return `${Math.round(stage.ageHours * 60)}m old`
  return `${stage.ageHours.toFixed(1)}h old`
}

/** Pure — so the message can be asserted in tests instead of eyeballed. */
export function formatAlert(report: HealthReport, baseUrl?: string): string {
  const head =
    report.overall === 'down'
      ? 'finlens: pipeline DOWN'
      : report.overall === 'degraded'
        ? 'finlens: pipeline degraded'
        : 'finlens: pipeline recovered'

  const lines = [head, '']

  for (const stage of report.problems) {
    lines.push(
      `• ${stage.stage} — ${stage.state} (${describeAge(stage)}, limit ${stage.stalenessHours}h)`,
    )
    lines.push(`  impact: ${stage.impact}`)
    // One example error is enough to tell a vendor outage from a code bug; the
    // full list is on the dashboard and in the run row.
    const first = stage.errors[0]
    if (first) lines.push(`  e.g. ${first.item}: ${first.message}`.slice(0, 300))
  }

  if (report.problems.length === 0) {
    lines.push('All stages fresh again.')
  }

  if (baseUrl) lines.push('', `${baseUrl}/ops`)

  return lines.join('\n')
}

/**
 * Best-effort Telegram send. Returns whether it went out, never throws.
 *
 * The API host is configurable because Telegram supports a self-hosted Bot API
 * server, and because pointing it at a local stub is the only way to verify the
 * dedupe and recovery paths end to end without spamming a real channel.
 */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.OPS_TELEGRAM_BOT_TOKEN ?? process.env.AUTH_TELEGRAM_BOT_TOKEN
  const chatId = process.env.OPS_TELEGRAM_CHAT_ID
  const apiBase = process.env.OPS_TELEGRAM_API_BASE ?? 'https://api.telegram.org'

  if (!token || !chatId) {
    // Not an error: alerting is optional configuration. Logged so the reason
    // for silence is discoverable.
    console.warn('[ops] no Telegram alert target configured; skipping send')
    return false
  }

  try {
    const response = await fetch(`${apiBase}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      // A hung alert must not hold the cron function open until its timeout.
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      console.error(`[ops] Telegram send failed: ${response.status}`)
      return false
    }

    return true
  } catch (error) {
    console.error('[ops] Telegram send threw', error)
    return false
  }
}
