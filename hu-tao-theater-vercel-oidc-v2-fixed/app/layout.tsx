import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Snowy Advent Calendar",
  description: "매일 새로운 이미지를 만나는 어드벤트 캘린더"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
