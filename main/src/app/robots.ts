import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/admin-reset/', '/api/'],
    },
    sitemap: 'https://hioslab.com/sitemap.xml',
  }
}
