import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Tạo user chủ cửa hàng mẫu
  const owner = await prisma.user.upsert({
    where: { email: "seed-owner@banhoi.vn" },
    update: {},
    create: { email: "seed-owner@banhoi.vn", name: "Seed Owner" },
  });

  // Tạo cửa hàng mẫu
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { id: "store-1" },
      update: {},
      create: {
        id: "store-1", ownerId: owner.id,
        name: "Tiệm Bánh Mì Nâu", address: "12 Đinh Lễ, Hoàn Kiếm, Hà Nội",
        lat: 21.0285, lng: 105.8542, verified: true,
        description: "Tiệm bánh mì thủ công từ 1995",
      },
    }),
    prisma.store.upsert({
      where: { id: "store-2" },
      update: {},
      create: {
        id: "store-2", ownerId: owner.id,
        name: "Café An Nhiên", address: "45 Tràng Tiền, Hoàn Kiếm, Hà Nội",
        lat: 21.0245, lng: 105.8560, verified: true,
        description: "Cà phê & bánh ngọt Pháp",
      },
    }),
    prisma.store.upsert({
      where: { id: "store-3" },
      update: {},
      create: {
        id: "store-3", ownerId: owner.id,
        name: "Tiệm Bánh Mây", address: "78 Hàng Bông, Hoàn Kiếm, Hà Nội",
        lat: 21.0330, lng: 105.8490, verified: true,
        description: "Bánh mặn & ngọt handmade",
      },
    }),
    prisma.store.upsert({
      where: { id: "store-4" },
      update: {},
      create: {
        id: "store-4", ownerId: owner.id,
        name: "Brew House Café", address: "23 Lý Thái Tổ, Hoàn Kiếm, Hà Nội",
        lat: 21.0260, lng: 105.8530, verified: true,
        description: "Specialty coffee & pastry",
      },
    }),
  ]);

  const today = new Date();

  // Danh mục ngành hàng (ProductCategory) — tra theo key, phòng khi chưa được seed qua backfill script
  const categoryKeys = ["BANH_NGOT", "DO_UONG", "MON_MAN", "TRANG_MIENG", "BANH_MI"];
  const categories = await Promise.all(
    categoryKeys.map((key) =>
      prisma.productCategory.upsert({
        where: { key },
        update: {},
        create: { key, label: key, industry: "BAKERY_CAFE" },
      })
    )
  );
  const categoryIdByKey = Object.fromEntries(categories.map((c) => [c.key, c.id]));

  // Tạo box mẫu cho hôm nay
  const boxData = [
    { id: "box-1", storeId: stores[0].id, name: "Box Bánh Ngọt Cuối Ngày", categoryKey: "BANH_NGOT", priceOriginal: 120000, priceSale: 59000, quantityTotal: 5, quantityLeft: 3, pickupStart: "18:00", pickupEnd: "20:00" },
    { id: "box-2", storeId: stores[1].id, name: "Box Đồ Uống & Bánh", categoryKey: "DO_UONG", priceOriginal: 100000, priceSale: 60000, quantityTotal: 4, quantityLeft: 2, pickupStart: "17:00", pickupEnd: "20:00" },
    { id: "box-3", storeId: stores[2].id, name: "Box Bánh Mặn", categoryKey: "MON_MAN", priceOriginal: 150000, priceSale: 60000, quantityTotal: 8, quantityLeft: 5, pickupStart: "19:00", pickupEnd: "20:30" },
    { id: "box-4", storeId: stores[3].id, name: "Box Pastry Mix", categoryKey: "TRANG_MIENG", priceOriginal: 160000, priceSale: 58000, quantityTotal: 3, quantityLeft: 1, pickupStart: "18:00", pickupEnd: "21:00" },
    { id: "box-5", storeId: stores[0].id, name: "Box Bánh Mì Đặc Biệt", categoryKey: "BANH_MI", priceOriginal: 80000, priceSale: 35000, quantityTotal: 6, quantityLeft: 4, pickupStart: "16:00", pickupEnd: "19:00" },
    { id: "box-6", storeId: stores[1].id, name: "Box Croissant & Latte", categoryKey: "BANH_NGOT", priceOriginal: 130000, priceSale: 65000, quantityTotal: 4, quantityLeft: 3, pickupStart: "15:00", pickupEnd: "18:00" },
  ];

  for (const b of boxData) {
    const categoryId = categoryIdByKey[b.categoryKey];
    await prisma.box.upsert({
      where: { id: b.id },
      update: { quantityLeft: b.quantityLeft, date: today, categoryId },
      create: {
        id: b.id,
        storeId: b.storeId,
        name: b.name,
        categoryId,
        priceOriginal: b.priceOriginal,
        priceSale: b.priceSale,
        quantityTotal: b.quantityTotal,
        quantityLeft: b.quantityLeft,
        pickupStart: b.pickupStart,
        pickupEnd: b.pickupEnd,
        date: today,
        active: true,
      },
    });
  }

  console.log("✅ Seed xong:", stores.length, "cửa hàng,", boxData.length, "box");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
