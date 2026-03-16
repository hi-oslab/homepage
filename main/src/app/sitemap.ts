import type { MetadataRoute } from 'next'
import { getParsedDataByTableType } from '@/app/api/notion'

const BASE_URL = 'https://hioslab.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const works = await getParsedDataByTableType('works')

  const workUrls: MetadataRoute.Sitemap = works.map((work) => ({
    url: `${BASE_URL}/work/${work.properties.slug}`,
    lastModified: work.properties.lastEditedTime
      ? new Date(work.properties.lastEditedTime)
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
      url: `${BASE_URL}/about`,
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
