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
- [ปัญหาที่พบบ่อย](#ปัญหาที่พบบ่อย)
- [การ Deploy](#การ-deploy-แบบฟรี)
- [API](#api)
- [หลักการทำงาน](#หลักการทำงาน)

## ทดลองใช้งาน

| | ลิงก์ |
|---|---|
| เว็บไซต์ | https://short-url-eight-amber.vercel.app |
| API | https://sual-ajgc.onrender.com/api/health |
| Username / Password | สมัครสมาชิกได้เองที่หน้าเว็บ (ผู้ใช้ทั่วไป) |

> เซิร์ฟเวอร์ API ใช้ Render แบบฟรี หากไม่มีการใช้งานนาน การเปิดครั้งแรกอาจใช้เวลา 30–50 วินาที

## ความสามารถของระบบ

| ความสามารถ | รายละเอียด |
|---|---|
| บัญชีผู้ใช้ | สมัครและเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน ผู้ใช้แต่ละคนเห็นเฉพาะลิงก์และรายงานของตัวเอง |
| ผู้ดูแลระบบ (admin) | เห็นรายงานทั้งระบบหรือแยกรายผู้ใช้, จัดการลิงก์ทุกอัน, ตั้ง/ถอดสิทธิ์ admin, รีเซ็ตรหัสผ่าน, ลบผู้ใช้ |
| สร้าง Short URL | กรอก URL แล้วได้ลิงก์สั้นที่คลิกไปยัง URL ต้นฉบับได้จริง |
| QR Code | สร้าง QR Code ของ Short URL สแกนแล้วไปยัง URL ต้นฉบับ ดาวน์โหลดเป็น PNG ได้ |
| ประวัติลิงก์ | แสดง URL ที่กรอก, Short URL, จำนวนการเปิด และวันที่สร้าง ค้นหาได้ |
| สถิติการเปิด | จำนวนเปิดทั้งหมด, ผู้เข้าชมไม่ซ้ำ, กราฟ 14 วันล่าสุด, แยกตามอุปกรณ์และที่มา, รายการเปิดล่าสุด |
| ฟีเจอร์เพิ่มเติม | ตั้งรหัสลิงก์เอง, กำหนดวันหมดอายุ, เปิด/ปิดลิงก์, ลบลิงก์ |

## เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 19, Vite, React Router, qrcode.react, Recharts |
| Backend | Node.js 18+, Express 5, nanoid, bcryptjs, jsonwebtoken |
| Database | PostgreSQL (เชื่อมต่อด้วย `pg`) |
| Hosting | Vercel (Frontend), Render (Backend), Neon (Database) |

## สถาปัตยกรรมระบบ

![Short URL System Architecture](docs/architecture.svg)

```mermaid
flowchart LR
    U[ผู้ใช้งาน<br/>เบราว์เซอร์] --> FE[React + Vite<br/>Vercel]
    FE -- REST API /api/* --> BE[Node.js + Express<br/>Render]
    V[ผู้เข้าชม<br/>คลิก / สแกน QR] -- GET /:code --> BE
    BE --> DB[(PostgreSQL<br/>Neon)]
```

ผู้ใช้งานใช้หน้าเว็บ React เพื่อสร้างลิงก์และดูสถิติ ส่วนผู้เข้าชมที่คลิกหรือสแกน QR Code จะเรียก Backend โดยตรง แล้วถูก redirect ไปยัง URL ต้นฉบับทันที

## Data Flow Diagram (DFD Level 0)

![Short URL DFD Level 0](docs/dfd-level0.svg)

<details>
<summary>แบบ Mermaid</summary>

```mermaid
flowchart LR
    U[ผู้ใช้]
    A[ผู้ดูแลระบบ]
    V[ผู้เข้าชม]
    R1[(D1 users)]
    R2[(D2 urls)]
    R3[(D3 clicks)]

    P1((1.0<br/>สมัครสมาชิก<br/>และเข้าสู่ระบบ))
    P2((2.0<br/>สร้าง<br/>Short URL))
    P3((3.0<br/>สร้าง<br/>QR Code))
    P4((4.0<br/>Redirect และ<br/>บันทึกการเปิด))
    P5((5.0<br/>แสดงรายงาน<br/>และสถิติ))
    P6((6.0<br/>จัดการลิงก์))
    P7((7.0<br/>จัดการผู้ใช้))

    D1[(D1 users)]
    D2[(D2 urls)]
    D3[(D3 clicks)]

    U <-- "ข้อมูลเข้าสู่ระบบ / Token" --> P1
    A <-- "ข้อมูลเข้าสู่ระบบ / Token" --> P1
    P1 <-- "ข้อมูลบัญชี / รหัสผ่าน hash" --> D1

    U <-- "URL ต้นฉบับ, รหัสที่ตั้งเอง, วันหมดอายุ / Short URL" --> P2
    A <-- "URL ต้นฉบับ, รหัสที่ตั้งเอง, วันหมดอายุ / Short URL" --> P2
    P2 -- "ข้อมูลลิงก์ใหม่" --> D2
    U <-- "Short URL / รูป QR Code" --> P3
    A <-- "Short URL / รูป QR Code" --> P3

    V <-- "รหัสลิงก์สั้น / URL ปลายทาง" --> P4
    R2 -- "URL ต้นฉบับ, สถานะลิงก์" --> P4
    P4 -- "ข้อมูลการเปิด" --> D3

    U <-- "เงื่อนไขรายงาน / รายงานของตัวเอง" --> P5
    A <-- "เงื่อนไขรายงาน / รายงานทั้งระบบ" --> P5
    R1 -- "ชื่อเจ้าของลิงก์" --> P5
    R2 -- "รายการลิงก์" --> P5
    R3 -- "ข้อมูลการเปิด" --> P5

    U -- "สถานะลิงก์ของตัวเอง" --> P6
    A -- "สถานะลิงก์ของทุกคน" --> P6
    P6 -- "สถานะลิงก์" --> D2
    P6 -- "ข้อมูลการเปิดที่ลบ" --> D3

    A <-- "ข้อมูลสิทธิ์ผู้ใช้ / รายชื่อผู้ใช้" --> P7
    R2 -- "จำนวนลิงก์" --> P7
    P7 <-- "รายชื่อผู้ใช้ / สิทธิ์, รหัสผ่านใหม่" --> D1
    P7 -- "ลิงก์ของผู้ใช้ที่ลบ" --> D2
    P7 <-- "จำนวนการเปิด / ข้อมูลการเปิดที่ลบ" --> D3
```

</details>

Context Diagram, DFD Level 1, Workflow, ตารางข้อมูลเข้า-ออกของแต่ละกระบวนการ, Data Dictionary และ Normalization ดูได้ที่ [docs/design.md](docs/design.md)
ภาพรวม Architecture + DFD + ER ในภาพเดียว: [docs/system-overview.svg](docs/system-overview.svg)
DFD Level 0 + ER Diagram แบบ PDF (A4 แนวนอน 2 หน้า): [docs/short-url-dfd-er.pdf](docs/short-url-dfd-er.pdf)
เอกสารส่งงานฉบับเต็ม (PDF 6 หน้า): [docs/short-url-report.pdf](docs/short-url-report.pdf)

## ER Diagram

![Short URL ER Diagram](docs/er-diagram.svg)

```mermaid
erDiagram
    USERS ||--o{ URLS : "สร้าง"
    URLS ||--o{ CLICKS : "ถูกเปิด"
    USERS {
        SERIAL id PK
        VARCHAR(30) username UK "NOT NULL"
        VARCHAR(100) password_hash "NOT NULL (bcrypt)"
        VARCHAR(10) role "user | admin"
        TIMESTAMPTZ created_at "DEFAULT now()"
    }
    URLS {
        SERIAL id PK
        INTEGER user_id FK "ON DELETE SET NULL"
        TEXT original_url "NOT NULL"
        VARCHAR(20) short_code UK "NOT NULL"
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
| `users` | บัญชีผู้ใช้ เก็บรหัสผ่านเป็น hash (bcrypt) ไม่เก็บรหัสผ่านจริง และสิทธิ์ `user` หรือ `admin` |
| `urls` | เก็บ URL ต้นฉบับคู่กับรหัสสั้น (`short_code` เป็น UNIQUE) และเจ้าของลิงก์ (`user_id`) |
| `clicks` | เก็บการเปิด Short URL หนึ่งแถวต่อหนึ่งครั้ง ใช้คำนวณสถิติ |

ผู้ใช้ 1 คนสร้างได้หลายลิงก์ (1:N) และลิงก์ 1 อันถูกเปิดได้หลายครั้ง (1:N) ฐานข้อมูลออกแบบตามหลัก Normalization ถึง 3NF โดยไม่เก็บข้อมูลที่คำนวณได้ซ้ำ เช่น จำนวนการเปิด (นับจาก `clicks`) และรูป QR Code (สร้างจาก `short_code`) รายละเอียดการ Normalize และ Data Dictionary อยู่ที่ [docs/design.md](docs/design.md)

## โครงสร้างโปรเจกต์

```
short-url/
├── backend/                     Node.js + Express
│   ├── db/
│   │   └── schema.sql           สร้างตาราง users, urls, clicks
│   ├── scripts/init-db.js       สร้างฐานข้อมูลและรัน schema.sql
│   ├── src/
│   │   ├── index.js             เริ่มเซิร์ฟเวอร์ สร้างตาราง และสร้าง admin หลัก
│   │   ├── db.js                เชื่อมต่อ PostgreSQL
│   │   ├── auth.js              hash รหัสผ่าน, ออก/ตรวจ token, ตรวจสิทธิ์
│   │   ├── routes/auth.js       สมัคร / เข้าสู่ระบบ
│   │   ├── routes/users.js      จัดการผู้ใช้ (admin)
│   │   ├── routes/urls.js       ลิงก์และรายงาน (กรองตามเจ้าของ)
│   │   ├── routes/redirect.js   GET /:code → บันทึกการเปิด → redirect
│   │   └── utils/               ตรวจ URL, แยกอุปกรณ์, hash IP
│   └── .env.example
├── frontend/                    React + Vite
│   ├── src/
│   │   ├── pages/               Login, Home, History, Stats, Users
│   │   ├── components/          AuthProvider, RequireAuth, UrlForm, Charts, QrBlock ฯลฯ
│   │   ├── api.js               เรียก Backend
│   │   ├── format.js            จัดรูปแบบวันที่ ตัวเลข และชื่ออุปกรณ์
│   │   └── styles.css
│   ├── vercel.json
│   └── .env.example
├── docs/design.md               เอกสารออกแบบระบบ
└── README.md
```

## การติดตั้งและรันบนเครื่อง

ภาพรวมขั้นตอน (ใช้เวลาประมาณ 15–20 นาทีสำหรับการติดตั้งครั้งแรก)

1. ติดตั้งโปรแกรมที่ต้องใช้ (Node.js, Git, PostgreSQL)
2. ดาวน์โหลดโค้ด
3. ตั้งค่า Backend
4. สร้างฐานข้อมูลและตาราง
5. รัน Backend
6. ตั้งค่าและรัน Frontend
7. ทดลองใช้งาน

> คำสั่งในคู่มือนี้ใช้ได้ทั้ง PowerShell / Terminal ของ Windows, macOS และ Linux
> ยกเว้นที่ระบุว่าเป็นของระบบปฏิบัติการใดโดยเฉพาะ

### ขั้นที่ 1: ติดตั้งโปรแกรมที่ต้องใช้

| โปรแกรม | เวอร์ชัน | ดาวน์โหลด | หมายเหตุ |
|---|---|---|---|
| Node.js | 18 ขึ้นไป (แนะนำ 22 LTS) | [nodejs.org](https://nodejs.org) | ติดตั้งแล้วจะได้ `npm` มาด้วย |
| Git | ล่าสุด | [git-scm.com](https://git-scm.com) | ใช้ดาวน์โหลดโค้ด (ข้ามได้ถ้าโหลดเป็นไฟล์ ZIP) |
| PostgreSQL | 14 ขึ้นไป | [postgresql.org/download](https://www.postgresql.org/download/) | ระหว่างติดตั้ง **จดรหัสผ่านของ user `postgres` ไว้** และใช้พอร์ต `5432` ตามค่าเริ่มต้น โปรแกรม pgAdmin ติดมาด้วย ใช้ดูข้อมูลในฐานข้อมูลได้ |

ตรวจว่าติดตั้งสำเร็จ (เปิด Terminal ใหม่หลังติดตั้งเสร็จ):

```bash
node -v
```

```bash
npm -v
```

```bash
git --version
```

ต้องเห็นเลขเวอร์ชัน เช่น `v22.x.x` ถ้าขึ้นว่าไม่รู้จักคำสั่ง ให้ปิดแล้วเปิด Terminal ใหม่ หรือรีสตาร์ตเครื่อง

ตรวจว่า PostgreSQL ทำงานอยู่:

- **Windows:** กด `Win + R` พิมพ์ `services.msc` หา `postgresql-x64-<เวอร์ชัน>` สถานะต้องเป็น **Running** ถ้าไม่ใช่ให้คลิกขวาแล้วเลือก **Start**
- **macOS / Linux:** รัน `pg_isready` ต้องได้ข้อความ `accepting connections`

### ขั้นที่ 2: ดาวน์โหลดโค้ด

```bash
git clone https://github.com/Rung03/short-url.git
```

```bash
cd short-url
```

หรือดาวน์โหลดไฟล์ ZIP จากหน้า GitHub (ปุ่ม **Code → Download ZIP**) แล้วแตกไฟล์ จากนั้นเปิด Terminal ที่โฟลเดอร์ที่แตกออกมา

ในโฟลเดอร์จะมี `backend/` (API) และ `frontend/` (หน้าเว็บ) ต้องติดตั้งและรันแยกกันทั้งสองส่วน

### ขั้นที่ 3: ตั้งค่า Backend

เข้าโฟลเดอร์ backend แล้วติดตั้ง package:

```bash
cd backend
```

```bash
npm install
```

คัดลอกไฟล์ตั้งค่าตัวอย่าง:

```bash
cp .env.example .env
```

(ถ้าใช้ Command Prompt ของ Windows ให้ใช้ `copy .env.example .env` แทน)

เปิดไฟล์ `backend/.env` ด้วยโปรแกรมแก้ไขข้อความ (เช่น VS Code หรือ Notepad) แล้วแก้ค่าเหล่านี้:

| ตัวแปร | ต้องแก้เป็น |
|---|---|
| `DB_PASSWORD` | รหัสผ่านของ user `postgres` ที่ตั้งไว้ตอนติดตั้ง PostgreSQL |
| `ADMIN_USERNAME` | ชื่อผู้ดูแลระบบหลัก เช่น `admin` (a-z, 0-9, `_` `.` `-` ยาว 3–30 ตัว) |
| `ADMIN_PASSWORD` | รหัสผ่านผู้ดูแลระบบหลัก **อย่างน้อย 8 ตัวอักษร** |
| `JWT_SECRET` | ข้อความสุ่มยาวๆ (ดูวิธีสร้างด้านล่าง) |
| `IP_SALT` | ข้อความสุ่มยาวๆ อีกชุด (ห้ามซ้ำกับ `JWT_SECRET`) |

ค่าอื่นใช้ตามตัวอย่างได้เลย

สร้างข้อความสุ่มสำหรับ `JWT_SECRET` และ `IP_SALT` (รันสองครั้ง ได้คนละค่า):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

ตัวอย่างไฟล์ `backend/.env` ที่ตั้งค่าแล้ว:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=รหัสผ่าน postgres ของคุณ
DB_NAME=shorturl
DB_SSL=false
BASE_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:5173
IP_SALT=ข้อความสุ่มชุดที่ 1
STATS_TIMEZONE=Asia/Bangkok
JWT_SECRET=ข้อความสุ่มชุดที่ 2
ADMIN_USERNAME=admin
ADMIN_PASSWORD=รหัสผ่าน admin อย่างน้อย 8 ตัว
```

> ไฟล์ `.env` มีรหัสผ่าน ห้ามอัปโหลดขึ้น GitHub (ไฟล์ `.gitignore` กันไว้ให้แล้ว)

### ขั้นที่ 4: สร้างฐานข้อมูลและตาราง

ยังอยู่ในโฟลเดอร์ `backend`:

```bash
npm run db:init
```

คำสั่งนี้จะสร้างฐานข้อมูลชื่อ `shorturl` (ถ้ายังไม่มี) และสร้างตาราง `users`, `urls`, `clicks` ผลลัพธ์ที่ถูกต้อง:

```
Created database "shorturl".
Database "shorturl" ready.

Table: clicks
...
Table: urls
...
Table: users
...
```

- ไม่มีข้อมูลตัวอย่าง ตารางจะว่าง
- รันซ้ำได้โดยไม่ลบข้อมูลเดิม
- ถ้าไม่ได้รันขั้นนี้ Backend ก็จะสร้างตารางให้เองตอนเริ่มทำงาน แต่ต้องมีฐานข้อมูล `shorturl` อยู่ก่อน

### ขั้นที่ 5: รัน Backend

```bash
npm run dev
```

ผลลัพธ์ที่ถูกต้อง:

```
[nodemon] starting `node src/index.js`
API running on http://localhost:4000
```

ตอนเริ่มครั้งแรก ระบบจะสร้างบัญชีผู้ดูแลระบบหลักจาก `ADMIN_USERNAME` / `ADMIN_PASSWORD` ให้อัตโนมัติ

ตรวจการเชื่อมต่อ: เปิดเบราว์เซอร์ไปที่ http://localhost:4000/api/health ต้องได้

```json
{ "status": "ok", "database": "connected" }
```

**ปล่อย Terminal นี้ไว้** (Backend ต้องรันอยู่ตลอดที่ใช้งาน) ถ้าจะหยุดให้กด `Ctrl + C`

### ขั้นที่ 6: ตั้งค่าและรัน Frontend

**เปิด Terminal ใหม่อีกหน้าต่าง** ไปที่โฟลเดอร์โปรเจกต์ แล้ว:

```bash
cd frontend
```

```bash
npm install
```

```bash
cp .env.example .env
```

ไฟล์ `frontend/.env` มีค่าเดียว ใช้ตามตัวอย่างได้เลยเมื่อรันบนเครื่อง:

```env
VITE_API_URL=http://localhost:4000
```

รันหน้าเว็บ:

```bash
npm run dev
```

ผลลัพธ์ที่ถูกต้อง:

```
VITE v8.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

### ขั้นที่ 7: ทดลองใช้งาน

1. เปิด http://localhost:5173 ระบบจะพาไปหน้า Login
2. **เข้าสู่ระบบเป็นผู้ดูแลระบบ:** แท็บ **Login** ใส่ `ADMIN_USERNAME` / `ADMIN_PASSWORD` ที่ตั้งไว้ใน `backend/.env`
3. **สร้างผู้ใช้ทั่วไป:** กด **Logout** แล้วไปแท็บ **Register** สมัครบัญชีใหม่
4. **ย่อลิงก์:** แท็บ **Shorten** วาง URL แล้วกด **สร้างลิงก์สั้น** จะได้ลิงก์สั้นและ QR Code
5. **ทดสอบลิงก์:** คลิกลิงก์สั้น (หรือสแกน QR ด้วยมือถือที่ต่อ Wi-Fi เดียวกัน ดูหมายเหตุด้านล่าง) ต้องไปที่ URL ต้นฉบับ
6. **ดูสถิติ:** แท็บ **Dashboard** จะเห็นจำนวนการเปิดและกราฟ
7. **จัดการผู้ใช้:** เข้าสู่ระบบด้วย admin แล้วไปแท็บ **Users**

> สแกน QR ด้วยมือถือไม่ได้เมื่อรันบนเครื่อง เพราะลิงก์เป็น `localhost` (มือถือมองไม่เห็นเครื่องเรา)
> ถ้าต้องการทดสอบด้วยมือถือ ให้แก้ `BASE_URL` ใน `backend/.env` เป็น IP ของเครื่องในวง Wi-Fi เช่น `http://192.168.1.10:4000` แล้วรีสตาร์ต Backend

### คำสั่งที่ใช้บ่อย

| โฟลเดอร์ | คำสั่ง | ใช้ทำอะไร |
|---|---|---|
| `backend` | `npm run dev` | รัน API แบบพัฒนา (รีสตาร์ตเองเมื่อแก้โค้ด) |
| `backend` | `npm start` | รัน API แบบ production |
| `backend` | `npm run db:init` | สร้างฐานข้อมูลและตาราง |
| `frontend` | `npm run dev` | รันหน้าเว็บแบบพัฒนา |
| `frontend` | `npm run build` | build หน้าเว็บสำหรับ deploy (ได้โฟลเดอร์ `dist/`) |
| `frontend` | `npm run lint` | ตรวจโค้ด |

> แก้ไฟล์ `.env` แล้วต้อง **หยุดด้วย `Ctrl + C` แล้วรันใหม่** ทั้ง Backend และ Frontend เพราะค่าใน `.env` ถูกอ่านตอนเริ่มเท่านั้น

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
| `BASE_URL` | `http://localhost:4000` | โดเมนที่ใช้ประกอบเป็น Short URL ต้องตรงกับ `PORT` (บน Render ไม่ต้องตั้ง) |
| `CORS_ORIGIN` | `http://localhost:5173` | โดเมนของ Frontend ที่อนุญาต (คั่นด้วย `,` ได้, ห้ามมี `/` ท้าย) |
| `IP_SALT` | ข้อความสุ่ม | ใช้ hash IP ของผู้เข้าชม |
| `STATS_TIMEZONE` | `Asia/Bangkok` | เขตเวลาที่ใช้นับสถิติรายวัน |
| `JWT_SECRET` | ข้อความสุ่มยาวๆ | ใช้เซ็น token เข้าสู่ระบบ ถ้าเปลี่ยน ทุกคนต้องเข้าสู่ระบบใหม่ |
| `ADMIN_USERNAME` | `admin` | ชื่อผู้ดูแลระบบหลัก สร้างให้อัตโนมัติตอนเซิร์ฟเวอร์เริ่ม |
| `ADMIN_PASSWORD` | รหัสผ่าน 8 ตัวขึ้นไป | รหัสผ่านผู้ดูแลระบบหลัก เปลี่ยนค่านี้แล้วรีสตาร์ตเพื่อรีเซ็ตรหัสผ่าน admin หลัก |

Frontend (`frontend/.env`)

| ตัวแปร | ตัวอย่าง | คำอธิบาย |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | ที่อยู่ของ Backend (ห้ามมี `/` ท้าย) |

### ปัญหาที่พบบ่อย

| อาการ / ข้อความ error | สาเหตุ | วิธีแก้ |
|---|---|---|
| `password authentication failed for user "postgres"` | `DB_PASSWORD` ใน `backend/.env` ไม่ถูก | ใส่รหัสผ่าน postgres ที่ถูกต้อง ลองเข้าด้วย pgAdmin เพื่อยืนยันรหัส |
| `connect ECONNREFUSED 127.0.0.1:5432` | PostgreSQL ไม่ได้ทำงาน | เปิด service PostgreSQL (ดูขั้นที่ 1) |
| `/api/health` ได้ `"database": "disconnected"` | Backend ต่อฐานข้อมูลไม่ได้ | ดูข้อความ error ใน Terminal ของ Backend แล้วแก้ตามสองข้อด้านบน |
| `database "shorturl" does not exist` | ยังไม่ได้สร้างฐานข้อมูล | รัน `npm run db:init` ในโฟลเดอร์ `backend` |
| `listen EADDRINUSE: address already in use :::4000` | มีโปรแกรมอื่นใช้พอร์ต 4000 อยู่ | ปิดโปรแกรมนั้น หรือเปลี่ยนพอร์ต 3 ที่ให้ตรงกัน: `PORT` และ `BASE_URL` ใน `backend/.env`, `VITE_API_URL` ใน `frontend/.env` |
| ลิงก์สั้นเปิดแล้วขึ้น "ไม่พบลิงก์" หรือเปิดไม่ได้ | `BASE_URL` ไม่ตรงกับที่อยู่ Backend จริง (เช่น เปลี่ยน `PORT` แต่ไม่ได้เปลี่ยน `BASE_URL`) | แก้ `BASE_URL` ให้ตรงกับที่อยู่ Backend แล้วรีสตาร์ต Backend |
| หน้าเว็บขึ้น "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" | Backend ไม่ได้รัน หรือ `VITE_API_URL` ผิด | ตรวจว่า Terminal ของ Backend ยังรันอยู่ และ `VITE_API_URL` ถูกต้อง แล้วรัน Frontend ใหม่ |
| Console ของเบราว์เซอร์ขึ้น `blocked by CORS policy` | `CORS_ORIGIN` ไม่ตรงกับที่อยู่หน้าเว็บ | ตั้ง `CORS_ORIGIN` ให้ตรงกับที่อยู่หน้าเว็บทุกตัวอักษร (รวม `http://` และพอร์ต ไม่มี `/` ท้าย) แล้วรีสตาร์ต Backend |
| Login ด้วย admin ไม่ได้ | ไม่ได้ตั้ง `ADMIN_USERNAME` / `ADMIN_PASSWORD` หรือรหัสสั้นกว่า 8 ตัว | ดูใน Terminal ของ Backend ถ้าขึ้น `ADMIN_USERNAME / ADMIN_PASSWORD not set` ให้ตั้งค่าแล้วรีสตาร์ต Backend |
| Login ผิดแล้วขึ้น "กรุณารอ 15 นาที" | ใส่รหัสผิด 5 ครั้งติดกัน | รอ 15 นาที หรือรีสตาร์ต Backend (ตัวนับจะเริ่มใหม่) |
| `vite: command not found` หรือ `nodemon: command not found` | ยังไม่ได้ `npm install` ในโฟลเดอร์นั้น | รัน `npm install` ในโฟลเดอร์ `frontend` / `backend` |
| `npm` ไม่รู้จักคำสั่ง | ยังไม่ได้ติดตั้ง Node.js หรือยังไม่ได้เปิด Terminal ใหม่ | ติดตั้ง Node.js แล้วเปิด Terminal ใหม่ |
| PowerShell ขึ้น `running scripts is disabled on this system` | Windows ปิดการรันสคริปต์ | ใช้ Command Prompt แทน หรือรัน `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` ใน PowerShell |

## การ Deploy แบบฟรี

ใช้ 3 บริการแบบฟรี: **Neon** (ฐานข้อมูล), **Render** (Backend), **Vercel** (Frontend) ทั้งสามเข้าสู่ระบบด้วยบัญชี GitHub ได้

### ขั้นที่ 1: เอาโค้ดขึ้น GitHub

Fork หรือ push repository นี้ขึ้น GitHub ของตัวเอง (Render และ Vercel ดึงโค้ดจาก GitHub)

### ขั้นที่ 2: สร้างฐานข้อมูลบน Neon

1. สมัคร/เข้าสู่ระบบที่ [neon.tech](https://neon.tech)
2. กด **New Project** ตั้งชื่อ เช่น `short-url` เลือก Region **Singapore** (ใกล้ไทยที่สุด)
3. กด **Connect** แล้วกด **Show password** ก่อน จากนั้นคัดลอก **Connection string** (ขึ้นต้นด้วย `postgresql://`)

ไม่ต้องสร้างตารางเอง Backend สร้างให้อัตโนมัติตอนเริ่มทำงาน

> ถ้าคัดลอกตอนรหัสผ่านยังเป็น `********` Backend จะต่อฐานข้อมูลไม่ได้ (`password authentication failed`)

### ขั้นที่ 3: Deploy Backend บน Render

1. สมัคร/เข้าสู่ระบบที่ [render.com](https://render.com)
2. ไปที่ **Account Settings → Git Providers** เชื่อม GitHub และอนุญาตให้เข้าถึง repository นี้ (ถ้าไม่เชื่อม Render จะไม่ deploy อัตโนมัติเมื่อ push)
3. เลือกวิธีสร้างอย่างใดอย่างหนึ่ง

**แบบ A: Blueprint (แนะนำ)**
- กด **New → Blueprint** แล้วเลือก repository นี้
- Render อ่านค่าจาก [render.yaml](render.yaml) ให้เอง ทั้ง Root Directory, คำสั่ง build/start, Region และตัวแปรส่วนใหญ่
- กรอก `DATABASE_URL` (connection string จาก Neon), `ADMIN_USERNAME`, `ADMIN_PASSWORD` แล้วกด **Apply**

**แบบ B: สร้าง Web Service เอง**
- กด **New → Web Service** แล้วเลือก repository นี้ ตั้งค่าดังนี้:

| ช่อง | ค่า |
|---|---|
| Name | ชื่อสั้นๆ (กลายเป็นโดเมน `<ชื่อ>.onrender.com`) |
| Region | Singapore |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |

- ในส่วน **Environment Variables** เพิ่ม:

| Key | Value |
|---|---|
| `DATABASE_URL` | connection string จาก Neon |
| `DB_SSL` | `true` |
| `JWT_SECRET` | ข้อความสุ่มยาวๆ |
| `IP_SALT` | ข้อความสุ่มยาวๆ อีกชุด |
| `ADMIN_USERNAME` | ชื่อผู้ดูแลระบบหลัก |
| `ADMIN_PASSWORD` | รหัสผ่านผู้ดูแลระบบหลัก (อย่างน้อย 8 ตัว) |
| `CORS_ORIGIN` | ใส่ `*` ไปก่อน แล้วแก้ในขั้นที่ 5 |
| `STATS_TIMEZONE` | `Asia/Bangkok` |
| `NODE_VERSION` | `22` |

4. รอ build เสร็จ ใน **Logs** ต้องเห็น `API running on ...` และ `Your service is live`
5. คัดลอกโดเมนของ service (เช่น `https://xxxx.onrender.com`) แล้วเปิด `https://xxxx.onrender.com/api/health` ต้องได้ `"database": "connected"`

`BASE_URL` ไม่ต้องตั้ง ระบบใช้โดเมนของ Render ให้อัตโนมัติ

### ขั้นที่ 4: Deploy Frontend บน Vercel

1. สมัคร/เข้าสู่ระบบที่ [vercel.com](https://vercel.com)
2. กด **Add New → Project** แล้ว Import repository นี้
3. ตั้งค่า:

| ช่อง | ค่า |
|---|---|
| Root Directory | `frontend` (สำคัญ ถ้าไม่ตั้งจะ build ไม่ผ่าน `vite: command not found`) |
| Framework Preset | Vite (เลือกให้อัตโนมัติ) |
| Environment Variables | `VITE_API_URL` = โดเมนของ Render จากขั้นที่ 3 (ไม่มี `/` ท้าย) |

4. กด **Deploy** แล้วคัดลอกโดเมนที่ได้ (เช่น `https://xxxx.vercel.app`)

> แก้ `VITE_API_URL` ภายหลัง ต้องกด **Deployments → ⋯ → Redeploy** ด้วย เพราะค่านี้ถูกใส่ลงในหน้าเว็บตอน build

### ขั้นที่ 5: จำกัดให้เฉพาะหน้าเว็บของเราเรียก API ได้

กลับไปที่ Render → service ของ Backend → **Environment** แก้ `CORS_ORIGIN` จาก `*` เป็นโดเมนของ Vercel เช่น `https://xxxx.vercel.app` (ไม่มี `/` ท้าย) แล้วกด **Save**

### ขั้นที่ 6: ตรวจสอบ

- [ ] เปิดโดเมน Vercel แล้วเห็นหน้า Login
- [ ] เข้าสู่ระบบด้วย `ADMIN_USERNAME` / `ADMIN_PASSWORD` ได้
- [ ] สร้างลิงก์สั้นได้ และลิงก์ขึ้นต้นด้วยโดเมนของ Render
- [ ] คลิกลิงก์สั้นหรือสแกน QR แล้วไปที่ URL ต้นฉบับ
- [ ] Dashboard แสดงจำนวนการเปิดเพิ่มขึ้น

> Render แบบฟรีจะหยุดทำงานเมื่อไม่มีการใช้งานประมาณ 15 นาที การเปิดครั้งถัดไปต้องรอ 30–50 วินาที

## API

| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| GET | `/api/health` | ทุกคน | ตรวจสถานะเซิร์ฟเวอร์และฐานข้อมูล |
| POST | `/api/auth/register` | ทุกคน | สมัครสมาชิก ได้ token กลับมา |
| POST | `/api/auth/login` | ทุกคน | เข้าสู่ระบบ ได้ token กลับมา (ผิด 5 ครั้งใน 15 นาทีจะถูกพัก) |
| GET | `/api/auth/me` | ผู้ใช้ | ข้อมูลผู้ใช้ที่เข้าสู่ระบบอยู่ |
| POST | `/api/urls` | ผู้ใช้ | สร้าง Short URL |
| GET | `/api/urls?search=&userId=` | ผู้ใช้ | ลิงก์ของตัวเอง (admin: ทุกลิงก์ หรือกรองด้วย `userId`) |
| GET | `/api/urls/summary?userId=` | ผู้ใช้ | ข้อมูล dashboard ของลิงก์ตัวเอง (admin: ทั้งระบบ หรือรายผู้ใช้) |
| GET | `/api/urls/:id/stats` | เจ้าของ / admin | สถิติของลิงก์ |
| PATCH | `/api/urls/:id` | เจ้าของ / admin | เปิด/ปิดลิงก์ |
| DELETE | `/api/urls/:id` | เจ้าของ / admin | ลบลิงก์พร้อมสถิติ |
| GET | `/api/users` | admin | รายชื่อผู้ใช้ พร้อมจำนวนลิงก์และการเปิด |
| PATCH | `/api/users/:id` | admin | ตั้ง/ถอดสิทธิ์ admin (ยกเว้น admin หลักและตัวเอง) |
| POST | `/api/users/:id/password` | admin | รีเซ็ตรหัสผ่านผู้ใช้ |
| DELETE | `/api/users/:id` | admin | ลบผู้ใช้พร้อมลิงก์และสถิติของผู้ใช้นั้น (ยกเว้น admin หลักและตัวเอง) |
| GET | `/:code` | ทุกคน | บันทึกการเปิดแล้ว redirect ไปยัง URL ต้นฉบับ |

API ที่ต้องเข้าสู่ระบบ ส่ง token ใน header `Authorization: Bearer <token>` ลิงก์ของคนอื่นจะตอบ 404 เหมือนไม่มีลิงก์นั้น

### ตัวอย่าง: สร้าง Short URL

```bash
curl -X POST http://localhost:4000/api/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token จาก /api/auth/login>" \
  -d '{"url": "https://www.synerry.com"}'
```

ข้อมูลที่ส่งได้: `url` (จำเป็น), `customCode`, `expiresAt` (ISO 8601 ถ้าไม่ส่ง ลิงก์จะไม่มีวันหมดอายุ)

```json
{
  "id": 3,
  "originalUrl": "https://www.synerry.com/",
  "shortCode": "igFYEhG",
  "shortUrl": "http://localhost:4000/igFYEhG",
  "isActive": true,
  "expiresAt": null,
  "createdAt": "2026-10-01T04:04:42.490Z",
  "status": "active",
  "clickCount": 0
}
```

### รหัสสถานะ

| สถานะ | ความหมาย |
|---|---|
| 201 | สร้างลิงก์สำเร็จ |
| 302 | Redirect ไปยัง URL ต้นฉบับ |
| 400 | ข้อมูลไม่ถูกต้อง เช่น URL ผิดรูปแบบ |
| 401 | ยังไม่ได้เข้าสู่ระบบ token หมดอายุ หรือชื่อผู้ใช้/รหัสผ่านไม่ถูกต้อง |
| 403 | ไม่มีสิทธิ์ เช่น ผู้ใช้ทั่วไปเรียก API ของ admin |
| 404 | ไม่พบลิงก์ (รวมถึงลิงก์ของคนอื่น) |
| 409 | รหัสที่ตั้งเองหรือชื่อผู้ใช้ถูกใช้แล้ว |
| 429 | เข้าสู่ระบบผิดเกินจำนวนครั้งที่กำหนด |
| 410 | ลิงก์ถูกปิดใช้งานหรือหมดอายุ |

## หลักการทำงาน

**การสร้างรหัสสั้น** ระบบสุ่มรหัส 7 ตัวอักษรจาก base62 (`0-9`, `a-z`, `A-Z`) ด้วย `nanoid` ได้ประมาณ 3.5 ล้านล้านรหัส หากรหัสซ้ำ คอลัมน์ `short_code` ที่เป็น UNIQUE จะปฏิเสธการบันทึก และระบบจะสุ่มใหม่

**การตรวจ URL** เติม `https://` ให้อัตโนมัติถ้าไม่ได้ใส่ รับเฉพาะ `http` และ `https` และไม่ให้ย่อลิงก์ของระบบเองเพื่อป้องกันการ redirect วนซ้ำ

**การ Redirect** ใช้ HTTP 302 คู่กับ `Cache-Control: no-store` แทน 301 เพราะ 301 ทำให้เบราว์เซอร์จำปลายทางไว้และไม่กลับมาถามเซิร์ฟเวอร์ ทำให้นับการเปิดไม่ได้

**สถิติ** ทุกการเปิดบันทึกเวลา, ประเภทอุปกรณ์, เว็บที่มา และ IP ที่ผ่านการ hash ด้วย SHA-256 ผสม salt จึงนับผู้เข้าชมไม่ซ้ำได้โดยไม่เก็บ IP จริง

**QR Code** สร้างฝั่ง Frontend จาก Short URL ทุกครั้ง จึงไม่ต้องเก็บรูปในฐานข้อมูล และเนื่องจาก QR Code ชี้ไปที่ Short URL การสแกนจึงถูกนับในสถิติเหมือนการคลิก

## ผู้พัฒนา

รุ่งธิชัย ถึงสุข (Rungtichai Thungsuk) · GitHub [@Rung03](https://github.com/Rung03)
