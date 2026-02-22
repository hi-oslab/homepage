// fonts.js
import localFont from 'next/font/local'

//D2Coding
export const d2Coding = localFont({
  src: [
    { path: '../../public/fonts/D2Coding.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/D2CodingBold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-d2coding',
  display: 'swap',
})

//SawarabiMincho
export const sawarabiMincho = localFont({
  src: [{ path: '../../public/fonts/SawarabiMincho.woff2', weight: '400', style: 'normal' }],
  variable: '--font-sawarabi-mincho',
  display: 'swap',
})
