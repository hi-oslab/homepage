'use client'

import Script from 'next/script'
import { useEffect } from 'react'

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } }
  }
}

export const InstagramEmbed = ({ url }: { url: string }) => {
  useEffect(() => {
    if (window.instgrm) {
      window.instgrm.Embeds.process()
    }
  }, [url])

  return (
    <>
      <Script src='//www.instagram.com/embed.js' strategy='lazyOnload' />
      <blockquote
        className='instagram-media w-full'
        data-instgrm-permalink={url}
        data-instgrm-version='14'
        data-instgrm-captioned
      />
    </>
  )
}
