# Short URL

ระบบย่อลิงก์ (Short URL) พร้อม QR Code และสถิติการเปิดลิงก์
พัฒนาด้วย **React** (Frontend), **Node.js + Express** (Backend) และ **PostgreSQL** (Database)

## สารบัญ

- [ทดลองใช้งาน](#ทดลองใช้งาน)
- [ความสามารถของระบบ](#ความสามารถของระบบ)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [Data Flow Diagram](#data-flow-diagram-dfd-level-0)
- [ER Diagram](#er-diagram)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้งและรันบนเครื่อง](#การติดตั้งและรันบนเครื่อง)
- [การ Deploy](#การ-deploy-แบบฟรี)
- [API](#api)
- [หลักการทำงาน](#หลักการทำงาน)

## ทดลองใช้งาน

| | ลิงก์ |
|---|---|
| เว็บไซต์ | `https://ใส่ลิงก์-vercel` |
| API | `https://ใส่ลิงก์-render` |
| Username / Password | ไม่ต้องใช้ |

> เซิร์ฟเวอร์ API ใช้ Render แบบฟรี หากไม่มีการใช้งานนาน การเปิดครั้งแรกอาจใช้เวลา 30–50 วินาที

## ความสามารถของระบบ

| ความสามารถ | รายละเอียด |
|---|---|
| สร้าง Short URL | กรอก URL แล้วได้ลิงก์สั้นที่คลิกไปยัง URL ต้นฉบับได้จริง |
| QR Code | สร้าง QR Code ของ Short URL สแกนแล้วไปยัง URL ต้นฉบับ ดาวน์โหลดเป็น PNG ได้ |
| ประวัติลิงก์ | แสดง URL ที่กรอก, Short URL, จำนวนการเปิด และวันที่สร้าง ค้นหาได้ |
| สถิติการเปิด | จำนวนเปิดทั้งหมด, ผู้เข้าชมไม่ซ้ำ, กราฟ 14 วันล่าสุด, แยกตามอุปกรณ์และที่มา, รายการเปิดล่าสุด |
| ฟีเจอร์เพิ่มเติม | ตั้งรหัสลิงก์เอง, กำหนดวันหมดอายุ, เปิด/ปิดลิงก์, ลบลิงก์ |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19, Vite, React Router, qrcode.react, Recharts |
| Backend | Node.js 18+, Express 5, nanoid |
| Database | PostgreSQL (เชื่อมต่อด้วย `pg`) |
| Hosting | Vercel (Frontend), Render (Backend), Neon (Database) |

## สถาปัตยกรรมระบบ

```mermaid
flowchart LR
    U[ผู้ใช้งาน<br/>เบราว์เซอร์] --> FE[React + Vite<br/>Vercel]
    FE -- REST API /api/* --> BE[Node.js + Express<br/>Render]
    V[ผู้เข้าชม<br/>คลิก / สแกน QR] -- GET /:code --> BE
    BE --> DB[(PostgreSQL<br/>Neon)]
```

ผู้ใช้งานใช้หน้าเว็บ React เพื่อสร้างลิงก์และดูสถิติ ส่วนผู้เข้าชมที่คลิกหรือสแกน QR Code จะเรียก Backend โดยตรง แล้วถูก redirect ไปยัง URL ต้นฉบับทันที

## Data Flow Diagram (DFD Level 0)

```mermaid
flowchart LR
    U[ผู้ใช้งาน]
    V[ผู้เข้าชม]

    P1((1.0<br/>สร้าง Short URL))
    P2((2.0<br/>สร้าง QR Code))
    P3((3.0<br/>Redirect และ<br/>บันทึกการเปิด))
    P4((4.0<br/>แสดงประวัติ<br/>และสถิติ))
    P5((5.0<br/>จัดการลิงก์))

    D1[(D1 urls)]
    D2[(D2 clicks)]

    U -- URL ต้นฉบับ --> P1
    P1 -- ข้อมูลลิงก์ใหม่ --> D1
    P1 -- Short URL --> U
    P1 -- Short URL --> P2
    P2 -- รูป QR Code --> U

    V -- short_code --> P3
    D1 -- URL ต้นฉบับ, สถานะ --> P3
    P3 -- ข้อมูลการเปิด --> D2
    P3 -- Redirect 302 --> V

    U -- คำขอดูประวัติ --> P4
    D1 -- รายการลิงก์ --> P4
    D2 -- ข้อมูลการเปิด --> P4
    P4 -- ประวัติและสถิติ --> U

    U -- เปิด/ปิด/ลบลิงก์ --> P5
    P5 -- สถานะลิงก์ --> D1
```

Context Diagram, Workflow และตารางข้อมูลเข้า-ออกของแต่ละกระบวนการ ดูได้ที่ [docs/design.md](docs/design.md)

## ER Diagram

```mermaid
erDiagram
    URLS ||--o{ CLICKS : "ถูกเปิด"
    URLS {
        SERIAL id PK
        TEXT original_url "NOT NULL"
        VARCHAR(20) short_code UK "NOT NULL"
        VARCHAR(255) title
        BOOLEAN is_active "DEFAULT true"
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at "DEFAULT now()"
    }
    CLICKS {
        BIGSERIAL id PK
        INTEGER url_id FK "ON DELETE CASCADE"
        TIMESTAMPTZ clicked_at "DEFAULT now()"
        VARCHAR(64) ip_hash
        VARCHAR(500) user_agent
        VARCHAR(500) referrer
        VARCHAR(20) device_type
    }
```

| ตาราง | หน้าที่ |
|---|---|
| `urls` | เก็บ URL ต้นฉบับคู่กับรหัสสั้น (`short_code` เป็น UNIQUE) |
| `clicks` | เก็บการเปิด Short URL หนึ่งแถวต่อหนึ่งครั้ง ใช้คำนวณสถิติ |

ลิงก์ 1 อันถูกเปิดได้หลายครั้ง (1:N) ฐานข้อมูลออกแบบตามหลัก Normalization ถึง 3NF โดยไม่เก็บข้อมูลที่คำนวณได้ซ้ำ เช่น จำนวนการเปิด (นับจาก `clicks`) และรูป QR Code (สร้างจาก `short_code`) รายละเอียดการ Normalize และ Data Dictionary อยู่ที่ [docs/design.md](docs/design.md)

## โครงสร้างโปรเจกต์

```
short-url/
├── backend/                     Node.js + Express
│   ├── db/
│   │   └── schema.sql           สร้างตาราง urls, clicks
│   ├── scripts/init-db.js       สร้างฐานข้อมูลและรัน schema.sql
│   ├── src/
│   │   ├── index.js             เริ่มเซิร์ฟเวอร์
│   │   ├── db.js                เชื่อมต่อ PostgreSQL
│   │   ├── routes/urls.js       REST API
│   │   ├── routes/redirect.js   GET /:code → บันทึกการเปิด → redirect
│   │   └── utils/               ตรวจ URL, แยกอุปกรณ์, hash IP
│   └── .env.example
├── frontend/                    React + Vite
│   ├── src/
│   │   ├── pages/               Home, History, Stats
│   │   ├── components/          UrlForm, LinkTag, QrBlock, CopyButton
│   │   ├── api.js               เรียก Backend
│   │   ├── format.js            จัดรูปแบบวันที่ ตัวเลข และชื่ออุปกรณ์
│   │   └── styles.css
│   ├── vercel.json
│   └── .env.example
├── docs/design.md               เอกสารออกแบบระบบ
└── README.md
```

## การติดตั้งและรันบนเครื่อง

### สิ่งที่ต้องมี

- Node.js 18 ขึ้นไป
- PostgreSQL 14 ขึ้นไป

### 1. Clone โปรเจกต์

```bash
git clone https://github.com/Rung03/short-url.git
cd short-url
```

### 2. รัน Backend

```bash
cd backend
npm install
cp .env.example .env          # ใส่ DB_PASSWORD ของ user postgres
npm run db:init               # สร้างฐานข้อมูล shorturl และตาราง (ไม่มีข้อมูลตัวอย่าง)
npm run dev                   # http://localhost:4000
```

`npm run db:init` สร้างฐานข้อมูลให้เองถ้ายังไม่มี และรันซ้ำได้โดยไม่ลบข้อมูลเดิม

ตรวจการเชื่อมต่อฐานข้อมูลที่ http://localhost:4000/api/health ต้องได้ผลลัพธ์

```json
{ "status": "ok", "database": "connected" }
```

### 3. รัน Frontend (เปิด Terminal ใหม่)

```bash
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:4000
npm run dev                   # http://localhost:5173
```

เปิด http://localhost:5173 เพื่อใช้งาน

### ตัวแปร .env

Backend (`backend/.env`)

| ตัวแปร | ตัวอย่าง | คำอธิบาย |
|---|---|---|
| `PORT` | `4000` | พอร์ตของ API |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | ที่อยู่ PostgreSQL บนเครื่อง |
| `DB_USER` / `DB_PASSWORD` | `postgres` / รหัสผ่าน | บัญชี PostgreSQL |
| `DB_NAME` | `shorturl` | ชื่อฐานข้อมูล |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | ใช้แทน `DB_*` เมื่อ deploy (Neon, Supabase) |
| `DB_SSL` | `false` | ตั้งเป็น `true` เมื่อใช้ Neon หรือ Supabase |
| `BASE_URL` | `http://localhost:4000` | โดเมนที่ใช้ประกอบเป็น Short URL |
| `CORS_ORIGIN` | `http://localhost:5173` | โดเมนของ Frontend ที่อนุญาต (คั่นด้วย `,` ได้) |
| `IP_SALT` | ข้อความสุ่ม | ใช้ hash IP ของผู้เข้าชม |
| `STATS_TIMEZONE` | `Asia/Bangkok` | เขตเวลาที่ใช้นับสถิติรายวัน |

Frontend (`frontend/.env`)

| ตัวแปร | ตัวอย่าง | คำอธิบาย |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | ที่อยู่ของ Backend |

## การ Deploy แบบฟรี

1. **Database (Neon)** สร้างโปรเจกต์ที่ [neon.tech](https://neon.tech) แล้วคัดลอก connection string
   (ไม่ต้องสร้างตารางเอง Backend สร้างให้อัตโนมัติตอนเริ่มทำงาน)

2. **Backend (Render)** ที่ [render.com](https://render.com) เลือก **New → Blueprint** แล้วเลือก repository นี้
   - Render อ่านค่าจาก [render.yaml](render.yaml) ให้เอง
   - ใส่ `DATABASE_URL` = connection string ของ Neon
   - `BASE_URL` ไม่ต้องใส่ ระบบใช้โดเมนของ Render ให้อัตโนมัติ

3. **Frontend (Vercel)** Import repository ที่ [vercel.com](https://vercel.com)
   - Root Directory: `frontend`
   - Environment: `VITE_API_URL` = โดเมนของ Render

4. กลับไปที่ Render แก้ `CORS_ORIGIN` จาก `*` เป็นโดเมนของ Vercel เพื่อให้เฉพาะหน้าเว็บของเราเรียก API ได้

## API

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/health` | ตรวจสถานะเซิร์ฟเวอร์และฐานข้อมูล |
| POST | `/api/urls` | สร้าง Short URL |
| GET | `/api/urls?search=` | ประวัติลิงก์ทั้งหมดพร้อมจำนวนการเปิด |
| GET | `/api/urls/summary` | จำนวนลิงก์และการเปิดรวมทั้งระบบ |
| GET | `/api/urls/:id/stats` | สถิติของลิงก์ |
| PATCH | `/api/urls/:id` | เปิด/ปิดลิงก์ |
| DELETE | `/api/urls/:id` | ลบลิงก์พร้อมสถิติ |
| GET | `/:code` | บันทึกการเปิดแล้ว redirect ไปยัง URL ต้นฉบับ |

### ตัวอย่าง: สร้าง Short URL

```bash
curl -X POST http://localhost:4000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.synerry.com"}'
```

ข้อมูลที่ส่งได้: `url` (จำเป็น), `title`, `customCode`, `expiresAt` (ISO 8601)

```json
{
  "id": 3,
  "originalUrl": "https://www.synerry.com/",
  "shortCode": "igFYEhG",
  "shortUrl": "http://localhost:4000/igFYEhG",
  "title": null,
  "isActive": true,
  "expiresAt": null,
  "createdAt": "2026-10-01T04:04:42.490Z",
  "clickCount": 0
}
```

### รหัสสถานะ

| สถานะ | ความหมาย |
|---|---|
| 201 | สร้างลิงก์สำเร็จ |
| 302 | Redirect ไปยัง URL ต้นฉบับ |
| 400 | ข้อมูลไม่ถูกต้อง เช่น URL ผิดรูปแบบ |
| 404 | ไม่พบลิงก์ |
| 409 | รหัสที่ตั้งเองถูกใช้แล้ว |
| 410 | ลิงก์ถูกปิดใช้งานหรือหมดอายุ |

## หลักการทำงาน

**การสร้างรหัสสั้น** ระบบสุ่มรหัส 7 ตัวอักษรจาก base62 (`0-9`, `a-z`, `A-Z`) ด้วย `nanoid` ได้ประมาณ 3.5 ล้านล้านรหัส หากรหัสซ้ำ คอลัมน์ `short_code` ที่เป็น UNIQUE จะปฏิเสธการบันทึก และระบบจะสุ่มใหม่

**การตรวจ URL** เติม `https://` ให้อัตโนมัติถ้าไม่ได้ใส่ รับเฉพาะ `http` และ `https` และไม่ให้ย่อลิงก์ของระบบเองเพื่อป้องกันการ redirect วนซ้ำ

**การ Redirect** ใช้ HTTP 302 คู่กับ `Cache-Control: no-store` แทน 301 เพราะ 301 ทำให้เบราว์เซอร์จำปลายทางไว้และไม่กลับมาถามเซิร์ฟเวอร์ ทำให้นับการเปิดไม่ได้

**สถิติ** ทุกการเปิดบันทึกเวลา, ประเภทอุปกรณ์, เว็บที่มา และ IP ที่ผ่านการ hash ด้วย SHA-256 ผสม salt จึงนับผู้เข้าชมไม่ซ้ำได้โดยไม่เก็บ IP จริง

**QR Code** สร้างฝั่ง Frontend จาก Short URL ทุกครั้ง จึงไม่ต้องเก็บรูปในฐานข้อมูล และเนื่องจาก QR Code ชี้ไปที่ Short URL การสแกนจึงถูกนับในสถิติเหมือนการคลิก

## ผู้พัฒนา

รุ่งธิชัย ถึงสุข (Rungtichai Thungsuk) · GitHub [@Rung03](https://github.com/Rung03)
