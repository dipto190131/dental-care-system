# 🚀 First Time Setup Guide - Complete Installation from Scratch

This guide is for users who are setting up this project on a **completely fresh PC** with nothing installed. We'll walk through every step from installing prerequisites to running the application.

**Time Required:** 45-60 minutes  
**Operating System:** Windows 11 (adaptable for Windows 10)  
**Skill Level:** Beginner-friendly

---

## Table of Contents
1. [Install Python](#step-1-install-python)
2. [Install Node.js](#step-2-install-nodejs)
3. [Install PostgreSQL](#step-3-install-postgresql)
4. [Get the Project Files](#step-4-get-the-project-files)
5. [Setup Database](#step-5-setup-database)
6. [Configure Environment](#step-6-configure-environment)
7. [Install Project Dependencies](#step-7-install-project-dependencies)
8. [Run the Application](#step-8-run-the-application)
9. [Verify Installation](#step-9-verify-installation)
10. [Troubleshooting](#troubleshooting)

---

## Step 1: Install Python

Python is required for the Django backend.

### 1.1 Download Python

1. Go to **https://www.python.org/downloads/**
2. Click the big yellow **"Download Python 3.13.x"** button
3. Save the installer to your Downloads folder

### 1.2 Install Python

1. **Run the installer** (double-click the downloaded file)
2. ⚠️ **IMPORTANT:** Check the box **"Add Python to PATH"** at the bottom
3. Click **"Install Now"**
4. Wait for installation to complete (2-3 minutes)
5. Click **"Close"** when done

### 1.3 Verify Python Installation

1. Press `Win + R` to open Run dialog
2. Type `cmd` and press Enter
3. In the command prompt, type:
   ```bash
   python --version
   ```
4. You should see: `Python 3.13.x`
5. Also check pip (Python package manager):
   ```bash
   pip --version
   ```
6. You should see something like: `pip 24.x.x from ...`

✅ **If you see version numbers, Python is installed correctly!**

❌ **If you get "command not found":** Close and reopen the command prompt, or restart your PC.

---

## Step 2: Install Node.js

Node.js is required for the React frontend and Express proxy server.

### 2.1 Download Node.js

1. Go to **https://nodejs.org/**
2. Download the **LTS version** (recommended for most users)
3. Click the big green button that says something like **"22.x.x LTS"**

### 2.2 Install Node.js

1. **Run the installer** (double-click the downloaded .msi file)
2. Click **"Next"** through the setup wizard
3. Accept the license agreement
4. Keep default installation path
5. ✅ Make sure **"Add to PATH"** is checked
6. Click **"Install"**
7. Click **"Yes"** if prompted by User Account Control
8. Wait for installation (2-3 minutes)
9. Click **"Finish"**

### 2.3 Verify Node.js Installation

1. Open a **new** Command Prompt (Win + R, type `cmd`, Enter)
2. Type:
   ```bash
   node --version
   ```
3. You should see: `v22.x.x`
4. Also check npm (Node package manager):
   ```bash
   npm --version
   ```
5. You should see: `10.x.x`

✅ **If you see version numbers, Node.js is installed correctly!**

---

## Step 3: Install PostgreSQL

PostgreSQL is the database system used by this application.

### 3.1 Download PostgreSQL

1. Go to **https://www.postgresql.org/download/windows/**
2. Click **"Download the installer"**
3. You'll be redirected to EDB (official PostgreSQL installer)
4. Download **PostgreSQL 16.x** for Windows x86-64
5. Save the installer

### 3.2 Install PostgreSQL

1. **Run the installer** (double-click the downloaded file)
2. Click **"Next"** to start
3. **Installation Directory:** Keep default (`C:\Program Files\PostgreSQL\16`)
4. **Components:** Keep all selected (PostgreSQL Server, pgAdmin 4, Command Line Tools)
5. **Data Directory:** Keep default
6. **Password:** 
   - ⚠️ **IMPORTANT:** Choose a password you'll remember
   - Example: `postgres123` (for development only - use stronger passwords for production)
   - **Write this down!** You'll need it later
7. **Port:** Keep default `5432`
8. **Locale:** Keep default (probably "English, United States")
9. Click **"Next"** then **"Next"** again
10. Wait for installation (5-10 minutes)
11. **Uncheck** "Stack Builder" at the end (we don't need it)
12. Click **"Finish"**

### 3.3 Verify PostgreSQL Installation

1. Press `Win` key and search for **"pgAdmin 4"**
2. Open **pgAdmin 4** (it may take a minute to load)
3. It will ask for a **master password** - create one and remember it
4. In the left panel, expand **"Servers"** → **"PostgreSQL 16"**
5. Enter the password you set during installation
6. If you see the server connect successfully, PostgreSQL is working!

✅ **PostgreSQL is installed and running!**

---

## Step 4: Get the Project Files

You need to get the DentalCare project files onto your computer.

### Option A: If You Have the Files

1. If you received the project as a ZIP file:
   - Extract it to a location like `C:\Projects\Dental-Care-System`
   
2. If you received it on a USB drive:
   - Copy the entire folder to `C:\Projects\Dental-Care-System`

### Option B: If It's in a Git Repository

1. **Install Git first:**
   - Go to https://git-scm.com/download/win
   - Download and install with default settings
   
2. **Clone the repository:**
   - Open Command Prompt
   - Navigate to where you want the project:
     ```bash
     cd C:\Projects
     ```
   - Clone the repository:
     ```bash
     git clone <repository-url>
     cd Dental-Care-System
     ```

### 4.1 Open the Project Folder

1. Press `Win + R`
2. Type: `powershell`
3. Press Enter
4. Navigate to your project:
   ```powershell
   cd C:\Projects\Dental-Care-System
   ```
   (Replace with your actual path if different)

---

## Step 5: Setup Database

Now we'll create the database for the application.

### 5.1 Open PostgreSQL Command Line

1. Press `Win` key and search for **"SQL Shell (psql)"**
2. Open it
3. Press Enter 4 times to accept defaults:
   - Server: `localhost`
   - Database: `postgres`
   - Port: `5432`
   - Username: `postgres`
4. Enter your PostgreSQL password (the one you set during installation)

### 5.2 Create the Database

1. In the SQL Shell, type this command:
   ```sql
   CREATE DATABASE dentalcare;
   ```
2. Press Enter
3. You should see: `CREATE DATABASE`
4. Verify it was created:
   ```sql
   \l
   ```
5. You should see `dentalcare` in the list of databases
6. Type `\q` and press Enter to exit

✅ **Database created successfully!**

---

## Step 6: Configure Environment

We need to tell the application how to connect to your database.

### 6.1 Create .env File

1. Open the project folder in **File Explorer**
   - Navigate to `C:\Projects\Dental-Care-System`
   
2. You should see a file called **`.env.example`**

3. **Copy** `.env.example` and **rename the copy** to `.env`
   - Right-click `.env.example` → Copy
   - Right-click in folder → Paste
   - Rename the copy from `.env.example - Copy` to `.env`
   
4. ⚠️ **Note:** To see file extensions:
   - In File Explorer, click **"View"** tab
   - Check **"File name extensions"**

### 6.2 Edit .env File

1. Right-click `.env` → Open with → **Notepad** (or any text editor)

2. Find this line:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/dentalcare
   ```

3. Update it with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@127.0.0.1:5432/dentalcare
   ```
   
   - Replace `YOUR_USERNAME` with your PostgreSQL username (usually `postgres` if you used defaults)
   - Replace `YOUR_PASSWORD` with your PostgreSQL password
   
   **Example** - if your username is `postgres` and password is `postgres123`:
   ```env
   DATABASE_URL=postgresql://postgres:postgres123@127.0.0.1:5432/dentalcare
   ```

4. **If your password contains special characters** like `@`, `#`, or `:`, you need to URL-encode them:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `:` becomes `%3A`
   - `%` becomes `%25`
   
   **Example** - if password is `pass@word123`:
   ```env
   DATABASE_URL=postgresql://postgres:pass%40word123@127.0.0.1:5432/dentalcare
   ```

5. **Save the file** (Ctrl + S)

6. **Close the editor**

✅ **Environment configured!**

---

## Step 7: Install Project Dependencies

Now we'll install all the required packages for both Python and Node.js.

### 7.1 Open PowerShell in Project Folder

1. Open **File Explorer** to your project folder
2. Click in the **address bar** at the top
3. Type: `powershell`
4. Press Enter
5. A PowerShell window will open in that folder

### 7.2 Run Setup Script

We have an automated setup script that will install everything:

```powershell
.\setup.ps1
```

**Press Enter** and wait...

You'll see:
- ✓ Checking Python installation...
- ✓ Checking Node.js installation...
- ✓ Installing Python dependencies... (this takes 2-5 minutes)
- ✓ Installing Node.js dependencies... (this takes 5-10 minutes)
- ✓ Configuration check...

### 7.3 If You Get an Error About Execution Policy

If you see: `cannot be loaded because running scripts is disabled`

**Fix it:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
- Type `Y` and press Enter
- Then run `.\setup.ps1` again

### 7.4 Alternative: Manual Installation

If the setup script doesn't work, install manually:

**Install Python packages:**
```powershell
pip install -r requirements.txt
```

**Install Node.js packages:**
```powershell
npm install
```

✅ **All dependencies installed!**

---

## Step 8: Run the Application

Finally, let's start the application!

### 8.1 Start the Application

In the same PowerShell window (in your project folder):

```powershell
.\start-local.ps1
```

**What happens:**
1. Django migrations run (creates database tables)
2. Database seeded with demo data (users, doctors, appointments)
3. Django backend starts (port 8000)
4. Express + React frontend starts (port 5000)

### 8.2 Wait for Startup

You'll see lots of output. **Wait until you see:**

```
========================================
  Application Running!
  Frontend: http://localhost:5000
  Backend API: http://localhost:8000/api
========================================
```

This means everything is ready! (takes about 30-60 seconds)

⚠️ **Do NOT close the PowerShell window!** The application runs here.

---

## Step 9: Verify Installation

### 9.1 Open the Application

1. Open your **web browser** (Chrome, Edge, Firefox, etc.)
2. Go to: **http://localhost:5000**
3. You should see the **DentalCare** landing page!

### 9.2 Test Login

Try logging in with a demo account:

**Admin Account:**
- Email: `admin@dentalcare.com`
- Password: `admin123`

**Patient Account:**
- Email: `sarah.johnson@email.com`  
- Password: `patient123`

**Doctor Account:**
- Email: `dr.emily.davis@dentalcare.com`
- Password: `doctor123`

✅ **If you can log in, everything is working perfectly!**

### 9.3 Explore the Application

**As Admin:**
- View dashboard with statistics
- Manage users and doctors
- Approve doctor verifications
- Process payout requests

**As Patient:**
- Browse verified doctors
- Book appointments
- Purchase credits
- View medical records

**As Doctor:**
- Manage availability slots
- View appointments
- Create medical records
- Request payouts

---

## Stopping the Application

When you're done:

1. Go to the PowerShell window where the app is running
2. Press **Ctrl + C**
3. Wait a few seconds for servers to stop
4. Close the PowerShell window

---

## Starting the Application Again (Next Time)

Whenever you want to run the application again:

1. Open **PowerShell** in the project folder
2. Run:
   ```powershell
   .\start-local.ps1
   ```
3. Wait for it to start
4. Open browser to **http://localhost:5000**

**Note:** You do NOT need to run `setup.ps1` again - that's only for first-time setup!

---

## Troubleshooting

### Problem: "python is not recognized"

**Solution:**
1. Close PowerShell
2. Restart your PC
3. Try again
4. If still not working, reinstall Python and check "Add to PATH"

### Problem: "node is not recognized"

**Solution:**
1. Close PowerShell
2. Restart your PC
3. Try again
4. If still not working, reinstall Node.js

### Problem: "could not connect to database"

**Possible causes:**

1. **PostgreSQL not running:**
   - Press `Win + R`, type `services.msc`, Enter
   - Find "postgresql-x64-16" in the list
   - Right-click → Start

2. **Wrong password in .env:**
   - Check your `.env` file
   - Make sure password matches what you set during PostgreSQL installation

3. **Database doesn't exist:**
   - Open pgAdmin or SQL Shell
   - Run: `CREATE DATABASE dentalcare;`

### Problem: Port 5000 or 8000 already in use

**Solution:**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace XXXX with the PID from above)
taskkill /PID XXXX /F

# Do the same for port 8000 if needed
netstat -ano | findstr :8000
taskkill /PID XXXX /F
```

### Problem: "npm install" takes forever or fails

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules folder
Remove-Item -Recurse -Force node_modules

# Delete package-lock.json
Remove-Item package-lock.json

# Try installing again
npm install
```

### Problem: Python packages won't install

**Solution:**
```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Try requirements again
pip install -r requirements.txt
```

### Problem: Can't see .env file

**Solution:**
1. In File Explorer, click **View** tab
2. Check **"Hidden items"**
3. Check **"File name extensions"**
4. Files starting with `.` should now be visible

### Problem: Browser shows "Cannot connect" or blank page

**Checklist:**
- ✅ Is PowerShell still running? (Don't close it!)
- ✅ Do you see "Application Running!" message?
- ✅ Try refreshing the browser (F5)
- ✅ Try clearing browser cache (Ctrl + Shift + Delete)
- ✅ Try a different browser
- ✅ Make sure you're going to `http://localhost:5000` (not 8000)

### Still Having Issues?

1. **Check the PowerShell window** for error messages
2. **Read the error carefully** - it usually tells you what's wrong
3. **Google the error message** - many common issues have solutions online
4. **Check the detailed guides:**
   - [README-LOCAL-SETUP.md](README-LOCAL-SETUP.md) - More troubleshooting
   - [QUICKSTART.md](QUICKSTART.md) - Quick reference

---

## Database Reset (If Needed)

If you want to start fresh with clean demo data:

```powershell
cd backend
python manage.py initdb
cd ..
```

This will:
- Drop all tables
- Recreate them
- Re-seed with demo data

---

## Next Steps

Now that you have the application running:

1. 📖 **Read the documentation:** [README.md](README.md)
2. 🔍 **Explore the code:** Check out `backend/` and `client/src/`
3. 👤 **Try all user roles:** Admin, Patient, Doctor
4. 💻 **Start developing:** Make your own features!

---

## System Requirements Summary

✅ **Minimum:**
- Windows 10/11
- 4GB RAM
- 5GB free disk space
- Internet connection (for downloading installers and packages)

✅ **Recommended:**
- Windows 11
- 8GB+ RAM
- 10GB+ free disk space
- SSD for faster performance

---

## What You've Accomplished! 🎉

You have successfully:
- ✅ Installed Python 3.13
- ✅ Installed Node.js 22
- ✅ Installed PostgreSQL 16
- ✅ Created a database
- ✅ Configured the environment
- ✅ Installed all project dependencies
- ✅ Started the DentalCare application
- ✅ Logged in and explored the system

**Congratulations! You're ready to develop!** 🚀

---

## Quick Reference Card

**Start Application:**
```powershell
cd C:\Projects\Dental-Care-System
.\start-local.ps1
```

**Stop Application:**
- Press `Ctrl + C` in PowerShell

**Access Application:**
- http://localhost:5000

**Demo Logins:**
- Admin: `admin@dentalcare.com` / `admin123`
- Patient: `sarah.johnson@email.com` / `patient123`  
- Doctor: `dr.emily.davis@dentalcare.com` / `doctor123`

**Reset Database:**
```powershell
cd backend
python manage.py initdb
cd ..
```

---

**Need more help?** Check out:
- [QUICKSTART.md](QUICKSTART.md) - Quick reference
- [README-LOCAL-SETUP.md](README-LOCAL-SETUP.md) - Detailed setup guide
- [README.md](README.md) - Full project documentation

**Happy Coding! 🦷**
