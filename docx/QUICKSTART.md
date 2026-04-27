# 🚀 Quick Start Guide - Local Development

> **🆕 First Time User?** If you don't have Python, Node.js, or PostgreSQL installed yet, use the **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** guide instead. This Quick Start assumes you already have the prerequisites installed.

## Prerequisites
- ✅ Python 3.13.5
- ✅ Node.js 22.17.0  
- ✅ PostgreSQL (installed and running)
- ✅ Windows 11

## Setup (First Time Only)

### 1. Install PostgreSQL
Download from: https://www.postgresql.org/download/windows/

### 2. Create Database
```sql
CREATE DATABASE dentalcare;
```

### 3. Configure Environment
Edit `.env` file and update your PostgreSQL password:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/dentalcare
```

### 4. Install Dependencies
```powershell
.\setup.ps1
```

## Running the Application

```powershell
.\start-local.ps1
```

**Access the app:**
- Frontend: http://localhost:5000
- Backend API: http://localhost:8000/api

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentalcare.com | admin123 |
| Patient | sarah.johnson@email.com | patient123 |
| Doctor | dr.emily.davis@dentalcare.com | doctor123 |

See `credentials.txt` for all demo accounts.

## Troubleshooting

**Port already in use:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000
# Kill it (replace PID with actual number)
taskkill /PID <PID> /F
```

**PostgreSQL connection error:**
- Verify PostgreSQL service is running (check Windows Services)
- Check database exists: `psql -U postgres -l`
- Verify credentials in `.env` file

**Module not found:**
```powershell
# Python modules
pip install -r requirements.txt

# Node modules
npm install
```

**Database reset:**
```powershell
cd backend
python manage.py initdb
cd ..
```

## Need More Help?

See `README-LOCAL-SETUP.md` for detailed instructions.

---

**Happy Coding! 🦷**
