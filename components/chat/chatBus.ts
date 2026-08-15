// Lightweight event bus so any "Nhắn tin" button anywhere in the tree can tell
// the single global ChatBubble (mounted in the root layout) to open and jump
// straight to a conversation — instead of each button spawning its own
// center-screen modal.

export const OPEN_CHAT_EVENT = "crumbup:open-chat";

export type OpenChatDetail =
  | { storeId: string; customerId?: undefined }
  | { customerId: string; storeId?: undefined };

export function openChat(detail: OpenChatDetail) {
  window.dispatchEvent(new CustomEvent<OpenChatDetail>(OPEN_CHAT_EVENT, { detail }));
}
