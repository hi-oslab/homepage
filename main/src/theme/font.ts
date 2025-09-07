// fonts.js
import localFont from "next/font/local";

// Pretendard (한글용; 필요한 스타일별로 여러 파일 지정 가능)
export const pretendard = localFont({
  src: [
    {
      // Pretendard Variable (가변 폰트) – weight 범위: 100 ~ 900
      path: "../../public/fonts/PretendardVariable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});
