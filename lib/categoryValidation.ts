import { prisma } from "@/lib/prisma";

type Result = { ok: true; categoryId: string } | { ok: false; error: string };

/**
 * Resolves and validates a categoryId against the store's industry.
 * Surprise Box requires an explicit, industry-matching category.
 */
export async function resolveCategory(
  categoryId: string | undefined | null,
  storeIndustry: string
): Promise<Result> {
  if (!categoryId) return { ok: false, error: "Ngành hàng không hợp lệ" };

  const cat = await prisma.productCategory.findUnique({ where: { id: categoryId } });
  if (!cat || !cat.active) return { ok: false, error: "Ngành hàng không hợp lệ" };
  if (cat.industry && cat.industry !== storeIndustry) {
    return { ok: false, error: "Ngành hàng không phù hợp với ngành nghề cửa hàng" };
  }
  return { ok: true, categoryId: cat.id };
}
