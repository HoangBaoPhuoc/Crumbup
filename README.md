# Crumbup — Surprise Box

Nền tảng giải cứu thực phẩm bằng mô hình Surprise Box. Production-ready Next.js 14 app, sẵn sàng deploy lên Vercel.

## Cấu trúc

```
app/
├── page.tsx              # 01. Homepage
├── discover/             # 02. Khám phá Box (customer)
├── box/[id]/             # 03. Chi tiết Box
├── partner/              # 04. Dashboard đối tác
├── delivery/             # 05. Giao hàng & Nhận hàng
├── about/                # 06. Về chúng tôi
├── globals.css           # Design tokens + shared styles
└── layout.tsx
components/
├── SiteHeader.tsx        # Shared customer-facing header
└── SiteFooter.tsx        # Shared footer
```

## Cài đặt

```bash
npm install
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Routes

| URL | Trang |
|-----|------|
| `/` | Homepage |
| `/discover` | Khám phá Box (giao diện khách hàng) |
| `/box/1`, `/box/2`, ... | Chi tiết Box |
| `/partner` | Dashboard đối tác (cửa hàng) |
| `/delivery` | Giao hàng & Nhận hàng |
| `/about` | Về chúng tôi (sứ mệnh, FAQ) |
