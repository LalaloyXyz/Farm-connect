# FarmConnect 🚜

ตลาดสินค้าเกษตรออนไลน์ — Farmer to Consumer (F2C) Marketplace Platform

## Tech Stack

### ภาษา (Languages)
- **TypeScript** — หลักทั้งหมด (Frontend + Backend)
- **HTML / CSS** — JSX + TailwindCSS

### เฟรมเวิร์กและ Libraries (Frameworks & Libraries)
| ชื่อ | ใช้ทำอะไร |
|------|-----------|
| **Next.js 16** | React framework (App Router + Turbopack) |
| **React 19** | UI Components |
| **TailwindCSS v4** | CSS Utility Classes |
| **shadcn/ui** | UI Component Library (ใช้ @base-ui/react) |
| **Prisma 7** | ORM สำหรับฐานข้อมูล MySQL |
| **Auth.js v5** (NextAuth) | Authentication — Credentials + Google |
| **MySQL 8** | ฐานข้อมูลหลัก |
| **Leaflet + OpenStreetMap** | แผนที่แบบ Interactive |
| **bcryptjs** | เข้ารหัสรหัสผ่าน |
| **Zod** | Form & API Validation |
| **date-fns** | จัดการวันที่ |
| **Sonner** | Toast Notifications |
| **Lucide React** | Icon Library |

### เครื่องมือพัฒนา (Dev Tools)
- **VSCode**
- **Turbopack** (Next.js bundler)
- **Prisma Studio** — ดู/แก้ไข Database
- **Claude Code** — AI Assistant

## เริ่มต้นการใช้งาน

```bash
# 1. เริ่ม MySQL
sudo systemctl start mysql

# 2. รัน dev server
npm run dev

# 3. เปิดเบราว์เซอร์
# http://localhost:3000
```

## โครงสร้างหลัก
```
src/
├── app/           # Pages + API Routes
│   ├── (auth)/    # Login, Register
│   ├── buyer/     # Buyer Dashboard
│   ├── farmer/    # Farmer Dashboard
│   ├── admin/     # Admin Dashboard
│   ├── products/  # Product Listing/Detail
│   ├── farms/     # Farm Listing/Detail
│   ├── cart/      # Cart
│   ├── chat/      # Chat
│   └── api/       # REST API endpoints
├── components/    # Shared UI Components
├── hooks/         # Custom React Hooks
├── lib/           # Utilities, Auth, DB
└── types/         # TypeScript Types
```
