# Event TIRD — GitHub + Vercel + Prisma Postgres Deployment

เอกสารนี้เตรียมไว้สำหรับ repository feetee00500/event และ Vercel project ของ Event TIRD

## 1. ก่อน push GitHub

ตรวจว่าไฟล์ต่อไปนี้ไม่ถูก commit:

- .env, .env.local, .env.*.local
- .vercel/
- node_modules/
- .next/
- *.log

ใช้ .env.example เป็น template เท่านั้น ห้ามใส่ค่า secret จริงใน GitHub

## 2. สร้าง/เชื่อม Prisma Postgres ใน Vercel

1. เปิด Vercel project ที่เชื่อมกับ GitHub repository
2. ไปที่ Storage → Create Database → Prisma Postgres
3. เลือก region ใกล้ผู้ใช้งานและสร้าง database
4. Connect database เข้ากับ project
5. ตรวจ Environment Variables ว่ามี DATABASE_URL ใน Production, Preview และ Development ตามที่ต้องการ

Prisma Postgres integration จะสร้าง DATABASE_URL ให้ Vercel project อัตโนมัติ อย่า hardcode URL ลง repository

## 3. Environment variables

ตั้งค่าอย่างน้อย:

- DATABASE_URL — จาก Prisma Postgres integration
- AUTH_SECRET — random secret ยาวสำหรับ Auth.js/NextAuth
- NEXTAUTH_URL — production URL เช่น https://event.example.com
- NEXT_PUBLIC_APP_URL — public URL ที่ใช้สร้างลิงก์ ticket
- DEV_AUTH_BYPASS=false — ห้ามเปิด bypass บน Preview/Production

กำหนดค่าแยก Production/Preview/Development อย่าให้ Preview ใช้ production database หากไม่จำเป็น

## 4. Migration workflow

ต้องมี prisma/migrations อยู่ใน GitHub ก่อน deploy schema จริง

สร้าง migration จาก development database หรือ Prisma Postgres development branch:

    npm run db:migrate -- --name init

ตรวจ migration:

    npm run db:validate
    npm run db:deploy

Production/Preview ใช้:

    npm run db:deploy

อย่าใช้ prisma db push กับ production เพราะไม่มี migration history ที่ใช้ review/rollback ได้

Migration ต้องรันก่อน application release หรือเป็น release job ที่ lock/ตรวจผลชัดเจน ไม่ควรใส่ migration ไว้ใน postinstall

## 5. Local verification with Vercel environment

หลัง link project แล้วสามารถดึง development variables:

    vercel link
    vercel env pull .env.local --environment=development
    npm run db:generate
    npm run db:validate
    npm run typecheck
    npm run lint
    npm run test
    npm run build

ห้าม commit .env.local

## 6. Vercel build settings

- Framework: Next.js
- Root Directory: repository root
- Install Command: npm install
- Build Command: npm run build
- Output: default Next.js output

postinstall จะเรียก prisma generate อัตโนมัติ ส่วน migration ใช้ release/migration step แยกต่างหาก

## 7. First deployment acceptance

หลัง Preview deploy ผ่าน ให้ตรวจ:

1. /login ไม่ bypass
2. /admin/dashboard อ่าน DB ได้
3. สร้าง Event จริงได้
4. สร้าง attendee และ public ticket ได้
5. QR check-in, duplicate, cancelled, expired และ time window ทำงาน
6. Reports และ export ได้ข้อมูลตรง
7. Vercel Functions ไม่มี Prisma initialization/pool errors
8. Production domain อยู่ใน NEXT_PUBLIC_APP_URL

ห้ามเปิดใช้ MULTI_DAY, REENTRY, offline check-in หรือ seed default users จนกว่า audit findings ที่เกี่ยวข้องจะปิด

## Official references

- https://docs.prisma.io/docs/guides/postgres/vercel
- https://docs.prisma.io/docs/orm/prisma-client/deployment/deploy-migrations-from-a-local-environment
- https://vercel.com/docs/environment-variables
- https://vercel.com/docs/postgres
