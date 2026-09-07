import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { getPublishedPosts, getPostBySlug, remoteBlogsEnabled } from "../../../lib/blog";
import { jsonLd } from "../../../lib/blog-model";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  if (remoteBlogsEnabled()) return [];
  return (await getPublishedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const url = `https://ontor.ai/blog/${post.slug}`;
  const img = post.ogImage || post.heroImage || "/og.png";
  return {
    title: `${post.title} — Ontor`,
    description: post.description,
    keywords: post.targetKeyword ? [post.targetKeyword, ...(post.secondaryKeywords ?? [])] : undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    robots: post.status === "draft" ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Ontor",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated || post.date,
      images: [{ url: img, width: 1200, height: 630, alt: post.heroImageAlt || post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [img],
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = `https://ontor.ai/blog/${post.slug}`;
  const img = post.ogImage || post.heroImage || "/og.png";

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: new URL(img, "https://ontor.ai").href,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: "Ontor" },
    publisher: {
      "@type": "Organization",
      name: "Ontor",
      logo: { "@type": "ImageObject", url: "https://ontor.ai/og.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const faqJsonLd = post.faq && post.faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  const dateLabel = post.date
    ? new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleJsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqJsonLd) }} />
      )}
      <Nav />

      <main id="top" className="flex-1">
        {post.status === "draft" && (
          <div className="post-draftbar">Draft preview — not indexed, not yet published.</div>
        )}

        <article className="post-wrap">
          <header className="post-head">
            <Link href="/blog" className="post-back">← All posts</Link>
            <h1 className="font-serif-display">{post.title}</h1>
            <p className="post-lede">{post.description}</p>
            <div className="post-meta">
              {dateLabel && <time dateTime={post.date}>{dateLabel}</time>}
              {post.icp && <span className="post-tag">{post.icp}</span>}
            </div>
          </header>

          {post.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="post-hero" src={post.heroImage} alt={post.heroImageAlt || post.title} width={1600} height={900} />
          )}

          <div
            className="post-body prose prose-lg prose-headings:font-serif-display max-w-none"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>

      <Footer />

      <style>{POST_CSS}</style>
    </>
  );
}

const POST_CSS = `
.post-draftbar { background: var(--amber-soft); color: #8A5A00; text-align: center; font-size: 13px; font-weight: 600; padding: 8px 16px; border-bottom: 1px solid var(--amber-border); }
.post-wrap { max-width: 760px; margin: 0 auto; padding: 56px 32px 24px; }
.post-back { font-size: 14px; color: var(--teal); text-decoration: none; font-weight: 600; }
.post-back:hover { text-decoration: underline; }
.post-head h1 { font-size: clamp(30px, 4.4vw, 46px); line-height: 1.08; letter-spacing: -0.02em; margin: 18px 0 0; color: var(--ink); }
.post-lede { margin: 16px 0 0; font-size: 19px; line-height: 1.6; color: var(--ink-soft); }
.post-meta { margin: 18px 0 0; display: flex; align-items: center; gap: 12px; font-size: 13.5px; color: var(--ink-soft); }
.post-tag { background: var(--teal-surface); color: var(--teal-dark); border-radius: 999px; padding: 3px 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; font-size: 11px; }
.post-hero { display: block; width: 100%; height: auto; border-radius: 14px; margin: 32px 0 8px; box-shadow: 0 24px 60px -28px rgba(11,80,72,.45); }
.post-body { margin: 24px auto 0; color: var(--ink); }
.post-body :where(h2) { margin-top: 1.8em; }
.post-body :where(a) { color: var(--teal); text-decoration: underline; text-underline-offset: 2px; }
.post-body :where(hr) { border: 0; border-top: 1px solid var(--line); margin: 2.2em 0; }
.post-shot { margin: 2em auto; max-width: 300px; text-align: center; }
.post-shot img { width: 100%; height: auto; border-radius: 26px; border: 1px solid var(--line); box-shadow: 0 20px 48px -22px rgba(11,80,72,.45); background: #fff; }
.post-shot figcaption { margin-top: 12px; font-size: 13.5px; line-height: 1.5; color: var(--ink-soft); }
.post-foot { background: var(--paper-2); border-top: 1px solid var(--line); margin-top: 48px; }
.post-foot-inner { max-width: 760px; margin: 0 auto; padding: 28px 32px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }
.post-foot-brand { display: inline-flex; align-items: center; gap: 9px; font-weight: 700; color: var(--ink); }
.post-foot-links { display: flex; gap: 18px; font-size: 14px; }
.post-foot-links a { color: var(--ink-soft); text-decoration: none; }
.post-foot-links a:hover { color: var(--teal); }
`;
