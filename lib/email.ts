// Transactional email for waitlist signups, sent via Resend.
//
// Copy note: this used to describe Ontor as a "voice-first, on-device
// health agent" whose voice "never leaves your phone". Both are
// retired. Ontor is performance intelligence, not a wellness product,
// and the absolute privacy claim stopped being true once optional
// cloud sync shipped. What is said here now is what the product
// actually does.
//
// Two emails fire on a NEW signup (see app/api/waitlist/route.ts):
//   1. A welcome email to the person who joined.
//   2. A "someone joined" notification to the founder.
//
// Both are best-effort: failures are logged, never thrown, so email
// trouble can't break the signup itself. Sending is skipped entirely
// when RESEND_API_KEY is absent (e.g. local dev), so nothing is needed
// to run the app without email configured.

import { Resend } from "resend";

const FROM = "Ontor <hello@ontor.ai>";
const OWNER_NOTIFY = "sabbers@gmail.com";
const SITE = "https://ontor.ai";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

// ── Welcome email ─────────────────────────────────────────────────────
function welcomeHtml(): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:40px 40px 8px;">
                <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;font-weight:600;">Ontor</p>
                <h1 style="margin:16px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#111827;">You're on the list.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 0;font-size:16px;line-height:1.6;color:#374151;">
                <p style="margin:0 0 16px;">Thanks for joining the Ontor early-access list. Ontor reads your nervous-system state from how you sound: stress, energy, confidence, fatigue. No wearable, no tracker, no journaling. Just your voice, on real calls or a few-second check-in.</p>
                <p style="margin:0 0 16px;">The analysis runs on your device. Cloud backup is optional and off unless you turn it on.</p>
                <p style="margin:0 0 16px;">We'll reach out personally when your spot opens up. In the meantime, here's a little more about what we're building:</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td style="padding:6px 0;">
                      <a href="${SITE}/blog" style="color:#0d9488;text-decoration:none;font-weight:600;font-size:16px;">&rarr; Read the blog</a>
                      <div style="font-size:14px;color:#6b7280;margin-top:2px;">How voice biomarkers work, and why we built this.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <a href="${SITE}/about" style="color:#0d9488;text-decoration:none;font-weight:600;font-size:16px;">&rarr; About Ontor</a>
                      <div style="font-size:14px;color:#6b7280;margin-top:2px;">The mission and the approach to privacy.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;">
                      <a href="https://www.linkedin.com/in/sabber-ahamed/" style="color:#0d9488;text-decoration:none;font-weight:600;font-size:16px;">&rarr; Meet the founder</a>
                      <div style="font-size:14px;color:#6b7280;margin-top:2px;">Sabber Ahamed &mdash; say hi on LinkedIn.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px 40px;">
                <p style="margin:0;font-size:16px;line-height:1.6;color:#374151;">Talk soon,<br/>Sabber &amp; the Ontor team</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px;border-top:1px solid #f0f0f0;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you joined the waitlist at <a href="${SITE}" style="color:#9ca3af;">ontor.ai</a>.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function welcomeText(): string {
  return [
    "You're on the list.",
    "",
    "Thanks for joining the Ontor early-access list. Ontor reads your",
    "nervous-system state from how you sound: stress, energy, confidence,",
    "fatigue. No wearable, no tracker, no journaling. Just your voice, on",
    "real calls or a few-second check-in.",
    "",
    "The analysis runs on your device. Cloud backup is optional and off",
    "unless you turn it on.",
    "",
    "We'll reach out personally when your spot opens up. In the meantime:",
    "",
    `  • Read the blog:      ${SITE}/blog`,
    `  • About Ontor:     ${SITE}/about`,
    "  • Meet the founder:   https://www.linkedin.com/in/sabber-ahamed/",
    "",
    "Talk soon,",
    "Sabber & the Ontor team",
  ].join("\n");
}

/** Welcome the new signup. No-op (logged) if Resend isn't configured. */
export async function sendWelcomeEmail(to: string): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY missing — skipping welcome email");
    return;
  }
  try {
    const { error } = await client.emails.send({
      from: FROM,
      to,
      subject: "Welcome to Ontor — you're on the list",
      html: welcomeHtml(),
      text: welcomeText(),
    });
    if (error) console.error("[email] welcome send failed:", error);
  } catch (err) {
    console.error("[email] welcome threw:", err);
  }
}

/** Notify the founder that someone new joined. */
export async function sendOwnerNotification(
  signupEmail: string,
  meta: { source: string; feedback: string | null },
): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn("[email] RESEND_API_KEY missing — skipping owner notification");
    return;
  }
  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: OWNER_NOTIFY,
      replyTo: signupEmail,
      subject: `🎉 New waitlist signup: ${signupEmail}`,
      text: [
        "Someone just joined the Ontor waitlist.",
        "",
        `Email:    ${signupEmail}`,
        `Source:   ${meta.source}`,
        `Feedback: ${meta.feedback ?? "—"}`,
      ].join("\n"),
    });
    if (error) console.error("[email] owner notify failed:", error);
  } catch (err) {
    console.error("[email] owner notify threw:", err);
  }
}

// Founder lifecycle emails moved to lib/founder-alerts.ts
// (notifyFounderStep). Re-export types for any older imports.
export {
  type FounderStep as OwnerLifecycleMilestone,
  notifyFounderStep as sendOwnerLifecycleNotification,
} from "@/lib/founder-alerts";

// ── Sign-in code ──────────────────────────────────────────────────────
//
// Ontor is passwordless, so this email IS the login. Two rules that
// look like nitpicks but aren't:
//
//   1. The code is NOT in the subject line. It would be handier on a
//      lock screen, and that is exactly the problem — a glance at a
//      face-down phone shouldn't be enough to sign in as someone.
//      Stripe and GitHub make the same call.
//   2. This one throws on failure, unlike the best-effort helpers
//      above. A welcome email that fails is a missed nicety; a code
//      that fails is a user who cannot get in. The caller needs to
//      know so it can say so instead of showing a code screen that
//      will never accept anything.

function loginCodeHtml(code: string, minutes: number): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:40px 40px 8px;">
                <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;font-weight:600;">Ontor</p>
                <h1 style="margin:16px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#111827;">Your sign-in code</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0;">
                <div style="font-size:34px;letter-spacing:0.24em;font-weight:700;color:#111827;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${code}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 0;font-size:16px;line-height:1.6;color:#374151;">
                <p style="margin:0 0 16px;">Enter it to finish signing in. It expires in ${minutes} minutes and works once.</p>
                <p style="margin:0 0 16px;color:#6b7280;font-size:14px;">If you didn't ask to sign in, you can ignore this. Nobody can get into your account with this email alone.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px;">
                <p style="margin:0;font-size:13px;color:#9ca3af;">Ontor · <a href="${SITE}" style="color:#0d9488;text-decoration:none;">ontor.ai</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Send a sign-in code. Throws if Resend is unconfigured or the send
 * fails, so the route can return an honest error to the client.
 */
export async function sendLoginCode(
  to: string,
  code: string,
  ttlSeconds: number,
): Promise<void> {
  const client = getResend();
  if (!client) throw new Error("RESEND_API_KEY missing — cannot send code");

  const minutes = Math.max(1, Math.round(ttlSeconds / 60));
  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject: "Your Ontor sign-in code",
    html: loginCodeHtml(code, minutes),
    text: [
      "Your Ontor sign-in code",
      "",
      code,
      "",
      `Enter it to finish signing in. It expires in ${minutes} minutes and works once.`,
      "",
      "If you didn't ask to sign in, you can ignore this.",
    ].join("\n"),
  });
  if (error) throw new Error(`Resend rejected the code email: ${error.message}`);
}


// ── Coach invite ──────────────────────────────────────────────────
//
// Sent to a person a coach wants to see the voice data of. It has to
// work for someone who has never heard of Ontor, so it says who is
// asking, what they will and will not see, and where to get the tool.
//
// The install link matters: a brand-new client can accept and still
// have nothing to show, because every reading is scored against their
// own baseline and there is not one yet. Without "install this", they
// accept and nothing happens for days.

function inviteHtml(who: string, acceptUrl: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr><td style="padding:38px 40px 0;">
            <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;font-weight:600;">Ontor</p>
          </td></tr>
          <tr><td style="padding:22px 40px 0;font-size:16px;line-height:1.6;color:#374151;">
            <p style="margin:0 0 16px;">Hi,</p>
            <p style="margin:0 0 16px;"><strong>${who}</strong> is inviting you to their program on Ontor.</p>
            <p style="margin:0 0 16px;">Ontor scores stress, energy, confidence and fatigue from how your voice sounds. If you accept, they see how those move against your own usual. They never hear what you said: no recordings, no transcripts, no words. You can stop any time.</p>
          </td></tr>
          <tr><td style="padding:8px 40px 0;">
            <a href="${acceptUrl}" style="display:inline-block;background:#0F766E;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 26px;border-radius:12px;">Accept and start sharing</a>
          </td></tr>
          <tr><td style="padding:26px 40px 0;font-size:15px;line-height:1.6;color:#374151;">
            <p style="margin:0 0 8px;"><strong>New here?</strong> Accept, then install Ontor and speak to it a few times so there is something to see.</p>
            <p style="margin:0;"><a href="${SITE}/install/" style="color:#0d9488;">Install Ontor &rarr;</a></p>
          </td></tr>
          <tr><td style="padding:28px 40px 40px;">
            <p style="margin:0;font-size:13px;color:#9ca3af;">Not expecting this? Ignore it. Nothing is shared unless you accept.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/**
 * Invite a client to share with a coach. Throws so the caller can say
 * so rather than reporting a success that never left the building.
 *
 * `who` is "Name (email)" — the name so it reads like a person, the
 * address so it can be verified. Never a pronoun: at invite time we
 * may have no profile at all, and a name would not tell us anyway.
 */
export async function sendShareInvite(
  to: string,
  who: string,
  acceptUrl: string,
): Promise<void> {
  const client = getResend();
  if (!client) throw new Error("RESEND_API_KEY missing — cannot send invite");

  const { error } = await client.emails.send({
    from: FROM,
    to,
    subject: `${who.split(" (")[0]} invited you to Ontor`,
    html: inviteHtml(who, acceptUrl),
    text: [
      "Hi,",
      "",
      `${who} is inviting you to their program on Ontor.`,
      "",
      "Ontor scores stress, energy, confidence and fatigue from how your voice",
      "sounds. If you accept, they see how those move against your own usual.",
      "They never hear what you said: no recordings, no transcripts, no words.",
      "You can stop any time.",
      "",
      `Accept: ${acceptUrl}`,
      "",
      `New here? Accept, then install Ontor and speak to it a few times so`,
      `there is something to see: ${SITE}/install/`,
      "",
      "Not expecting this? Ignore it. Nothing is shared unless you accept.",
    ].join("\n"),
  });
  if (error) throw new Error(`Resend rejected the invite: ${error.message}`);
}
