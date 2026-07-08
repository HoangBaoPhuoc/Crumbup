import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Registering with an email that's already tied to an account: stop here,
      // don't silently log the user in — send them back with an error instead.
      if (intent === "register" && data.user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: data.user.email },
          select: { id: true },
        });
        if (existing && existing.id !== data.user.id) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/register?error=email-exists`);
        }
      }

      const meta = data.user.user_metadata ?? {};
      const roleFromMeta = meta.role === "BUSINESS" ? "BUSINESS" : "CUSTOMER";
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id:    data.user.id,
          email: data.user.email!,
          name:  meta.name ?? meta.full_name ?? data.user.email!.split("@")[0],
          phone: meta.phone ?? null,
          role:  roleFromMeta as "CUSTOMER" | "BUSINESS",
        },
      });

      return NextResponse.redirect(`${origin}/discover`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
