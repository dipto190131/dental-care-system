# DentalCare Appointment System

A comprehensive dental appointment management system connecting patients with dentists through an online platform.

> **📚 Not sure which guide to use?** Check **[DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)** to find the right setup guide for your situation!

## Features

### 🏥 Multi-Role System
- **Patients** - Browse doctors, book appointments, manage medical records
- **Doctors** - Manage availability, appointments, and patient records
- **Administrators** - Oversee platform operations, verify doctors, manage payouts

### 💳 Credit System
- Patients purchase credit packages (5/10/20/50 credits)
- Credits are used to book appointments
- Automatic refunds for canceled appointments

### 📅 Appointment Management
- Real-time availability slots
- Booking confirmations
- Appointment status tracking
- Medical record integration

### 🔐 Security & Authentication
- Session-based authentication
- Role-based access control
- Secure password hashing with bcrypt

### 💰 Payout System
- Doctors track earnings from appointments
- Request payouts with flexible amounts
- Admin approval workflow

### 🔔 Notifications
- In-app notification system
- Real-time updates for appointments, payouts, and verifications

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn UI** component library
- **TanStack Query** for data fetching
- **Wouter** for routing

### Backend
- **Django** (Python) REST API
- Session-based authentication
- Django ORM for database operations

### Database
- **PostgreSQL** - Production-grade relational database

### Architecture
- **Express.js** proxy server
- Routes `/api/*` requests to Django backend
- Serves frontend through Vite dev server
- Single-port deployment (5000)

## Getting Started

### 🆕 First Time User? Start Here!

If you're setting up this project on a **fresh PC with nothing installed**, we have a complete guide for you:

👉 **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - Beginner-friendly guide that covers:
- Installing Python, Node.js, and PostgreSQL from scratch
- Step-by-step instructions with screenshots descriptions
- Troubleshooting common issues
- **Perfect for beginners!**

### Already Have Prerequisites Installed?

If you already have Python, Node.js, and PostgreSQL:

👉 **[QUICKSTART.md](QUICKSTART.md)** - Fast setup (5 minutes)  
👉 **[README-LOCAL-SETUP.md](README-LOCAL-SETUP.md)** - Detailed setup guide

---

### Prerequisites
- Python 3.13+ (with pip)
- Node.js 22+ (with npm)
- PostgreSQL

### Quick Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Dental-Care-System
```

2. **Create database**
```sql
CREATE DATABASE dentalcare;
```

3. **Configure environment**
   
Copy `.env.example` to `.env` and update with your PostgreSQL credentials:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/dentalcare
```

4. **Install dependencies**
```powershell
.\setup.ps1
```

5. **Run the application**
```powershell
.\start-local.ps1
```

6. **Access the application**
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000/api

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentalcare.com | admin123 |
| Patient | sarah.johnson@email.com | patient123 |
| Doctor (Verified) | dr.emily.davis@dentalcare.com | doctor123 |
| Doctor (Pending) | dr.robert.nguyen@dentalcare.com | doctor123 |

See `credentials.txt` for complete list of demo accounts.

## Project Structure

```
├── backend/                 # Django backend
│   ├── api/                # API endpoints, models, views
│   │   ├── models.py       # Database models
│   │   ├── views.py        # API endpoints
│   │   └── urls.py         # URL routing
│   ├── dental_care/        # Django settings
│   └── manage.py           # Django management
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Page components
│       ├── components/     # Reusable components
│       ├── contexts/       # React contexts
│       └── hooks/          # Custom hooks
├── server/                 # Express proxy server
│   ├── index.ts            # Server entry point
│   └── routes.ts           # Proxy configuration
├── shared/                 # Shared TypeScript schemas
└── .env                    # Environment configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Doctors
- `GET /api/doctors` - List all verified doctors
- `GET /api/doctors/:id` - Get doctor profile with availability
- `GET/PUT /api/doctor/profile` - Manage own profile
- `GET/POST /api/doctor/slots` - Manage availability slots
- `DELETE /api/doctor/slots/:id` - Remove slot

### Appointments
- `GET /api/patient/appointments` - Patient's appointments
- `POST /api/patient/appointments/book` - Book appointment
- `POST /api/patient/appointments/:id/cancel` - Cancel appointment
- `GET /api/doctor/appointments` - Doctor's appointments

### Medical Records
- `GET /api/patient/medical-records` - Patient's medical records
- `GET/POST /api/doctor/medical-records` - Manage medical records

### Credits & Payouts
- `GET /api/patient/credits` - View credits and transactions
- `POST /api/patient/credits/purchase` - Purchase credits
- `GET/POST /api/doctor/payouts` - Request payouts

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - All users
- `GET /api/admin/doctors` - All doctors
- `PUT /api/admin/doctors/:id/verify` - Verify doctor
- `GET /api/admin/appointments` - All appointments
- `GET/PUT /api/admin/payouts` - Manage payouts

### Notifications
- `GET /api/notifications` - User notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

## Database Schema

### Users
```sql
- id, email, password_hash, full_name, phone, role
- date_of_birth, gender, address, credits, created_at
```

### Doctor Profiles
```sql
- id, user_id, specialty, license_number, experience_years
- consultation_fee, bio, verification_status, verification_date
- verified_by_id, earnings, created_at
```

### Appointments
```sql
- id, patient_id, doctor_id, slot_id, appointment_date
- start_time, end_time, status, credits_used, notes, created_at
```

### Medical Records
```sql
- id, appointment_id, patient_id, doctor_id, diagnosis
- treatment, prescription, notes, created_at
```

## Development

### Running Backend Only
```powershell
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Running Frontend Only
```powershell
npm run dev
```

### Database Reset
```powershell
cd backend
python manage.py initdb
cd ..
```

### Build for Production
```powershell
npm run build
```

## Credit Packages

| Package | Credits | Price |
|---------|---------|-------|
| Starter | 5 | $25 |
| Basic | 10 | $45 |
| Standard | 20 | $85 |
| Premium | 50 | $200 |

## Troubleshooting

See [QUICKSTART.md](QUICKSTART.md) for quick fixes and [README-LOCAL-SETUP.md](README-LOCAL-SETUP.md) for detailed troubleshooting.

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ for better dental care management
