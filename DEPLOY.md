# Deploy Guide — FarmConnect

## 1. สร้าง TiDB Serverless (Database ฟรี)

1. ไปที่ https://tidbcloud.com → สมัคร (Google/GitHub)
2. สร้าง Cluster → **Serverless Tier** (ฟรี) → **AWS ap-southeast-1**
3. รอ ~5 นาที → คลิก **Connect** → Create password
4. Copy **Connection String**:
```
mysql://user:password@gateway01.ap-southeast-1.prod.aws.tidbcloud.com/events?ssl=true&rejectUnauthorized=true
```

## 2. สร้างตารางใน TiDB

```bash
# Install TiDB CLI (หรือใช้ UI ใน TiDB Cloud)
npx prisma db push
```

## 3. Deploy ไป Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

## 4. ตั้งค่า Environment Variables ใน Vercel Dashboard

ไปที่ Project → Settings → Environment Variables → Add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `mysql://user:pass@gateway01.ap-southeast-1.prod.aws.tidbcloud.com/events?ssl=true&rejectUnauthorized=true` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://farmconnect-app.vercel.app` |
| `DEEPSEEK_API_KEY` | `your-deepseek-api-key` |
| `NEXT_PUBLIC_APP_URL` | `https://farmconnect-app.vercel.app` |

## 5. Google OAuth (ถ้าต้องการ)

เพิ่ม URL ใน Google Cloud Console:
```
https://farmconnect-app.vercel.app/api/auth/callback/google
```
