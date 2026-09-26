import type { Metadata } from 'next'
import { OG_IMAGE } from '@/app/metadata'

export const metadata: Metadata = {
  title: 'Contact',
  description: '오픈소스랩과 함께하고 싶다면 언제든지 연락주세요. Instagram, 이메일로 문의하실 수 있습니다.',
  openGraph: {
    title: 'Contact | Open Source Lab',
    description: '오픈소스랩과 함께하고 싶다면 언제든지 연락주세요. Instagram, 이메일로 문의하실 수 있습니다.',
    url: '/contact',
    images: [OG_IMAGE],
  },
  alternates: { canonical: '/contact' },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
