import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '../lib/blog'

const BASE_URL = 'https://ontor.ai'

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/how-it-works/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/for-teams/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/sales/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/pricing/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/faq/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/install/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/install/mac/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/voice-biomarkers/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/voice-vs-wearables/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/blog/`, lastModified, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about/`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/privacy/`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/terms/`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
  ]

  // Published blog posts, added automatically as each post's status flips to "published".
  // Regeneration failures must not replace the cached sitemap with missing URLs.
  let postRoutes: MetadataRoute.Sitemap = []
  try {
    postRoutes = (await getPublishedPosts()).map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}/`,
      lastModified: (p.updated || p.date) ? new Date(p.updated || p.date) : lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (err) {
    // Preserve the last successful ISR result instead of caching missing URLs.
    console.error('[sitemap] blog catalog unavailable')
    throw err
  }

  const entries = [...staticRoutes, ...postRoutes]
  const freight = `${BASE_URL}/blog/freight-sales-call-block-readiness/`
  if (!entries.some((e) => e.url === freight)) {
    entries.push({ url: freight, lastModified, changeFrequency: 'monthly', priority: 0.7 })
  }
  return entries
}
