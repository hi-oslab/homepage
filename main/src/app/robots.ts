import type { MetadataRoute } from 'next'
import { ALLOW_INDEXING, absoluteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  // beta 등 정식 도메인이 아니면 전체 차단
  if (!ALLOW_INDEXING) return { rules: { userAgent: '*', disallow: '/' } }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/admin-reset/', '/api/', '/login', '/join'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
