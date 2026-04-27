# DentalCare System - Local Development Setup Guide

> **🆕 Complete Beginner?** If you're setting up on a fresh PC with nothing installed, use **[FIRST_TIME_SETUP.md](FIRST_TIME_SETUP.md)** - it covers installing Python, Node.js, and PostgreSQL from scratch with detailed instructions.

This guide is for users who already have Python, Node.js, and PostgreSQL installed.

---

## Prerequisites

Before running this project locally, ensure you have the following installed:

- **Python 3.13.5** (or compatible version)
- **Node.js 22.17.0** (or compatible version)
- **PostgreSQL** (latest stable version recommended)
- **Git** (for version control)

## Step-by-Step Setup Instructions

### 1. PostgreSQL Database Setup

#### Install PostgreSQL
1. Download PostgreSQL from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Run the installer and remember the password you set for the `postgres` user
3. Default port is usually `5432` - keep this unless you have conflicts

#### Create Database
Open **pgAdmin** or **psql** command line and run:

```sql
CREATE DATABASE dentalcare;
```

Or using psql command line:
```bash
psql -U postgres
CREATE DATABASE dentalcare;
\q
```

### 2. Configure Environment Variables

1. Open the `.env` file in the project root
2. Update the `DATABASE_URL` with your PostgreSQL credentials:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5432/dentalcare
```

**Fill in:**
- `YOUR_USERNAME`: Your PostgreSQL username (e.g., `postgres`, `ovesh`, etc.)
- `YOUR_PASSWORD`: Your PostgreSQL password
- Keep the host as `127.0.0.1` (or use `localhost`)
- Database name should remain `dentalcare`

**If your password contains special characters**, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `:` → `%3A`
- `%` → `%25`

Example: `DATABASE_URL=postgresql://myuser:pass%40word@127.0.0.1:5432/dentalcare`

**To find your PostgreSQL username and verify connection:**
```bash
psql -U your_username -d postgres -h 127.0.0.1
```

**Important:** Change `SESSION_SECRET` to a random string for production use.

### 3. Install Python Dependencies

Open PowerShell in the project directory and run:

```powershell
# If using conda (recommended)
conda activate base  # or your preferred environment

# Install Python dependencies
pip install -r requirements.txt
```

**Note:** If you encounter issues with `psycopg2-binary`, you might need to install Visual C++ Build Tools.

### 4. Install Node.js Dependencies

Still in PowerShell, run:

```powershell
npm install
```

This will install all frontend and backend Node.js dependencies.

### 5. Initialize Database

The startup script will handle this automatically, but if you need to run it manually:

```powershell
cd backend
python manage.py migrate --run-syncdb
python manage.py initdb
cd ..
```

This will:
- Create the Django session table
- Create all required database tables
- Seed demo data with users, doctors, appointments, etc.

### 6. Start the Application

Run the PowerShell startup script:

```powershell
.\start-local.ps1
```

This will:
1. Load environment variables from `.env`
2. Run database migrations
3. Initialize/seed the database
4. Start Django API server on port 8000
5. Start Express + Vite frontend on port 5000

### 7. Access the Application

Open your browser and navigate to:
- **Frontend:** [http://localhost:5000](http://localhost:5000)
- **Backend API:** [http://localhost:8000/api](http://localhost:8000/api)

## Demo Login Credentials

See `credentials.txt` for all demo accounts. Quick reference:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentalcare.com | admin123 |
| Patient | sarah.johnson@email.com | patient123 |
| Doctor | dr.emily.davis@dentalcare.com | doctor123 |

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
If port 5000 or 8000 is already in use:
- Find the process using the port: `netstat -ano | findstr :5000`
- Kill it: `taskkill /PID <PID> /F`
- Or change the port in `.env` file

#### 2. PostgreSQL Connection Error
- Verify PostgreSQL is running (check Windows Services)
- Verify database exists: `psql -U postgres -l`
- Check credentials in `.env` file
- Ensure PostgreSQL is listening on localhost:5432

#### 3. Python Module Not Found
- Ensure you're in the correct conda/virtual environment
- Run `pip install -r requirements.txt` again
- Check Python version: `python --version`

#### 4. npm Install Fails
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

#### 5. Django Migration Errors
```powershell
cd backend
python manage.py migrate --run-syncdb
python manage.py initdb --force  # Force recreate tables
cd ..
```

### Fallback to SQLite (If PostgreSQL Issues)

If you can't get PostgreSQL working, you can use SQLite temporarily:

1. In `.env`, comment out or remove the `DATABASE_URL` line:
```env
# DATABASE_URL=postgresql://postgres:password@localhost:5432/dentalcare
```

2. Django will automatically use SQLite (file: `backend/db.sqlite3`)

**Note:** SQLite is only for development/testing, not recommended for production.

## Development Workflow

### Running in Development Mode

```powershell
# Start everything
.\start-local.ps1

# Or run separately:
# Terminal 1 - Django
cd backend
python manage.py runserver 0.0.0.0:8000

# Terminal 2 - Express + Vite
npm run dev
```

### Making Database Changes

If you modify models in `backend/api/models.py`:

```powershell
cd backend
python manage.py initdb  # This will recreate tables
cd ..
```

**Note:** This app uses `managed=False` models, so normal Django migrations won't work. The `initdb` command handles table creation.

### Resetting Database

To completely reset the database:

```powershell
# PostgreSQL
psql -U postgres
DROP DATABASE dentalcare;
CREATE DATABASE dentalcare;
\q

# Then run
cd backend
python manage.py migrate --run-syncdb
python manage.py initdb
cd ..
```

## Project Structure

```
.
├── backend/              # Django backend
│   ├── manage.py
│   ├── api/             # API endpoints, models, views
│   └── dental_care/     # Django settings
├── client/              # React frontend
│   └── src/
├── server/              # Express proxy server
├── .env                 # Environment configuration
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies
└── start-local.ps1      # Windows startup script
```

## Additional Commands

### Run Tests (if implemented)
```powershell
cd backend
python manage.py test
cd ..
```

### Build for Production
```powershell
npm run build
```

### Check TypeScript Errors
```powershell
npm run check
```

## Support

For issues specific to:
- **Django/Python:** Check `backend/api/views.py` and Django logs
- **Frontend/React:** Check browser console and `client/src/`
- **Database:** Check PostgreSQL logs in pgAdmin

## Next Steps

1. Review the codebase structure
2. Check out the API documentation in `README.md`
3. Explore the admin panel at the `/admin` route
4. Start building your features!

---

**Happy Coding! 🦷**
