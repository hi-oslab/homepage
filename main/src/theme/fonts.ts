import localFont from 'next/font/local'

export const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard-local',
  display: 'swap',
  weight: '45 920',
})

export const monoplex = localFont({
  src: [
    { path: '../../public/fonts/MonoplexKRNerdFont-Light.woff2', weight: '300', style: 'normal' },
    { path: '../../public/fonts/MonoplexKRNerdFont-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/MonoplexKRNerdFont-Text.woff2', weight: '450', style: 'normal' },
    { path: '../../public/fonts/MonoplexKRNerdFont-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/MonoplexKRNerdFont-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/MonoplexKRNerdFont-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-monoplex-local',
  display: 'swap',
})
