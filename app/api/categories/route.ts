import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Industry } from "@/app/generated/prisma/enums";

const INDUSTRY_VALUES = new Set<string>(["BAKERY_CAFE", "SUPERMARKET_CONVENIENCE"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const industry = searchParams.get("industry");

  const categories = await prisma.productCategory.findMany({
    where: {
      active: true,
      ...(industry && INDUSTRY_VALUES.has(industry)
        ? { OR: [{ industry: industry as Industry }, { industry: null }] }
        : {}),
    },
    orderBy: { sortOrder: "asc" },
    select: { id: true, key: true, label: true, emoji: true, industry: true },
  });

  return NextResponse.json({ categories });
}
