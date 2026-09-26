export const METADATA = {
  name: 'Open Source Lab',
  title: 'Open Source Lab',
  titleTemplate: '%s | Open Source Lab',
  description:
    'Interactive Media Art Collective, Open Source Lab. 홍익대학교에서 시작된 인터랙티브 미디어 아트 콜렉티브, 오픈소스랩. 미디어 아트, 크리에이티브 코딩, 피지컬 컴퓨팅 작품을 만들고 공유합니다.',
  keywords: [
    'Open Source Lab',
    'OSL',
    'Interactive Media Art Collective',
    '인터랙티브 미디어 아트 콜렉티브',
    '오픈소스랩',
    '미디어 아트',
    'Media Art',
    'Interactive Art',
    '인터랙티브 아트',
    'Creative Coding',
    '크리에이티브 코딩',
    'Physical Computing',
    '피지컬 컴퓨팅',
    '홍익대학교',
    'Hongik University',
    '홍대',
    'Hongdae',
    'Seoul',
    'Korea',
    'Digital Media Design',
    '디지털미디어디자인',
    'New Media',
    '뉴미디어',
  ],
  authors: [
    {
      name: 'Open Source Lab',
      email: 'hi.oslab@gmail.com',
      url: 'https://hioslab.com',
    },
  ],
  url: 'https://hioslab.com',
  twitter: {
    card: 'summary_large_image' as const,
  },
}

/**
 * 기본 공유 이미지 (1200×630).
 * 페이지에서 openGraph를 지정하면 레이아웃의 openGraph가 통째로 대체되므로 페이지마다 images에 넣어준다.
 */
export const OG_IMAGE = { url: '/icons/op-image.png', width: 1200, height: 630, alt: 'Open Source Lab' }
