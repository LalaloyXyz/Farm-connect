# FarmConnect
# Professional Master Development Specification
Version 2.0
Production Ready

---

# 1. Project Overview

## Project Name

FarmConnect

## Project Description

FarmConnect คือแพลตฟอร์ม Marketplace สำหรับสินค้าเกษตรที่เชื่อมต่อเกษตรกรกับผู้บริโภคโดยตรง (Farmer to Consumer Marketplace)

ระบบรองรับทั้ง

- ซื้อสินค้าออนไลน์
- นัดรับสินค้าที่สวน
- นำทางไปยังสวน
- พูดคุยกับเกษตรกร
- รีวิวสินค้า
- รีวิวสวน
- ระบบ AI
- Dashboard สำหรับทุก Role

เป้าหมายคือช่วยให้เกษตรกรขายสินค้าได้โดยไม่ต้องผ่านพ่อค้าคนกลาง

---

# 2. Main Objectives

- ลดการพึ่งพาพ่อค้าคนกลาง
- ให้ผู้บริโภคเข้าถึงสินค้าโดยตรง
- เพิ่มรายได้เกษตรกร
- โปร่งใส
- ใช้งานง่าย
- รองรับมือถือ
- Production Ready
- รองรับผู้ใช้จำนวนมาก

---

# 3. Technology Stack

## Frontend

Next.js 16

TypeScript

TailwindCSS

shadcn/ui

Framer Motion

React Hook Form

Zod

Leaflet

React Leaflet

TanStack Query

Axios

PWA

---

## Backend

Next.js Route Handlers

Server Actions

Prisma ORM

MySQL

JWT

bcrypt

Socket.IO

Redis (Optional)

Cron Jobs

---

## Deployment

Vercel

External MySQL Server

Cloudflare

Cloudflare R2

GitHub Actions

Docker (Optional)

---

## AI

OpenAI API

หรือ

Local LLM

Features

- Product Description
- AI Chat
- AI Search
- Smart Recommendation

---

## Maps

OpenStreetMap

Leaflet

Nominatim

OpenRouteService

---

# 4. User Roles

ทั้งหมดมี 4 Roles

## Guest

สามารถ

- ดูสินค้า
- ค้นหาสินค้า
- ดูสวน
- ดูรีวิว

ไม่สามารถ

- ซื้อสินค้า
- แชท
- รีวิว

---

## Buyer

สามารถ

- ซื้อสินค้า
- เพิ่มลงตะกร้า
- แชท
- รีวิว
- ติดตามคำสั่งซื้อ
- ดูตำแหน่งสวน
- กดนำทาง
- รับสินค้าที่สวน

---

## Farmer

สามารถ

- เพิ่มสินค้า
- แก้ไขสินค้า
- ลบสินค้า
- เพิ่มตำแหน่งสวน
- อัปโหลดรูปสวน
- รับออเดอร์
- ตอบแชท
- ดูรายได้
- จัดการสต็อก

---

## Admin

สามารถ

จัดการทุกอย่าง

- Users
- Products
- Orders
- Reviews
- Reports
- Analytics
- AI Logs

---

# 5. Core Features

## Marketplace

✔ Product Listing

✔ Categories

✔ Search

✔ Filter

✔ Wishlist

✔ Cart

✔ Checkout

✔ Reviews

✔ Ratings

✔ Promotions

---

## Farm Features

✔ Farm Profile

✔ Farm Images

✔ Farm Description

✔ OpenStreetMap

✔ Farm Marker

✔ GPS

✔ Navigation

✔ Pickup at Farm

✔ Opening Hours

✔ Farm Reviews

---

## Communication

✔ Realtime Chat

✔ Image Message

✔ Read Status

✔ Notifications

✔ Typing Indicator

✔ Online Status

---

## AI

✔ AI Product Description

✔ AI Chatbot

✔ AI Search

✔ AI Recommendation

✔ AI FAQ

---

## Dashboard

Farmer Dashboard

Buyer Dashboard

Admin Dashboard

---

# 6. Folder Structure

/app

/components

/features

/lib

/actions

/prisma

/public

/styles

/hooks

/types

/constants

/utils

/services

/socket

/middleware.ts

---

# 7. Database

Prisma ORM

MySQL

ไม่มี Raw SQL

ทุก Query ใช้ Prisma

---

# 8. Authentication

ใช้

Auth.js

รองรับ

Email

Google

Facebook (Future)

Line Login (Future)

Apple Login (Future)

Password Hash

bcrypt

Session

JWT

---

# 9. Authorization

Middleware

Role-based Access Control

Guest

Buyer

Farmer

Admin

ทุก Route ต้องตรวจสอบสิทธิ์

---

# 10. Farm Location System

เกษตรกรต้องสามารถ

- ปักหมุดสวนบนแผนที่
- ค้นหาที่อยู่
- ลาก Marker
- บันทึก Latitude
- บันทึก Longitude
- รูปหน้าสวน
- เวลาเปิด
- เวลาปิด
- จังหวัด
- อำเภอ
- ตำบล
- รหัสไปรษณีย์

ใช้

OpenStreetMap

Leaflet

Nominatim API

OpenRouteService

เมื่อผู้ซื้อเปิดหน้าสวน

แสดง

- แผนที่
- Marker
- ระยะทาง
- เวลาเดินทาง
- ปุ่ม

"นำทางไปสวน"

รองรับ

Google Maps

Organic Maps

OpenStreetMap

Apple Maps

ผ่าน Deep Link

# 11. Database Design

Database Engine

MySQL 8+

ORM

Prisma ORM

Naming Convention

- snake_case สำหรับ Database
- PascalCase สำหรับ Prisma Model
- camelCase สำหรับ TypeScript

ทุก Primary Key ใช้

UUID

ทุกตารางต้องมี

created_at

updated_at

deleted_at (Soft Delete)

---

# 12. Database Models

ระบบประกอบด้วย

Users

Farms

FarmImages

Categories

Products

ProductImages

Orders

OrderItems

Cart

Wishlist

Reviews

Messages

Conversations

Notifications

Addresses

PickupAppointments

Payments

AIChatLogs

ActivityLogs

Reports

Coupons

Favorites

SearchHistory

ProductViews

FarmerFollowers

SystemSettings

Announcements

---

# 13. Users

ข้อมูลผู้ใช้งาน

Field

id

uuid

PK

first_name

varchar(100)

last_name

varchar(100)

email

unique

password

hashed

phone

avatar

role

BUYER

FARMER

ADMIN

email_verified

boolean

is_active

boolean

last_login

created_at

updated_at

deleted_at

---

Relation

Farmer

1 User

1 Farm

Buyer

1 User

Many Orders

Many Reviews

Many Messages

---

# 14. Farms

เกษตรกรมีสวนได้ 1 แห่ง (รองรับหลายแห่งในอนาคต)

Field

id

farmer_id

farm_name

description

cover_image

latitude

longitude

address

province

district

subdistrict

postal_code

opening_time

closing_time

phone

facebook

line

website

verified

rating_average

total_reviews

followers

created_at

updated_at

---

Relationship

Farm

hasMany Products

hasMany Reviews

hasMany Images

hasMany Followers

---

# 15. Farm Images

id

farm_id

image_url

sort_order

created_at

---

# 16. Categories

id

name

icon

description

slug

active

---

ตัวอย่าง

ผัก

ผลไม้

ข้าว

สมุนไพร

เมล็ดพันธุ์

ดอกไม้

ปุ๋ยอินทรีย์

เครื่องดื่ม

อาหารแปรรูป

---

# 17. Products

Field

id

farm_id

category_id

name

slug

description

price

stock

unit

weight

status

cover_image

rating

sold

view_count

pickup_available

delivery_available

featured

created_at

updated_at

deleted_at

---

Status

ACTIVE

OUT_OF_STOCK

HIDDEN

DELETED

---

# 18. Product Images

id

product_id

image_url

sort_order

created_at

---

# 19. Cart

Session Cart

หรือ

Database Cart

Field

id

buyer_id

product_id

quantity

created_at

---

# 20. Wishlist

buyer_id

product_id

created_at

---

# 21. Orders

Field

id

order_number

buyer_id

farm_id

payment_id

delivery_type

ONLINE

PICKUP

status

payment_status

subtotal

shipping_fee

discount

total

remark

created_at

updated_at

---

Order Status

Pending

Waiting Payment

Paid

Preparing

Shipping

Ready For Pickup

Completed

Cancelled

Refunded

---

# 22. Order Items

id

order_id

product_id

price

quantity

subtotal

---

# 23. Pickup Appointment

กรณีรับสินค้าที่สวน

Field

id

order_id

pickup_date

pickup_time

status

Buyer Confirmed

Farmer Confirmed

Completed

Cancelled

---

# 24. Reviews

Buyer รีวิวได้เฉพาะสินค้าที่ซื้อแล้ว

Field

id

buyer_id

farm_id

product_id

rating

comment

images

created_at

---

คะแนน

1-5 ดาว

---

# 25. Chat System

Conversation

id

buyer_id

farmer_id

last_message

last_message_time

created_at

---

Message

id

conversation_id

sender_id

message

image

message_type

TEXT

IMAGE

LOCATION

SYSTEM

is_read

created_at

---

Realtime

Socket.IO

---

Typing Indicator

Online Status

Read Receipt

Notification

รองรับทั้งหมด

---

# 26. Notifications

Field

id

user_id

title

message

type

ORDER

CHAT

SYSTEM

AI

PROMOTION

is_read

created_at

---

# 27. AI Chat Logs

Field

id

user_id

prompt

response

tokens

created_at

---

จำกัด

20 Requests / Day

ต่อ User

---

# 28. Product Views

เก็บสถิติ

user_id

product_id

viewed_at

---

# 29. Search History

keyword

buyer_id

searched_at

---

# 30. Farmer Followers

buyer_id

farm_id

created_at

ผู้ซื้อสามารถกดติดตามสวน

เมื่อสวนมีสินค้าใหม่

ระบบส่ง Notification

---

# 31. ER Diagram

User

↓

Farm

↓

Products

↓

Orders

↓

OrderItems

Buyer

↓

Reviews

↓

Notifications

↓

Chat

↓

AI

# 32. API Architecture

ใช้ Next.js App Router

ทุก API อยู่ใน

/app/api

หรือใช้

Server Actions

หลักการ

- RESTful API
- JSON Response
- Type-safe
- Validation ด้วย Zod
- Prisma ORM
- JWT/Auth.js
- Error Handling กลาง

---

# 33. Authentication API

POST

/api/auth/register

สมัครสมาชิก

ข้อมูล

- ชื่อ
- นามสกุล
- Email
- Password
- Phone
- Role

Response

201 Created

---

POST

/api/auth/login

เข้าสู่ระบบ

รองรับ

- Email
- Password

Response

Access Token

Refresh Session

---

POST

/api/auth/logout

ล้าง Session

---

GET

/api/auth/me

คืนข้อมูลผู้ใช้ปัจจุบัน

---

# 34. Farmer API

GET

/api/farmer/dashboard

ข้อมูล Dashboard

- รายได้
- จำนวนออเดอร์
- สินค้าทั้งหมด
- ยอดขายวันนี้
- ยอดขายเดือนนี้
- รีวิวล่าสุด

---

GET

/api/farmer/products

สินค้าของตัวเอง

---

POST

/api/farmer/products

เพิ่มสินค้า

รองรับ

รูปหลายรูป

AI Description

Categories

Pickup

Delivery

---

PATCH

/api/farmer/products/:id

แก้ไขสินค้า

---

DELETE

/api/farmer/products/:id

ลบสินค้า

Soft Delete

---

GET

/api/farmer/orders

ดูออเดอร์

Filter

Pending

Paid

Shipping

Pickup

Completed

---

PATCH

/api/farmer/orders/:id

อัปเดตสถานะ

---

# 35. Farm API

GET

/api/farms

รายการสวนทั้งหมด

Filter

จังหวัด

หมวดสินค้า

ระยะทาง

คะแนน

---

GET

/api/farms/:id

รายละเอียดสวน

Response

- ข้อมูลสวน
- รูปทั้งหมด
- แผนที่
- คะแนน
- รีวิว
- สินค้าทั้งหมด
- เวลาเปิด
- เวลาเดินทาง

---

POST

/api/farms

สร้างสวน

---

PATCH

/api/farms/:id

แก้ไขสวน

---

DELETE

/api/farms/:id

ลบสวน

---

# 36. Farm Map

ใช้

OpenStreetMap

Leaflet

Nominatim

OpenRouteService

---

เมื่อสร้างสวน

เกษตรกรสามารถ

ค้นหาที่อยู่

หรือ

กดบนแผนที่

Marker จะย้ายตามตำแหน่ง

ระบบบันทึก

Latitude

Longitude

Address

Province

District

Subdistrict

Postal Code

โดยอัตโนมัติ

Reverse Geocoding

---

# 37. Route Navigation

หน้าสวน

มีปุ่ม

นำทางไปสวน

รองรับ

Google Maps

https://www.google.com/maps/dir/?api=1&destination=LAT,LNG

Organic Maps

geo:LAT,LNG

Apple Maps

http://maps.apple.com/?daddr=LAT,LNG

OpenStreetMap

แสดง Route ผ่าน OpenRouteService

---

# 38. Product API

GET

/api/products

รองรับ

Pagination

Search

Filter

Sort

Category

Price

Distance

Province

---

GET

/api/products/:id

รายละเอียดสินค้า

ประกอบด้วย

สินค้า

สวน

รีวิว

รูป

สินค้าที่เกี่ยวข้อง

---

POST

/api/products

เฉพาะ Farmer

---

PATCH

/api/products/:id

---

DELETE

/api/products/:id

---

# 39. Search System

ค้นหาได้จาก

- ชื่อสินค้า
- ชื่อสวน
- จังหวัด
- อำเภอ
- หมวดหมู่
- ราคา
- ระยะทาง

Sort

Newest

Popular

Price ต่ำไปสูง

Price สูงไปต่ำ

Rating

Distance

AI Recommended

---

# 40. Nearby Farms

ใช้ Browser GPS

คำนวณระยะทาง

แสดง

สวนใกล้ฉัน

ภายใน

5 km

10 km

25 km

50 km

100 km

สามารถเปลี่ยนได้

---

# 41. Wishlist API

POST

/api/wishlist

เพิ่มรายการโปรด

---

DELETE

/api/wishlist/:id

---

GET

/api/wishlist

รายการทั้งหมด

---

# 42. Cart API

GET

/api/cart

POST

/api/cart

PATCH

/api/cart/:id

DELETE

/api/cart/:id

DELETE

/api/cart/clear

---

รองรับ

Session

หรือ

Database Cart

เมื่อ Login

Merge Cart อัตโนมัติ

---

# 43. Checkout

Flow

1

ตรวจสอบสินค้า

↓

2

ตรวจสอบ Stock

↓

3

คำนวณราคา

↓

4

สร้าง Order

↓

5

สร้าง Order Items

↓

6

ตัด Stock

↓

7

สร้าง Notification

↓

8

แจ้ง Farmer

↓

9

สำเร็จ

ทั้งหมดอยู่ใน

Database Transaction

Rollback ทุกกรณี

---

# 44. Delivery Type

Buyer เลือกได้

ส่งถึงบ้าน

หรือ

รับที่สวน

ถ้าเลือก

รับที่สวน

ระบบให้เลือก

วัน

เวลา

นัดรับ

พร้อมแจ้ง Farmer

---

# 45. Realtime Chat System

ใช้

Socket.IO

รองรับ

- Realtime Message
- Typing Indicator
- Read Receipt
- Online Status
- Image Message
- Location Message
- Push Notification

---

## Chat Features

Buyer สามารถ

- ส่งข้อความ
- ส่งรูปภาพ
- ส่งตำแหน่ง
- ดูสถานะอ่านแล้ว
- ลบข้อความฝั่งตัวเอง

Farmer สามารถ

- ตอบกลับ
- ส่งรูป
- แชร์ตำแหน่งสวน
- ส่งข้อความระบบ

---

## Conversation Rules

Buyer จะสร้างห้องสนทนาได้เมื่อ

- กด "ติดต่อเกษตรกร"
- ซื้อสินค้าแล้ว
- ถามรายละเอียดสินค้า

1 Buyer ↔ 1 Farmer

สามารถมีหลาย Conversation

---

## Message Types

TEXT

IMAGE

LOCATION

PRODUCT

SYSTEM

ORDER

---

## Chat Notification

แจ้งเตือนเมื่อ

- มีข้อความใหม่
- มีรูปใหม่
- มีคำสั่งซื้อใหม่
- มีการตอบกลับ

---

# 46. Notification System

Notification Types

ORDER

PAYMENT

CHAT

SYSTEM

PROMOTION

NEW_PRODUCT

FOLLOW

AI

---

Notification Delivery

- In-App Notification
- Browser Push Notification (PWA)
- Email (Future)

---

Notification Center

แสดง

- ยังไม่ได้อ่าน
- อ่านแล้ว
- ลบ
- อ่านทั้งหมด

---

# 47. Payment System

Version 1

เก็บสถานะการชำระเงิน

Payment Status

Pending

Waiting Verification

Paid

Failed

Refunded

Cancelled

---

Version 2 (Future)

รองรับ

- PromptPay QR
- Omise
- Stripe
- PayPal

---

Payment Flow

Checkout

↓

Create Order

↓

Create Payment

↓

Buyer Pay

↓

Verify Payment

↓

Update Order

↓

Notify Farmer

↓

Prepare Product

---

# 48. Order Tracking

Buyer สามารถติดตามสถานะ

Pending

↓

Paid

↓

Preparing

↓

Shipping

↓

Completed

หรือ

Ready For Pickup

↓

Completed

---

Timeline

แสดง

เวลา

ผู้ดำเนินการ

รายละเอียด

---

# 49. Pickup at Farm

Buyer เลือก

รับที่สวน

ระบบจะ

เลือก

- วันที่
- เวลา

Farmer กดยืนยัน

Buyer ได้ QR Code

เมื่อถึงสวน

Farmer Scan

Order Completed

---

QR Code

ประกอบด้วย

Order ID

Pickup Code

Expire Time

Encrypted Signature

---

# 50. Review System

Buyer รีวิวได้เฉพาะ

Order Completed

รีวิว

- คะแนนสินค้า
- คะแนนสวน
- ความตรงเวลา
- การบริการ
- ความคุ้มค่า

สามารถแนบ

- รูป
- วิดีโอ (Future)

---

Farmer Reply Review

เกษตรกรตอบรีวิวได้

1 ครั้ง

Admin ลบรีวิวไม่เหมาะสมได้

---

# 51. Dashboard

## Buyer Dashboard

- คำสั่งซื้อ
- รายการโปรด
- รีวิว
- ที่อยู่
- แจ้งเตือน
- ประวัติการค้นหา
- ร้านที่ติดตาม

---

## Farmer Dashboard

Overview

Today's Sales

Monthly Sales

Total Revenue

Orders

Visitors

Followers

Product Views

Top Products

Reviews

Recent Messages

Low Stock Alert

AI Usage

---

Charts

Sales

Revenue

Orders

Visitors

Top Categories

---

## Admin Dashboard

Users

Farmers

Buyers

Products

Orders

Revenue

Reports

Daily Active Users

Most Viewed Products

Most Popular Farms

Pending Reports

AI Usage

Server Status

Storage Usage

---

# 52. Analytics

Farmer

ดูได้

- จำนวนผู้เข้าชม
- จำนวนคลิก
- Conversion Rate
- ยอดขาย
- รายได้
- สินค้าขายดี
- ลูกค้าประจำ

Admin

ดูได้

- รายได้รวม
- จำนวนออเดอร์
- จำนวนผู้ใช้
- Active Users
- Growth
- จังหวัดยอดนิยม
- หมวดหมู่ยอดนิยม

---

# 53. Recommendation System

แนะนำสินค้าโดยใช้

- ประวัติการซื้อ
- ประวัติการค้นหา
- Wishlist
- Farm Follow
- จังหวัด
- ฤดูกาล

AI สามารถสร้าง

Recommended Products

Recommended Farms

Trending Products

Seasonal Products

---

# 54. Search Engine

ค้นหาแบบ

Keyword

Category

Province

District

Price

Distance

Rating

Newest

Popular

AI Search

Autocomplete

Search History

Trending Search

Recent Search

---

# 55. Favorite Farm

Buyer กด

Follow Farm

เมื่อ Farmer

- เพิ่มสินค้าใหม่
- จัดโปรโมชัน
- ถ่ายทอดสด (Future)

ระบบส่ง Notification

ทันที

---

# 56. Security

FarmConnect ต้องออกแบบให้ปลอดภัยตั้งแต่ต้น (Security by Design)

---

## Authentication

ใช้ Auth.js

Password Hash

bcrypt (Cost >= 12)

รองรับ

- Email Login
- Google Login
- Line Login (Future)

Session

HTTP Only Cookie

Secure Cookie

SameSite=Lax

JWT สำหรับ API ที่จำเป็น

---

## Authorization

Role Based Access Control (RBAC)

Roles

- Guest
- Buyer
- Farmer
- Admin

ทุก API ต้องตรวจสอบสิทธิ์

ตัวอย่าง

Guest

- ดูสินค้า
- ดูสวน

Buyer

- ซื้อสินค้า
- รีวิว
- แชท

Farmer

- จัดการสินค้าของตัวเอง
- จัดการสวนตัวเอง

Admin

- จัดการทุกระบบ

---

## CSRF Protection

เปิดใช้งานทุก Form

Server Actions

API POST

PUT

PATCH

DELETE

---

## XSS Protection

Escape HTML ทุกครั้ง

Sanitize Rich Text

ห้ามใช้

dangerouslySetInnerHTML

ยกเว้นผ่าน Sanitizer

---

## SQL Injection

ใช้ Prisma ORM เท่านั้น

ห้ามใช้

Raw SQL

ยกเว้นกรณีจำเป็น

ต้องใช้ Parameterized Query

---

## Rate Limiting

ใช้ Middleware

จำกัด

Login

10 ครั้ง / 10 นาที

Register

5 ครั้ง / ชั่วโมง

AI Chat

20 ครั้ง / วัน

Search

120 Requests / นาที

Chat

60 Messages / นาที

---

## File Upload

รองรับ

jpg

jpeg

png

webp

Maximum

10 MB

ตรวจสอบ

Mime Type

File Signature

Virus Scan (Future)

Rename File

UUID

ไม่ใช้ชื่อไฟล์เดิม

---

## Environment Variables

ห้าม Hardcode

DATABASE_URL

AUTH_SECRET

OPENAI_API_KEY

R2_ACCESS_KEY

R2_SECRET

SMTP_PASSWORD

---

# 57. Folder Structure

/app

(auth)

(shop)

(farmer)

(admin)

(api)

layout.tsx

page.tsx

loading.tsx

error.tsx

not-found.tsx

---

/components

ui

layout

forms

cards

chat

map

dashboard

product

farm

order

review

common

---

/actions

auth

product

order

farm

chat

review

notification

---

/lib

auth.ts

db.ts

socket.ts

redis.ts

r2.ts

validation.ts

utils.ts

---

/prisma

schema.prisma

seed.ts

---

/hooks

/useAuth

/useCart

/useChat

/useNotification

/useLocation

/useMap

---

/types

User.ts

Farm.ts

Product.ts

Order.ts

Chat.ts

Review.ts

---

/services

AIService

ChatService

OrderService

FarmService

SearchService

NotificationService

RecommendationService

---

# 58. Coding Standards

Language

TypeScript

Strict Mode

เปิดใช้งาน

ESLint

Prettier

Husky

Lint-Staged

Commitlint

---

Naming

Components

PascalCase

Variables

camelCase

Database

snake_case

Constants

UPPER_CASE

---

Business Logic

ห้ามอยู่ใน Component

อยู่ใน

Service Layer

Server Action

Repository

---

ทุก Function

ต้องมี

Type

Error Handling

Validation

---

# 59. Performance

ใช้

Next.js App Router

Server Components

Dynamic Import

Lazy Loading

Image Optimization

Cache

ISR

Edge Middleware

Compression

Pagination

Virtual List

Skeleton Loading

Streaming

---

Target

Lighthouse

Performance > 95

Accessibility > 95

SEO > 95

Best Practice > 95

---

# 60. Deployment

Hosting

Vercel

Frontend

Next.js

Backend

Next.js API

Database

External MySQL Server

Storage

Cloudflare R2

Domain

farmconnect.app

HTTPS

SSL

Cloudflare DNS

---

Deployment Flow

Developer

↓

GitHub

↓

GitHub Actions

↓

Vercel

↓

Production

---

Environment

Development

Testing

Staging

Production

---

# 61. Backup

Database

Backup ทุกวัน

เก็บ

30 วัน

Images

Cloudflare R2 Versioning

Log

90 วัน

---

# 62. Monitoring

ใช้

Vercel Analytics

Google Analytics

Sentry

Better Stack

Health Check

Error Tracking

Performance Tracking

---

# 63. Logging

บันทึก

Login

Logout

Register

Order

Payment

Review

AI

Admin

Delete Product

Ban User

Export Report

---

# 64. Testing

Unit Test

Integration Test

E2E Test

Load Test

Security Test

Mobile Test

Browser Test

Accessibility Test

---

Framework

Vitest

Playwright

---

Coverage

ไม่น้อยกว่า

80%

---

# 65. Production Checklist

Authentication

Authorization

Validation

Responsive

Dark Mode

SEO

PWA

Sitemap

robots.txt

Open Graph

Analytics

Error Logging

Backup

Monitoring

HTTPS

Compression

Lazy Loading

Security Headers

Database Index

Rate Limit

Cache

Image Optimization

Accessibility

---

# 66. Future Roadmap

Version 2

- PromptPay QR Payment
- Stripe
- Omise
- Live Streaming ขายสินค้า
- ประมูลสินค้า
- ระบบขนส่งเชื่อม API
- ระบบคูปอง
- Affiliate
- สมาชิก VIP
- AI ตรวจคุณภาพรูปสินค้า
- AI แนะนำราคาขาย
- AI พยากรณ์ยอดขาย
- ระบบคลังสินค้า
- Multi-Farm
- Multi-Language
- English
- ไทย
- จีน

---

Version 3

- Mobile App (Flutter)
- AI Voice Assistant
- Video Call Buyer ↔ Farmer
- IoT Smart Farm Dashboard
- Drone Monitoring
- Smart Weather Forecast
- Carbon Credit Dashboard
- Blockchain Traceability
- Smart Contract
- AI Disease Detection
- AI Yield Prediction

---

# Definition of Done

โครงการจะถือว่าเสร็จสมบูรณ์เมื่อ

- ระบบสามารถ Deploy บน Vercel ได้
- ใช้งานร่วมกับ MySQL Server ภายนอกได้
- ใช้ Prisma ORM ทั้งระบบ
- รองรับ OpenStreetMap พร้อมปักหมุดสวน
- มีระบบซื้อออนไลน์และรับสินค้าที่สวน
- มีระบบแชทแบบเรียลไทม์
- มีระบบ AI
- มี Dashboard สำหรับ Buyer, Farmer และ Admin
- รองรับ Responsive และ PWA
- ผ่านการทดสอบทั้งหมด
- ไม่มี Hardcoded Secrets
- พร้อมใช้งานจริง (Production Ready)

---

## Final Instruction for AI Coding Agent

สร้างโปรเจกต์ทั้งหมดแบบ Complete Production Application

ห้ามสร้างเพียง Scaffold หรือ Placeholder

ทุกหน้า ทุก API ทุกฐานข้อมูล ทุก Prisma Model ทุก Component และทุก Business Logic ต้องพัฒนาให้สมบูรณ์และสามารถรันได้จริง

หากผลลัพธ์ยาวเกิน Context ให้สร้างต่ออัตโนมัติจนกว่าทั้งโปรเจกต์จะสมบูรณ์ โดยไม่ข้ามส่วนใด

# 67. AI Coding Rules

AI Coding Agent ต้องปฏิบัติตามกฎต่อไปนี้ทุกข้อ

## General

- Generate production-ready code only.
- Do not generate placeholder code.
- Do not use TODO comments.
- Every feature must be fully functional.
- Every API must be implemented.
- Every page must be responsive.
- Every component must be reusable.
- Every database query must use Prisma.
- Never use raw SQL unless explicitly required.

---

## Code Quality

- Use TypeScript Strict Mode.
- No duplicated code.
- Follow SOLID principles.
- Follow Clean Architecture.
- Follow DRY.
- Follow KISS.

---

## Components

- Small reusable components.
- Maximum 300 lines/component.
- Extract business logic into hooks or services.
- No inline business logic.

---

## Error Handling

Every API must

- Validate request.
- Return proper HTTP Status.
- Return JSON.

Example

{
  "success": false,
  "message": "Product not found"
}

---

## API Response Format

Success

{
  "success": true,
  "data": {}
}

Error

{
  "success": false,
  "message": "",
  "errors": []
}

---

## Validation

Use

Zod

React Hook Form

Backend validation is mandatory.

Never trust frontend validation.

---

## Database Rules

Every table

- UUID Primary Key
- created_at
- updated_at
- soft delete

Indexes

must be created for

email

farm_id

product_id

order_id

created_at

---

## Transactions

Order

Checkout

Payment

Stock

must always use

Prisma Transaction

---

## Security Rules

Escape HTML

Sanitize inputs

Validate uploads

Rate Limit

Secure Cookie

HTTP Only

Never expose secrets.

---

## Images

Compress automatically.

Generate thumbnail.

Support WebP.

Lazy Load.

---

## Maps

Use OpenStreetMap.

Never require Google Maps API.

Support

- Marker
- Routing
- Reverse Geocoding
- Distance Calculation

---

## Chat

Realtime

Socket.IO

Support

Typing

Seen

Unread Count

Reconnect

Offline Queue

---

## AI

AI must never expose API Keys.

Use timeout.

Retry once.

Save logs.

Limit usage.

---

## Logging

Log

- Login
- Register
- Product CRUD
- Checkout
- Payment
- AI
- Admin

---

## Testing

Generate

Unit Tests

Integration Tests

Playwright E2E

Coverage

>= 80%

---

## Performance

Lighthouse

Performance >=95

SEO >=95

Accessibility >=95

Best Practice >=95

---

## Deployment

The project must be deployable directly to

Vercel

with

External MySQL

Prisma

Cloudflare R2

without any code modification.

---

## Final Instruction

Do not stop after generating folder structure.

Generate the ENTIRE application including

- Database
- Prisma Schema
- APIs
- Components
- Pages
- Dashboard
- Authentication
- Authorization
- Chat
- AI
- OpenStreetMap
- Farmer Module
- Buyer Module
- Admin Module
- Notifications
- Reviews
- Search
- Checkout
- Production Deployment

If output exceeds context length, continue automatically until every file is completely generated.

# 68. UI / UX Specification

FarmConnect ใช้แนวทางการออกแบบ

Modern

Minimal

Clean

Easy to Use

Mobile First

Responsive

Accessible

---

## Theme

Primary

Green

Secondary

White

Accent

Orange

Success

Green

Danger

Red

Warning

Yellow

Info

Blue

---

## Border Radius

12px

Cards

16px

Buttons

12px

Inputs

12px

---

## Shadow

Soft Shadow

Hover Shadow

Glass Effect (Optional)

---

## Font

Primary

Noto Sans Thai

Fallback

Inter

Roboto

sans-serif

---

## Icons

Lucide React

---

# 69. Navigation

Desktop

Top Navbar

Sidebar (Dashboard)

Footer

---

Mobile

Bottom Navigation

Floating Cart Button

Hamburger Menu

---

Navbar

Logo

Search

Categories

Notification

Chat

Wishlist

Cart

Profile

---

# 70. Home Page

Hero Banner

↓

Search Bar

↓

Categories

↓

Recommended Products

↓

Nearby Farms

↓

Popular Farms

↓

Seasonal Products

↓

โปรโมชั่น

↓

Top Reviews

↓

Footer

---

Hero Section

- Search
- AI Search
- Banner Slider
- Popular Keywords

---

Categories

Grid Layout

Icon

Image

Name

---

Product Card

Image

Farm Name

Price

Rating

Distance

Pickup Badge

Delivery Badge

Wishlist

Quick View

---

Farm Card

Cover

Farm Logo

Farm Name

Province

Rating

Followers

Distance

Open / Closed

---

# 71. Product Detail

Gallery

↓

Product Info

↓

Farm Information

↓

Map

↓

Reviews

↓

Related Products

---

Product Section

Images

Price

Stock

Description

AI Summary

Delivery

Pickup

Quantity

Buy Now

Add to Cart

Chat Farmer

Favorite

Share

---

Farm Section

Farm Cover

Farm Name

Rating

Followers

Address

Opening Hours

Button

View Farm

Navigate

Chat

---

Map

OpenStreetMap

Marker

Distance

Estimated Travel Time

Navigate Button

---

# 72. Farm Page

Farm Cover

Farm Logo

Farm Description

Map

Products

Reviews

Followers

Gallery

Contact

Opening Hours

Chat

Follow

Navigate

---

# 73. Search Page

Search Bar

Filters

Sorting

Map View

Grid View

List View

---

Filters

Category

Province

Price

Distance

Pickup

Delivery

Rating

Organic

---

Sort

Newest

Popular

Price

Distance

Rating

AI Recommended

---

# 74. Cart Page

Cart Items

Coupon

Shipping

Pickup

Summary

Checkout

---

# 75. Checkout

Address

↓

Delivery Method

↓

Payment

↓

Summary

↓

Confirm

---

Delivery

Home Delivery

Pickup at Farm

---

Pickup

Calendar

Time Picker

QR Preview

---

# 76. Chat Page

Conversation List

↓

Messages

↓

Input

---

Support

Image

Location

Emoji

Typing

Seen

Unread

Search

---

# 77. Buyer Dashboard

Overview

Recent Orders

Wishlist

Notifications

Reviews

Followed Farms

Addresses

Settings

---

# 78. Farmer Dashboard

Statistics

Sales

Revenue

Orders

Inventory

Reviews

Followers

Messages

Notifications

Farm Profile

Analytics

---

Quick Actions

Add Product

Manage Farm

View Orders

Reply Chat

AI Product Description

---

# 79. Admin Dashboard

Overview

Users

Farms

Products

Orders

Reports

Analytics

AI Logs

System Settings

Announcements

---

Admin Charts

Revenue

Orders

Users

Products

Top Farms

Top Products

Traffic

Daily Active Users

---

# 80. Responsive Design

Mobile

≤768px

Tablet

769-1024px

Desktop

>1024px

---

ทุกหน้า

Responsive

Touch Friendly

Keyboard Accessible

Screen Reader Friendly

Dark Mode Ready

---

# 81. Accessibility

WCAG 2.1 AA

Keyboard Navigation

Alt Text

ARIA Labels

High Contrast

Focus Indicators

Reduced Motion Support

---

# 82. PWA

Installable

Offline Support

Push Notification

Background Sync

Splash Screen

App Icon

Offline Cache

---

# 83. SEO

Metadata

Open Graph

Twitter Card

Structured Data

Sitemap

robots.txt

Canonical URL

Dynamic Metadata

# 84. Smart Farmer Dashboard

Dashboard ต้องแสดงข้อมูลแบบ Real-time

## Sales

- รายได้วันนี้
- รายได้สัปดาห์นี้
- รายได้เดือนนี้
- รายได้ปีนี้
- รายได้ทั้งหมด

แสดงเป็น

- Line Chart
- Bar Chart

---

## Orders

- รอชำระเงิน
- รอยืนยัน
- กำลังเตรียมสินค้า
- กำลังจัดส่ง
- รอนัดรับ
- เสร็จสิ้น
- ยกเลิก

---

## Products

- จำนวนสินค้าทั้งหมด
- สินค้าหมด
- สินค้าใกล้หมด
- สินค้าขายดี
- สินค้าขายไม่ออก

---

## Analytics

แสดง

จำนวนผู้เข้าชม

จำนวนคลิก

CTR

Conversion Rate

Average Order Value

Returning Customer

New Customer

---

## Farm Analytics

- จำนวนผู้ติดตาม
- จำนวนคนดูสวน
- จำนวนคนกดนำทาง
- จำนวนคนกดแชท
- จำนวนคนกดรับที่สวน

---

## Revenue Prediction

AI วิเคราะห์

คาดการณ์ยอดขาย

7 วัน

30 วัน

90 วัน

---

## AI Suggestion

ระบบแนะนำ

- ควรเพิ่มสินค้าอะไร
- ควรลดราคาไหม
- ควรเพิ่ม Stock หรือไม่
- เวลาที่ควรลงสินค้า

---

# 85. Nearby Farm System

ใช้ Browser GPS

และ

OpenStreetMap

ผู้ซื้อสามารถค้นหา

สวนใกล้ฉัน

ภายใน

1 km

3 km

5 km

10 km

25 km

50 km

100 km

---

Map View

Cluster Marker

Farm Marker

Current Location

Radius Circle

---

Filter

เปิดอยู่

รับที่สวน

ส่งถึงบ้าน

Organic

GAP

คะแนน

สินค้า

จังหวัด

ราคา

---

Sorting

ระยะทาง

คะแนน

ยอดขาย

สินค้าใหม่

---

Route

OpenRouteService

คำนวณ

- ระยะทาง
- เวลาเดินทาง
- เส้นทาง

---

# 86. Weather System

ข้อมูลอากาศอ้างอิงจากพิกัดสวน

API

Open-Meteo

หรือ

Tomorrow.io

---

แสดง

อุณหภูมิ

ความชื้น

ความเร็วลม

ปริมาณฝน

เมฆ

UV

AQI (Future)

---

Forecast

วันนี้

3 วัน

7 วัน

14 วัน

---

Weather Alert

แจ้งเตือนเกษตรกร

- ฝนตกหนัก
- พายุ
- ลมแรง
- อากาศร้อนจัด

---

Buyer View

ผู้ซื้อเห็น

สภาพอากาศที่สวน

เพื่อช่วยตัดสินใจ

การเดินทาง

---

# 87. Harvest Calendar

เกษตรกรสามารถกำหนด

ฤดูกาลเก็บเกี่ยว

Harvest Start

Harvest End

Expected Quantity

Expected Price

---

Buyer

เห็น

กำลังเก็บเกี่ยว

ใกล้หมดฤดูกาล

Pre-order ได้

---

# 88. Farm Certificate

รองรับ

GAP

Organic Thailand

Organic EU

Organic USDA

GI

OTOP

---

แสดง

Certificate

เลขที่ใบรับรอง

วันหมดอายุ

รูปใบรับรอง

Verified Badge

---

# 89. Smart Notification

AI แจ้งเตือน

สินค้าใกล้หมด

ฝนกำลังตก

ออเดอร์ค้าง

ลูกค้าทักแชท

รีวิวใหม่

มีผู้ติดตามใหม่

ยอดขายเพิ่ม

สินค้าใกล้หมดอายุ

---

# 90. Farm Activity Feed

แสดงกิจกรรมของสวน

- เพิ่มสินค้าใหม่
- อัปโหลดรูปใหม่
- เก็บเกี่ยวแล้ว
- เปิดสวน
- ปิดสวน
- จัดโปรโมชัน
- ไลฟ์สด (Future)

ผู้ติดตามเห็นในหน้า Feed

---

# 91. Farm Story

เกษตรกรสามารถโพสต์

- รูป
- วิดีโอ
- ข่าวสาร
- ขั้นตอนการปลูก
- การเก็บเกี่ยว

คล้าย Social Feed

---

# 92. Seasonal Recommendation

AI วิเคราะห์

ฤดูกาล

สภาพอากาศ

จังหวัด

ยอดขาย

แล้วแนะนำ

- สินค้าที่ควรปลูก
- สินค้าที่กำลังขายดี
- ราคาตลาดโดยประมาณ

---

# 93. Carbon Footprint

คำนวณระยะทาง

สวน → ลูกค้า

แสดง

Carbon Emission โดยประมาณ

ส่งเสริมการซื้อสินค้าจากสวนใกล้บ้าน

---

# 94. Farm Visit Booking

ผู้ซื้อสามารถ

จองเข้าชมสวน

เลือก

วันที่

เวลา

จำนวนคน

วัตถุประสงค์

---

เกษตรกร

กดยืนยัน

หรือปฏิเสธ

---

# 95. Community Marketplace

เกษตรกรหลายราย

สามารถรวมกลุ่ม

เป็น

Community

Cooperative

วิสาหกิจชุมชน

มีหน้าโปรไฟล์กลาง

รวมสินค้า

รวมรีวิว

รวมแผนที่

---

# 96. Live Market Price

ดึงข้อมูล

ราคาตลาดกลาง

แสดงเปรียบเทียบ

ราคาที่สวน

ราคาตลาด

ส่วนต่าง

แนวโน้มราคา

กราฟย้อนหลัง

---

# 97. Smart Inventory

AI วิเคราะห์

Stock

ยอดขาย

ฤดูกาล

เพื่อคาดการณ์

ควรผลิตเพิ่ม

หรือ

ลดการผลิต

พร้อมแจ้งเตือนล่วงหน้า