# Event TIRD — Operations Desk

ระบบภายใน Event TIRD สำหรับจัดการผู้เข้าร่วม ออกบัตร QR ควบคุมจุด Check-in และดูรายงานของโครงการ IIRFA 2026 เพียงโครงการเดียว

สร้างด้วย Next.js App Router, TypeScript, Tailwind CSS, Prisma และ PostgreSQL

## Development

1. คัดลอก .env.example เป็น .env.local
2. ตั้งค่า DATABASE_URL และ AUTH_SECRET
3. รัน npm install
4. รัน npm run db:generate
5. รัน npm run dev

Development mode เปิด auth bypass โดยค่าเริ่มต้น ปิดได้ด้วย DEV_AUTH_BYPASS=false