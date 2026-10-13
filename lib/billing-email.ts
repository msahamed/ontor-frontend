// Lifecycle email: trial, subscription, cancellation.
//
// ALL of it comes from us, not from Stripe. Stripe can send its own
// receipts, but a customer who gets some messages from Stripe and
// others from Ontor is being talked to by two different companies.
// One sender, one voice. Stripe keeps only the things it is genuinely
// better at — the invoice PDF and the failed-card retry sequence, both
// reachable from the billing portal.
//
// Sending is best-effort everywhere it is called. A webhook that threw
// because an email bounced would make Stripe retry a payment event
// that already succeeded, and the customer would be charged correctly
// but recorded as failing. Access is the important part; the email is
// a courtesy on top.

import { Resend } from "resend";

const FROM = "Ontor <hello@ontor.ai>";
const SITE = "https://ontor.ai";
const MANAGE = `${SITE}/dashboard/subscription/`;
const PRICING = `${SITE}/pricing/`;

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

function longDate(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** The house shell, so six emails cannot drift into six designs. */
function shell(opts: {
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  footnote?: string;
}): string {
  const body = opts.paragraphs
    .map((p) => `<p style="margin:0 0 16px;">${p}</p>`)
    .join("");
  const cta = opts.cta
    ? `<tr><td style="padding:8px 40px 0;">
            <a href="${opts.cta.href}" style="display:inline-block;background:#0F766E;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 26px;border-radius:12px;">${opts.cta.label}</a>
          </td></tr>`
    : "";
  const foot = opts.footnote
    ? `<tr><td style="padding:28px 40px 40px;">
            <p style="margin:0;font-size:13px;color:#9ca3af;">${opts.footnote}</p>
          </td></tr>`
    : `<tr><td style="padding:28px 40px 40px;"></td></tr>`;

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7f8;padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr><td style="padding:38px 40px 0;">
            <p style="margin:0;font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488;font-weight:600;">Ontor</p>
            <h1 style="margin:16px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#111827;">${opts.heading}</h1>
          </td></tr>
          <tr><td style="padding:20px 40px 0;font-size:16px;line-height:1.6;color:#374151;">${body}</td></tr>
          ${cta}
          ${foot}
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

async function send(
  to: string,
  subject: string,
  html: string,
  text: string[],
): Promise<void> {
  const client = getResend();
  if (!client) return; // No key in local dev. Not an error.
  try {
    const { error } = await client.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text: text.join("\n"),
    });
    if (error) console.error("[billing-email]", subject, error.message);
  } catch (err) {
    console.error("[billing-email]", subject, err);
  }
}

// ── Trial ─────────────────────────────────────────────────────────

export async function sendTrialStarted(to: string, endsAt: Date, days: number) {
  const ends = longDate(endsAt);
  await send(
    to,
    `Your Ontor trial is running`,
    shell({
      heading: "You're in.",
      paragraphs: [
        `You have ${days} days of full access, through ${ends}. No card, nothing to cancel.`,
        `One thing worth knowing: Ontor gets better the longer it listens. The first few sessions build your baseline, and the patterns only start meaning something once there is one. Use it a few times this week and it will have something real to tell you.`,
        // Said now, on purpose. Someone who first meets the price on day
        // eleven has spent the whole trial judging the product without
        // knowing what it costs, and then gets a surprise at the worst
        // possible moment.
        `After that it is $10 a month, or $100 for the year. Nothing happens automatically, because we have no card.`,
      ],
      footnote: "Questions? Just reply to this email.",
    }),
    [
      "You're in.",
      "",
      `You have ${days} days of full access, through ${ends}. No card, nothing to cancel.`,
      "",
      "Ontor gets better the longer it listens. The first few sessions build your baseline.",
      "",
      "After that it is $10 a month, or $100 for the year. Nothing happens automatically.",
    ],
  );
}

export async function sendTrialEnding(
  to: string,
  endsAt: Date,
  daysLeft: number,
) {
  const ends = longDate(endsAt);
  const n = `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  await send(
    to,
    `${n} left on your Ontor trial`,
    shell({
      heading: `${n} left`,
      paragraphs: [
        `Your trial ends on ${ends}.`,
        `By now Ontor has a baseline for you, which means everything from here is measured against how you actually sound rather than an average of strangers. That is the part that took two weeks to build, and the part you would be starting over on later.`,
        `$10 a month, or $100 for the year.`,
      ],
      cta: { label: "Keep your access", href: PRICING },
      footnote: "If you would rather not continue, do nothing. It stops on its own.",
    }),
    [
      `${n} left on your Ontor trial.`,
      "",
      `Your trial ends on ${ends}.`,
      "",
      "$10 a month, or $100 for the year.",
      PRICING,
    ],
  );
}

export async function sendTrialEnded(to: string) {
  await send(
    to,
    "Your Ontor trial has ended",
    shell({
      heading: "Your trial has ended.",
      paragraphs: [
        `Your readings and your baseline are still here. Nothing has been deleted, and picking up where you left off takes one click.`,
        `$10 a month, or $100 for the year.`,
      ],
      cta: { label: "Continue with Ontor", href: PRICING },
      footnote: "Not for you right now? No hard feelings. Your data stays put.",
    }),
    [
      "Your Ontor trial has ended.",
      "",
      "Your readings and your baseline are still here.",
      "$10 a month, or $100 for the year.",
      "",
      PRICING,
    ],
  );
}

// ── Subscription ──────────────────────────────────────────────────

export async function sendSubscribed(to: string, renewsAt: Date | null) {
  const renews = longDate(renewsAt);
  await send(
    to,
    "You're subscribed to Ontor",
    shell({
      heading: "You're subscribed.",
      paragraphs: [
        renews
          ? `Your subscription is active and renews on ${renews}.`
          : `Your subscription is active.`,
        `Open Ontor and it will pick this up on its own. Invoices, payment method and cancellation all live on your subscription page.`,
      ],
      cta: { label: "Your subscription", href: MANAGE },
      footnote: "Thank you. Genuinely.",
    }),
    [
      "You're subscribed to Ontor.",
      "",
      renews ? `Active, renews ${renews}.` : "Your subscription is active.",
      "",
      MANAGE,
    ],
  );
}

export async function sendCancelled(to: string, accessUntil: Date | null) {
  const until = longDate(accessUntil);
  await send(
    to,
    "Your Ontor subscription is cancelled",
    shell({
      heading: "Cancelled.",
      paragraphs: [
        until
          ? `You keep full access until ${until}, which is what you have already paid for. It will not renew after that.`
          : `Your subscription will not renew.`,
        `Your readings stay where they are either way.`,
        `If you change your mind before then, restarting takes one click and nothing is lost.`,
      ],
      cta: { label: "Your subscription", href: MANAGE },
      footnote: "If something was wrong with it, reply and tell me. I read these.",
    }),
    [
      "Your Ontor subscription is cancelled.",
      "",
      until ? `You keep access until ${until}. It will not renew after that.` : "It will not renew.",
      "",
      MANAGE,
    ],
  );
}

export async function sendResumed(to: string, renewsAt: Date | null) {
  const renews = longDate(renewsAt);
  await send(
    to,
    "Your Ontor subscription is back on",
    shell({
      heading: "You're back.",
      paragraphs: [
        renews
          ? `Your subscription is active again and will renew on ${renews}.`
          : `Your subscription is active again.`,
        `Nothing changed while it was cancelled, so there is nothing to set up.`,
      ],
      cta: { label: "Your subscription", href: MANAGE },
    }),
    [
      "Your Ontor subscription is back on.",
      "",
      renews ? `Active again, renews ${renews}.` : "Active again.",
      "",
      MANAGE,
    ],
  );
}

export async function sendSubscriptionEnded(to: string) {
  await send(
    to,
    "Your Ontor subscription has ended",
    shell({
      heading: "Your subscription has ended.",
      paragraphs: [
        `Access has stopped, but nothing has been deleted. Your readings and your baseline are still here whenever you want them.`,
      ],
      cta: { label: "Start again", href: PRICING },
    }),
    [
      "Your Ontor subscription has ended.",
      "",
      "Nothing has been deleted. Your readings and baseline are still here.",
      "",
      PRICING,
    ],
  );
}
