import type { MetadataRoute } from 'next'
import { connection } from 'next/server'
import { SITE_ORIGIN, blogPostUrl, postLastModified, withEnsuredPublishedPosts } from '../lib/blog-model'
import { getPublishedPostsForDiscovery, type PostMeta } from '../lib/blog'

// Request-time generation so a newly published catalog slug is not stuck behind
// a stale ISR snapshot (the previous hourly sitemap cache omitted live posts).
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_ORIGIN}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_ORIGIN}/how-it-works/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/for-teams/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/sales/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_ORIGIN}/pricing/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/faq/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/install/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_ORIGIN}/install/mac/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_ORIGIN}/voice-biomarkers/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/voice-vs-wearables/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_ORIGIN}/blog/`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_ORIGIN}/about/`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_ORIGIN}/privacy/`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_ORIGIN}/terms/`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
  ]

  let posts: PostMeta[] = []
  try {
    const result = await getPublishedPostsForDiscovery()
    posts = result.posts
    if (!result.catalogAvailable) {
      console.error('[sitemap] blog catalog unavailable; returning static routes and known published slugs')
    }
  } catch (err) {
    console.error('[sitemap] blog catalog unavailable', err)
    posts = withEnsuredPublishedPosts([])
  }

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: blogPostUrl(p.slug),
    lastModified: postLastModified(p, lastModified),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...postRoutes]
}
