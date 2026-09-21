import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing — Ontor",
  description: "Try Ontor free for 14 days, no card required. Then choose $20 a month or $168 a year.",
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title: "Pricing — Ontor",
    description: "Try Ontor free for 14 days, no card required. Then choose $20 a month or $168 a year.",
    url: "https://ontor.ai/pricing/",
  },
};

const features = [
  "Near real-time signals while you speak",
  "Readings compared with your usual range",
  "Session history and signal timelines",
  "Suggested resets based on what changed",
  "Before-and-after check-in comparisons",
];

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className={styles.main}>
        <header className={styles.hero}>
          <p className={styles.label}>Pricing</p>
          <h1>Try Ontor free for 14 days.</h1>
          <p>Then choose $20 a month or $168 a year. No card required to start.</p>
        </header>

        <section className={styles.individual} aria-labelledby="individual-plan">
          <div className={styles.planHeading}>
            <div>
              <p className={styles.planName}>Individual</p>
              <h2 id="individual-plan"><strong>$20</strong><span>/month</span></h2>
              <p className={styles.annual}>Or $168 a year ($14/month). Save about 30%.</p>
            </div>
            <div className={styles.planAction}>
              <Link href="/login/?next=/dashboard/subscription/">Start 14-day trial</Link>
              <span>No card required. Cancel anytime.</span>
            </div>
          </div>

          <div className={styles.included}>
            <h3>What&apos;s included</h3>
            <ul>
              {features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}
            </ul>
          </div>
        </section>

        <section className={styles.teams}>
          <div>
            <p className={styles.planName}>For teams</p>
            <h2>Bring Ontor to your team.</h2>
            <p>Team pricing depends on how many people will use Ontor and what you want to learn from a pilot.</p>
          </div>
          <div className={styles.teamActions}>
            <Link href="/for-teams">See how teams use Ontor</Link>
            <a href="https://calendly.com/sabber-ahamed/30min" target="_blank" rel="noreferrer">Discuss a team pilot</a>
          </div>
        </section>

        <div className={styles.note}>
          <span>You choose when Ontor listens.</span>
          <Link href="/privacy">Read the privacy policy</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
