import { useRouter } from 'next/router'
import { useRef, useEffect } from 'react'
import Script from 'next/script'
import Header from '@/config'
import Frame from '@/components/dom/Frame'
import '@/styles/index.css'
import * as gtag from '@/lib/gtag'

export default function App({
  Component,
  pageProps = {
    title: 'Open Source Lab',
  },
}) {
  const router = useRouter()
  const ref = useRef()

  useEffect(() => {
    const handleRouteChange = (url: URL) => {
      gtag.pageview(url)
    }
    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

  return (
    <>
      <Header title={pageProps.title}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${gtag.GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </Header>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script strategy='afterInteractive' src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`} />
      <Frame ref={ref}>
        <Component {...pageProps} />
      </Frame>
    </>
  )
}
