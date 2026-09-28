import type { Metadata } from 'next'
import { METADATA, OG_IMAGE } from './metadata'
import { ALLOW_INDEXING, SITE_URL, absoluteUrl } from '@/lib/site'
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import '@/styles/globals.css'
import { Layout } from '@/components'

import { monoplex, pretendard } from '@/theme/fonts'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 멤버 공간이 하이드레이션 전에 data-theme을 붙이므로 <html> 속성 차이 경고만 끈다 (자식에는 영향 없음)
    <html lang='ko' suppressHydrationWarning>
      <head>
        <link rel='preload' href='/fonts/SawarabiMincho.woff2' as='font' type='font/woff2' crossOrigin='anonymous' />
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Open Source Lab',
              alternateName: ['Interactive Media Art Collective, Open Source Lab', '오픈소스랩'],
              url: SITE_URL,
              logo: absoluteUrl('/icons/share.png'),
              description: METADATA.description,
              email: 'hi.oslab@gmail.com',
              foundingDate: '2018',
              sameAs: ['https://www.instagram.com/opensource_lab/'],
            }),
          }}
        />
      </head>
      <body className={`${monoplex.variable} ${pretendard.variable} antialiased`}>
        <Layout>{children}</Layout>
      </body>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </html>
  )
}

export const metadata: Metadata = {
  // 상대 주소(canonical, OG 이미지 /media/…)의 기준 도메인 — NEXT_PUBLIC_SITE_URL (src/lib/site.ts)
  // canonical은 페이지마다 자기 경로로 지정한다 (여기서 지정하면 모든 페이지가 홈을 canonical로 상속함)
  metadataBase: new URL(SITE_URL),
  title: {
    default: METADATA.title,
    template: METADATA.titleTemplate,
  },
  description: METADATA.description,
  keywords: METADATA.keywords,
  authors: METADATA.authors,
  creator: METADATA.authors[0].name,
  publisher: METADATA.authors[0].name,
  manifest: '/manifest.json',
  generator: METADATA.authors[0].name,
  applicationName: METADATA.name,
  appleWebApp: {
    capable: true,
    title: METADATA.title,
    // startUpImage: [],
  },
  category: 'webapp',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: METADATA.name,
    title: {
      default: METADATA.title,
      template: METADATA.titleTemplate,
    },
    description: METADATA.description,
    locale: 'ko_KR',
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: METADATA.twitter.card,
    title: {
      default: METADATA.title,
      template: METADATA.titleTemplate,
    },
    description: METADATA.description,
    images: ['/icons/op-image.png'],
  },
  referrer: 'origin-when-cross-origin',
  // 정식 도메인에서만 검색 노출 (beta는 noindex)
  robots: {
    index: ALLOW_INDEXING,
    follow: ALLOW_INDEXING,
    googleBot: {
      index: ALLOW_INDEXING,
      follow: ALLOW_INDEXING,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
    other: {
      rel: 'mask-icon',
      url: '/icons/safari-pinned-tab.svg',
      color: '#000000',
    },
  },
}
