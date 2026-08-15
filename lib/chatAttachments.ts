// Shared between client (staging/validating picked files) and server
// (re-validating the declared metadata before persisting a message) so the
// limits/whitelist can never drift between the two.

export type AttachmentKind = "image" | "file";

export type ChatAttachment = {
  url: string;
  type: AttachmentKind;
  name: string;
  size: number;
};

export const MAX_IMAGE_MB = 8;
export const MAX_FILE_MB = 15;
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

// SVG intentionally excluded — can carry embedded scripts.
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];

// Common office/media/archive formats only — no executables, scripts, or
// unrecognized extensions.
export const FILE_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "csv", "zip", "rar", "7z", "mp3", "mp4", "mov", "wav",
];

export const ACCEPT_ATTR = [
  ...IMAGE_EXTENSIONS.map((e) => `.${e}`),
  ...FILE_EXTENSIONS.map((e) => `.${e}`),
].join(",");

export function extOf(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
}

export function maxBytesFor(type: AttachmentKind): number {
  return (type === "image" ? MAX_IMAGE_MB : MAX_FILE_MB) * 1024 * 1024;
}

// Classifies a picked File by extension + mime; returns null if the file
// isn't in the allowed whitelist for either category.
export function classifyPickedFile(file: File): AttachmentKind | null {
  const ext = extOf(file.name);
  if (file.type.startsWith("image/") && IMAGE_EXTENSIONS.includes(ext)) return "image";
  if (FILE_EXTENSIONS.includes(ext)) return "file";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
