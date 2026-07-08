import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Normalise Vietnamese phone → E.164 (+84xxxxxxxxx)
function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  // Strip leading 0 if present (0901... → 901...), then prepend +84
  return `+84${digits.startsWith("0") ? digits.slice(1) : digits}`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;
  const supabase = await createClient();

  // ── SEND OTP ──────────────────────────────────────────────────────────────
  if (action === "send-otp") {
    const { mode, phone, email, name, isRegister } = body;

    if (mode === "phone") {
      const fullPhone = toE164(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
        options: isRegister ? { data: { name, role: "CUSTOMER" } } : {},
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: isRegister ? { name, role: "CUSTOMER" } : {},
        },
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── VERIFY OTP ────────────────────────────────────────────────────────────
  if (action === "verify-otp") {
    const { mode, phone, email, otp, name } = body;

    let result;
    if (mode === "phone") {
      result = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: otp,
        type: "sms",
      });
    } else {
      result = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });
    }

    const { data, error } = result;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Sync user to DB
    if (data.user) {
      const fullPhone = mode === "phone" ? toE164(phone) : null;
      const userEmail = data.user.email || null;
      const userName  = name || data.user.user_metadata?.name || "Người dùng";

      await prisma.user.upsert({
        where:  { id: data.user.id },
        update: {},
        create: {
          id:    data.user.id,
          email: userEmail,
          phone: fullPhone,
          name:  userName,
          role:  "CUSTOMER",
        },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // ── EMAIL + PASSWORD REGISTER ─────────────────────────────────────────────
  if (action === "register") {
    const { email, password, name, phone } = body;

    const existing = await prisma.user.findUnique({ where: { email }, select: { role: true } });
    if (existing) {
      const msg = existing.role === "BUSINESS"
        ? "Email này đã là tài khoản cửa hàng. Vui lòng đăng nhập."
        : "Email này đã có tài khoản. Vui lòng đăng nhập.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone }, select: { role: true } });
      if (existingPhone) {
        const msg = existingPhone.role === "BUSINESS"
          ? "Số điện thoại này đã là tài khoản cửa hàng."
          : "Số điện thoại này đã có tài khoản. Vui lòng đăng nhập.";
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "CUSTOMER", phone: phone || null },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin}/api/auth/callback`,
      },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    if (data.user && data.user.confirmed_at) {
      await prisma.user.upsert({
        where:  { id: data.user.id },
        update: {},
        create: { id: data.user.id, email: data.user.email, name, phone: phone || null, role: "CUSTOMER" },
      });
    }
    return NextResponse.json({ ok: true, needsConfirm: !data.user?.confirmed_at });
  }

  // ── EMAIL + PASSWORD LOGIN ────────────────────────────────────────────────
  if (action === "login") {
    const { email, password } = body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const dbUser = await prisma.user.upsert({
      where:  { id: data.user.id },
      update: {},
      create: {
        id:    data.user.id,
        email: data.user.email,
        name:  data.user.user_metadata?.name ?? email.split("@")[0],
        role:  data.user.user_metadata?.role === "BUSINESS" ? "BUSINESS" : "CUSTOMER",
      },
      select: { role: true },
    });
    return NextResponse.json({ ok: true, role: dbUser.role });
  }

  // ── SYNC USER TO DB (after client-side OTP verify) ───────────────────────
  if (action === "sync-user") {
    const { id, email, phone, name } = body;
    await prisma.user.upsert({
      where:  { id },
      update: {},
      create: {
        id,
        email: email || null,
        phone: phone || null,
        name:  name || "Người dùng",
        role:  "CUSTOMER",
      },
    });
    return NextResponse.json({ ok: true });
  }

  // ── SET PHONE (post-OAuth profile completion) ─────────────────────────────
  if (action === "set-phone") {
    const { phone } = body;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 9) return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    const normalizedPhone = toE164(digits);

    const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } });
    if (existingPhone && existingPhone.id !== user.id) {
      return NextResponse.json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." }, { status: 409 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { phone: normalizedPhone } });
    return NextResponse.json({ ok: true });
  }

  // ── SEND OTP TO VERIFY A PHONE CHANGE (always to the account's own email) ──
  if (action === "send-phone-change-otp") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    if (!user.email) return NextResponse.json({ error: "Tài khoản chưa có email" }, { status: 400 });

    const { error } = await supabase.auth.signInWithOtp({
      email: user.email,
      options: { shouldCreateUser: false },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  // ── VERIFY OTP + APPLY PHONE CHANGE ─────────────────────────────────────────
  if (action === "verify-phone-change") {
    const { otp, phone } = body;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

    const digits = String(phone || "").replace(/\D/g, "");
    if (digits.length < 9) return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    const normalizedPhone = toE164(digits);

    const existingPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone }, select: { id: true } });
    if (existingPhone && existingPhone.id !== user.id) {
      return NextResponse.json({ error: "Số điện thoại này đã được sử dụng bởi tài khoản khác." }, { status: 409 });
    }

    const { error } = await supabase.auth.verifyOtp({ email: user.email, token: otp, type: "email" });
    if (error) return NextResponse.json({ error: "Mã xác thực không đúng hoặc đã hết hạn." }, { status: 400 });

    await prisma.user.update({ where: { id: user.id }, data: { phone: normalizedPhone } });
    return NextResponse.json({ ok: true, phone: normalizedPhone });
  }

  if (action === "logout") {
    await supabase.auth.signOut();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
