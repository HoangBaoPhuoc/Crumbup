import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewTransitions } from "next-view-transitions";
import ScrollRevealProvider from "@/components/ScrollRevealProvider";
import ScrollToTop from "@/components/ScrollToTop";
import ProgressBar from "@/components/ProgressBar";
import { LocationProvider } from "@/lib/location-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrumbUp · Save Every Crumb, Share Every Value",
  description:
    "CrumbUp — giải cứu thực phẩm cuối ngày và mang đến ưu đãi hấp dẫn mỗi ngày. Mua Surprise Box hoặc Chương trình khuyến mãi từ các cửa hàng yêu thích với giá giảm 50-70%. Ăn ngon, tiết kiệm, giảm lãng phí.",
  icons: {
    icon: "/crumbup-logo-tabweb.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <html lang="vi">
        <body>
          <LocationProvider>
            <ProgressBar />
            <Suspense fallback={null}><ScrollRevealProvider /></Suspense>
            {children}
            <ScrollToTop />
          </LocationProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
