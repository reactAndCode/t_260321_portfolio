import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrewSafe | 일일 현장점검",
  description:
    "작업별 안전항목 체크, 사진 첨부, 위험 요약을 한 번에 처리하는 CrewSafe 현장점검 MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
