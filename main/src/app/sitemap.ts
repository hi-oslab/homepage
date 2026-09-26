import type { MetadataRoute } from 'next'
import { getPublishedWorks } from '@/lib/cms'
import { SITE_URL } from '@/lib/site'

const BASE_URL = SITE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await getPublishedWorks()

  const workUrls: MetadataRoute.Sitemap = works.map((work) => ({
    url: `${BASE_URL}/work/${work.slug}`,
    lastModified: work.updated_at
      ? new Date(work.updated_at)
      : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/members`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/work`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    ...workUrls,
  ]
}
