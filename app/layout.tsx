import type { Metadata } from "next";
import { Suspense } from "react";
import { ViewTransitions } from "next-view-transitions";
import ScrollRevealProvider from "@/components/ScrollRevealProvider";
import ProgressBar from "@/components/ProgressBar";
import NotificationListener from "@/components/notifications/NotificationListener";
import NotificationsProvider from "@/components/notifications/NotificationsProvider";
import ChatBubble from "@/components/chat/ChatBubble";
import { LocationProvider } from "@/lib/location-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrumbUp · Save Every Crumb, Share Every Value",
  description:
    "CrumbUp - giải cứu thực phẩm cuối ngày và mang đến ưu đãi hấp dẫn mỗi ngày. Mua Surprise Box hoặc Chương trình khuyến mãi từ các cửa hàng yêu thích với giá giảm 50-70%. Ăn ngon, tiết kiệm, giảm lãng phí.",
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
            <NotificationsProvider>
              <Suspense fallback={null}><ProgressBar /></Suspense>
              <Suspense fallback={null}><ScrollRevealProvider /></Suspense>
              {children}
              <NotificationListener />
              <Suspense fallback={null}><ChatBubble /></Suspense>
            </NotificationsProvider>
          </LocationProvider>
        </body>
      </html>
    </ViewTransitions>
  );
}
