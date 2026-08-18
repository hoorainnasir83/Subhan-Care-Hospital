# 🏥 Subhan Care - Hospital Management System

A full-stack **Hospital Management System** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange)

---

## ✨ All Modules

| Module | Features |
|--------|---------|
| 🔐 Authentication | JWT, RBAC, CNIC Login, Forgot Password OTP |
| 👥 Patients | CNIC formatter, Allergy badges, Medical history |
| 👨‍⚕️ Doctors | Specialties, Availability, Performance tracking |
| 📅 Appointments | 15-min slots, Conflict prevention, Reschedule |
| 💊 Prescriptions | Inventory dropdown, Print letterhead, WhatsApp share |
| 🧪 Lab & Diagnostics | Test ordering, Results, Lab doctors |
| 💰 Billing | Invoices, Stripe/JazzCash/EasyPaisa payments |
| 💊 Pharmacy | Batch tracking, Smart merging, Low stock alerts |
| 👔 Staff & HR | Roles, Shifts, Salary, Auto login creation |
| 📊 Reports | Revenue charts, PDF/CSV export, Analytics |
| 🌐 Health Library | BMI/BMR Calculator, Articles, Public access |
| 🏥 Medical Records | Patient timeline, Vitals, Print history |
| 🔔 Notifications | Real-time Socket.io alerts, Bell icon |
| 📋 Audit Logs | User action tracking, Admin view |
| ⭐ Feedback | 5-star rating, Doctor performance |
| 👤 Patient Portal | Own dashboard, appointments, records |
| 👨‍⚕️ Doctor Portal | Patient list, Write prescriptions |
| 📖 Swagger Docs | /api/docs - All endpoints documented |
| ✅ Jest Tests | Unit & integration testing |
| ⚙️ Settings | SMTP, SMS, Backup, Dark/Light theme |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS v3 |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Email | NodeMailer (Gmail SMTP) |
| SMS | Twilio |
| Payments | Stripe + JazzCash + EasyPaisa |
| Real-time | Socket.io |
| State | Zustand |
| Charts | Recharts |
| Container | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Security | Helmet + Rate Limiting + CORS |
| Testing | Jest + Supertest |
| API Docs | Swagger UI |

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm start
```

### Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Docker
```bash
docker-compose up --build
```

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@subhancare.com | admin123 |
| Doctor | doctor@subhancare.com | doctor123 |
| Patient | patient@subhancare.com | patient123 |

---

## ⚙️ Environment Variables

Create `backend/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/subhancare
JWT_SECRET=your_secret_key
PORT=5000
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
STRIPE_SECRET_KEY=your_stripe_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_phone
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🌐 Deployment

### Backend → Render/Railway
### Frontend → Vercel/Netlify

---

## 🔒 Security

- ✅ JWT Authentication
- ✅ bcrypt Password Hashing
- ✅ Rate Limiting
- ✅ Helmet Headers
- ✅ CORS Protection
- ✅ RBAC
- ✅ XSS Protection
- ✅ Input Validation

---

## 👩‍💻 Developer

**Hoorainnasr83**
- GitHub: [@hoorainnasir83](https://github.com/hoorainnasir83)

---

## 📝 License

MIT License

---

*Built with ❤️ using React, Node.js & MongoDB*
