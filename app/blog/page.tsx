import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { getPublishedPosts } from "../../lib/blog";

const PAGE_DESCRIPTION =
  "The Ontor blog — on voice biomarkers, nervous-system state, burnout, and the mind layer your wearable can't read. Science-grounded, practical, no hype.";

export const metadata: Metadata = {
  title: "Blog — Ontor",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — Ontor",
    description: PAGE_DESCRIPTION,
    url: "https://ontor.ai/blog",
    siteName: "Ontor",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ontor" }],
  },
};

export const revalidate = 3600;

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Nav />
      <main id="top" className="flex-1">
        <section className="blog-hero">
          <div className="blog-wrap">
            <span className="blog-eyebrow">The Ontor blog</span>
            <h1 className="font-serif-display">Notes on the signal beneath the noise.</h1>
            <p className="blog-lede">
              Voice biomarkers, nervous-system state, and the things your wearable and your scale can&apos;t see.
            </p>
          </div>
        </section>

        <section className="blog-foundations">
          <div className="blog-wrap">
            <span className="blog-found-label">Start here · Foundations</span>
            <div className="blog-found-grid">
              <Link href="/voice-biomarkers" className="blog-found-card">
                <h3>What is a voice biomarker?</h3>
                <p>How your voice reveals nervous-system state — and how Ontor reads it on-device.</p>
                <span className="blog-found-more">Read →</span>
              </Link>
              <Link href="/voice-vs-wearables" className="blog-found-card">
                <h3>Voice biomarkers vs. wearables</h3>
                <p>What a wrist sensor can&apos;t read, and what voice adds to Oura, WHOOP, or Apple Watch.</p>
                <span className="blog-found-more">Read →</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="blog-body">
          <div className="blog-wrap">
            {posts.length === 0 ? (
              <p className="blog-empty">First posts are on the way. Meanwhile, see what Ontor reads from your voice on the <Link href="/voice-biomarkers">voice biomarkers</Link> page.</p>
            ) : (
              <ul className="blog-list">
                {posts.map((p) => (
                  <li key={p.slug} className="blog-card">
                    <Link href={`/blog/${p.slug}`} className="blog-card-link">
                      {p.heroImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="blog-card-img" src={p.heroImage} alt={p.heroImageAlt || p.title} />
                      )}
                      <div className="blog-card-text">
                        {p.status === "draft" && <span className="blog-card-draft">Draft</span>}
                        <h2>{p.title}</h2>
                        <p>{p.description}</p>
                        <span className="blog-card-more">Read →</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <style>{BLOG_CSS}</style>
    </>
  );
}

const BLOG_CSS = `
.blog-wrap { max-width: 880px; margin: 0 auto; padding: 0 32px; }
.blog-hero { background: linear-gradient(168deg, #14272C 0%, #0E1D21 60%, #0A1417 100%); color: #F4F1EA; padding: 80px 0 64px; text-align: center; }
.blog-eyebrow { font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #6FD6C9; display: inline-flex; align-items: center; gap: 9px; }
.blog-eyebrow::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--amber); }
.blog-hero h1 { font-size: clamp(32px, 4.6vw, 50px); line-height: 1.06; margin: 18px 0 0; color: #FBF8F1; letter-spacing: -0.02em; }
.blog-lede { margin: 18px auto 0; max-width: 560px; font-size: 18px; line-height: 1.6; color: #C9D4D2; }
.blog-foundations { background: var(--paper); padding: 48px 0 8px; }
.blog-found-label { display: inline-flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--teal); }
.blog-found-label::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--amber); }
.blog-found-grid { margin: 18px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.blog-found-card { display: block; text-decoration: none; color: inherit; background: var(--teal-surface); border: 1px solid var(--line); border-radius: 14px; padding: 22px 24px; transition: border-color .2s, transform .2s, box-shadow .2s; }
.blog-found-card:hover { border-color: var(--teal); transform: translateY(-2px); box-shadow: 0 12px 28px rgba(11,80,72,.10); }
.blog-found-card h3 { margin: 0; font-size: 18px; line-height: 1.25; color: var(--teal-dark); letter-spacing: -0.01em; }
.blog-found-card p { margin: 8px 0 0; font-size: 14.5px; line-height: 1.5; color: var(--ink-soft); }
.blog-found-more { display: inline-block; margin-top: 12px; color: var(--teal); font-weight: 600; font-size: 13.5px; }
@media (max-width: 620px) { .blog-found-grid { grid-template-columns: 1fr; } }
.blog-body { background: var(--paper-3); padding: 40px 0 80px; }
.blog-empty { text-align: center; color: var(--ink-soft); font-size: 17px; }
.blog-empty a { color: var(--teal); }
.blog-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 20px; }
.blog-card { background: #fff; border: 1px solid var(--line); border-radius: 16px; overflow: hidden; transition: border-color .2s, box-shadow .2s, transform .2s; }
.blog-card:hover { border-color: var(--line-strong); box-shadow: 0 14px 34px rgba(27,26,23,.08); transform: translateY(-2px); }
.blog-card-link { display: grid; grid-template-columns: 240px 1fr; text-decoration: none; color: inherit; }
.blog-card-img { width: 100%; height: 100%; object-fit: cover; display: block; min-height: 150px; }
.blog-card-text { padding: 24px 26px; }
.blog-card-draft { display: inline-block; margin-bottom: 8px; background: var(--amber-soft); color: #8A5A00; border: 1px solid var(--amber-border); border-radius: 999px; padding: 2px 9px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; }
.blog-card-text h2 { font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; color: var(--ink); margin: 0; }
.blog-card-text p { margin: 10px 0 0; color: var(--ink-soft); font-size: 15.5px; line-height: 1.55; }
.blog-card-more { display: inline-block; margin-top: 14px; color: var(--teal); font-weight: 600; font-size: 14px; }
@media (max-width: 620px) { .blog-card-link { grid-template-columns: 1fr; } .blog-card-img { aspect-ratio: 16/9; min-height: 0; } }
`;
