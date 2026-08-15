import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, type: true, orderId: true, title: true, body: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
