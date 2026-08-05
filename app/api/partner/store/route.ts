import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Industry } from "@/app/generated/prisma/enums";

const INDUSTRY_VALUES = new Set<string>(["BAKERY_CAFE", "SUPERMARKET_CONVENIENCE"]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({
    where: { ownerId: user.id },
    select: { id: true, name: true, address: true, phone: true, openHours: true, description: true, industry: true },
  });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  return NextResponse.json({ store });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const store = await prisma.store.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  if (!store) return NextResponse.json({ error: "No store" }, { status: 404 });

  const body = await request.json();
  const { name, address, phone, openHours, description, industry } = body;

  if (!name || !String(name).trim()) return NextResponse.json({ error: "Vui lòng nhập tên cửa hàng" }, { status: 400 });
  if (!address || !String(address).trim()) return NextResponse.json({ error: "Vui lòng nhập địa chỉ cửa hàng" }, { status: 400 });
  if (industry !== undefined && !INDUSTRY_VALUES.has(industry)) {
    return NextResponse.json({ error: "Ngành nghề không hợp lệ" }, { status: 400 });
  }

  await prisma.store.update({
    where: { id: store.id },
    data: {
      name,
      address,
      phone: phone || null,
      openHours: openHours || null,
      description: description || null,
      ...(industry !== undefined && { industry: industry as Industry }),
    },
  });

  return NextResponse.json({ ok: true });
}
