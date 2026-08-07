import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "./AdminSidebar";

export const metadata = { title: "Admin Portal - CrumbUp" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  const pendingCount = await prisma.store.count({ where: { verified: false } });

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f0e4" }}>
      <AdminSidebar pendingCount={pendingCount} />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}
