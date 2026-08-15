"use client";

import MessengerView from "@/components/chat/MessengerView";

export default function MessagesTab() {
  return (
    <div style={{ height: "calc(100vh - 220px)", minHeight: 480, overflow: "hidden" }}>
      <MessengerView emptyText="Chưa có cuộc trò chuyện nào. Khi khách hàng nhắn tin (hoặc bạn nhắn cho khách), cuộc trò chuyện sẽ hiện ở đây." />
    </div>
  );
}
