# 🏥 Subhan Care - Hospital Management System

A full-stack **Hospital Management System** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js).

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-19-blue)
![Node](https://img.shields.io/badge/Node.js-20+-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-orange)

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Doctor, Receptionist, Billing, Staff, Patient)
- Forgot password with 6-digit email verification code
- Rate limiting & input validation
- bcrypt password hashing
- Helmet security headers
- CNIC-based 3-step login

### 👥 Patient Management
- Register patients with CNIC auto-formatter (XXXXX-XXXXXXX-X)
- Allergy severity color coding (Critical/Moderate/Mild)
- Search & filter patients
- Pagination support
- Medical history tracking

### 👨‍⚕️ Doctor Management
- Add/remove doctors with specialties
- Consultation fee management
- Doctor-patient assignment view
- Availability scheduling
- Performance tracking

### 📅 Appointment System
- Book appointments with 15-minute slot conflict prevention
- Real-time available slot picker
- Reschedule & cancel appointments
- No-Show tracking
- Doctor calendar integration

### 💊 Prescriptions
- Create & manage prescriptions
- Inventory-connected medicine dropdown
- Stock status indicators (In Stock/Low Stock/Out of Stock)
- Duplicate medicine prevention
- Print prescription with hospital letterhead
- WhatsApp share
- Refill management

### 🧪 Lab & Diagnostics
- Lab test ordering & tracking
- Categories: Blood, Urine, Radiology, Pathology
- Result entry & status management
- Lab-specific doctor assignments
- Pending/Completed/Cancelled tracking

### 💰 Billing & Invoices
- Create itemized invoices
- Mark invoices as paid
- Revenue tracking
- Payment history
- Stripe/JazzCash/EasyPaisa integration
- Auto invoice generation

### 💊 Pharmacy & Inventory
- Medicine management with batch tracking
- Smart stock merging (same medicine + batch = auto merge)
- Low stock alerts
- Auto stock deduction on prescription
- Category management
- Expiry date tracking

### 👔 Staff & HR Management
- Staff profiles with roles, departments & shifts
- Salary tracking
- Auto login account creation
- Morning/Evening/Night shift management
- RBAC-protected (Admin only)

### 📊 Reports & Analytics
- Revenue analytics with charts
- Patient statistics
- Doctor performance metrics
- Appointment reports
- Pharmacy reports
- CSV & PDF export

### 🌐 Health Library (Public)
- Patient guides
- Doctor articles
- Health tips
- BMI Calculator
- BMR Calculator
- No login required

### ⚙️ Settings & More
- Hospital profile management
- SMTP email configuration
- SMS provider settings (Twilio)
- Dark/Light theme toggle
- English/Urdu language toggle
- Advanced search with filters
- Data backup & restore
- Real-time notifications (Socket.io)

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
| State Management | Zustand |
| UI Icons | Lucide React |
| Charts | Recharts |
| Notifications | React Hot Toast |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Security | Helmet + Rate Limiting + CORS |

---

## 📁 Project Structure

```
Subhan-Care-Hospital/
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── models/
│   │   ├── User.js
│   │   ├── Patient.js
│   │   ├── Doctor.js
│   │   ├── Appointment.js
│   │   ├── Invoice.js
│   │   ├── Medicine.js
│   │   ├── Prescription.js
│   │   ├── Staff.js
│   │   └── LabTest.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── patients.js
│   │   ├── doctors.js
│   │   ├── appointments.js
│   │   ├── invoices.js
│   │   ├── inventory.js
│   │   ├── prescriptions.js
│   │   ├── staff.js
│   │   ├── lab.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── Dockerfile
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── stores/
│   │   └── pages/
│   │       ├── Dashboard.jsx
│   │       ├── Patients.jsx
│   │       ├── Doctors.jsx
│   │       ├── Appointments.jsx
│   │       ├── Prescriptions.jsx
│   │       ├── Billing.jsx
│   │       ├── Inventory.jsx
│   │       ├── Lab.jsx
│   │       ├── Staff.jsx
│   │       ├── Reports.jsx
│   │       ├── SettingsPage.jsx
│   │       └── HealthLibrary.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB (Atlas or Local)
- npm or yarn
- Docker (optional)

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/hoorainnasir83/Subhan-Care-Hospital.git
cd Subhan-Care-Hospital
```

#### 2. Backend Setup
```bash
cd backend
npm install
```

#### 3. Configure Environment Variables
Create `backend/.env`:
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/subhancare
JWT_SECRET=your_super_secret_key_here
PORT=5000
NODE_ENV=development
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
STRIPE_SECRET_KEY=your_stripe_secret_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

#### 4. Seed Database
```bash
npm run seed
```

#### 5. Start Backend
```bash
npm start
```
Backend: `http://localhost:5000`

#### 6. Frontend Setup
```bash
cd ../frontend
npm install --legacy-peer-deps
```

#### 7. Configure Frontend Environment
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 8. Start Frontend
```bash
npm run dev
```
Frontend: `http://localhost:5173`

---

## 🐳 Docker Setup

```bash
docker-compose up --build
```

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@subhancare.com | admin123 |
| Doctor | doctor@subhancare.com | doctor123 |
| Patient | patient@subhancare.com | patient123 |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/forgot-password | Send OTP |
| GET | /api/patients | Get patients |
| POST | /api/patients | Add patient |
| GET | /api/doctors | Get doctors |
| GET | /api/appointments | Get appointments |
| POST | /api/appointments | Book appointment |
| GET | /api/inventory | Get medicines |
| POST | /api/prescriptions | Create prescription |
| GET | /api/lab | Get lab tests |
| GET | /api/staff | Get staff |
| GET | /api/reports/dashboard | Dashboard stats |
| POST | /api/payments/create-session | Stripe payment |

---

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ bcrypt Password Hashing
- ✅ Rate Limiting
- ✅ Input Validation
- ✅ Helmet Security Headers
- ✅ CORS Protection
- ✅ RBAC
- ✅ XSS Protection

---

## 🌐 Deployment

### Backend (Render/Railway)
```bash
npm install
npm start
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Output: dist/
```

---

## 👩‍💻 Developer

**Hoorainnasr83**
- GitHub: [@hoorainnasir83](https://github.com/hoorainnasir83)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file.

---

*Built with ❤️ using React, Node.js & MongoDB*
