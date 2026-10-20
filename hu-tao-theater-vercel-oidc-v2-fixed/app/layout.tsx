import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "胡桃劇場",
  description: "즐거운 ✦ 성탄절"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
