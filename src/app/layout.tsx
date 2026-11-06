import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BaHa Ads - Hệ Thống Thiết Lập Quảng Cáo Trả Phí Tự Động",
  description: "Xây dựng chiến dịch quảng cáo trả phí chuẩn Meta Ads với cơ chế an toàn tài chính và thông báo Telegram thật",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="bg-[#0b0e14] text-[#e6edf3] antialiased selection:bg-emerald-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}

