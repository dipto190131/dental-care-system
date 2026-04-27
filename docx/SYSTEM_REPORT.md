# DentalCare Platform — Comprehensive System Report

**Document Type:** Technical System Report  
**System Name:** DentalCare — Online Dental Appointment & AI Assistant Platform  
**Technology Stack:** React (TypeScript) · Django (Python) · PostgreSQL · Node.js/Express  
**Prepared For:** Dissertation / Academic Report Reference  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Database Design & Data Models](#4-database-design--data-models)
5. [User Roles & Access Control](#5-user-roles--access-control)
6. [Authentication System](#6-authentication-system)
7. [Patient Portal — Features & Workflows](#7-patient-portal--features--workflows)
8. [Doctor Portal — Features & Workflows](#8-doctor-portal--features--workflows)
9. [Admin Portal — Features & Workflows](#9-admin-portal--features--workflows)
10. [DentAI — Artificial Intelligence Chatbot](#10-dentai--artificial-intelligence-chatbot)
11. [Credit & Payment System](#11-credit--payment-system)
12. [Notifications System](#12-notifications-system)
13. [API Reference](#13-api-reference)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Security Considerations](#15-security-considerations)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Demo Accounts & Test Data](#17-demo-accounts--test-data)

---

## 1. Executive Summary

DentalCare is a full-stack web application designed to digitalise and streamline the dental appointment experience. It serves three distinct user roles — **Patients**, **Doctors**, and **Administrators** — each with a dedicated portal tailored to their specific workflows.

The system enables patients to discover verified dentists, book appointments using a prepaid credit wallet (where 1 credit equals ৳1), communicate with an AI dental assistant (DentAI), manage their personal medical reports, and view their health records. Doctors can manage their availability, consult their appointment schedule, issue digital medical records and prescriptions, and request financial payouts. Administrators oversee the entire platform — verifying doctor registrations, managing users, monitoring all appointments, and processing payout requests — through a comprehensive analytics dashboard.

A standout feature is **DentAI**, an AI-powered dental chatbot that operates in two distinct modes: a patient-facing triage assistant that screens symptoms and recommends urgency levels, and a doctor-facing clinical decision support tool. DentAI also supports **Vision AI analysis**, allowing users to upload X-rays or dental photographs which the AI then interprets using multimodal large language models.

> **Figure 1 — Landing Page:** The public-facing landing page presents the platform's value proposition, lists key features (AI chatbot, verified doctors, credit booking), and provides call-to-action buttons to register or log in.

---

## 2. System Architecture Overview

The platform uses a **three-tier architecture** with a clear separation of concerns between the frontend presentation layer, a middleware API proxy, and the backend business logic layer.

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│         React + TypeScript SPA (Vite bundler)               │
│         Port 5000 (external-facing)                         │
└───────────────────────┬──────────────────────────────────────┘
                        │ HTTP requests to /api/*
┌───────────────────────▼──────────────────────────────────────┐
│              EXPRESS.JS PROXY SERVER (Node.js)              │
│              server/index.ts + server/routes.ts             │
│              Port 5000                                       │
│   - Serves the Vite-compiled React frontend                 │
│   - Proxies all /api/* requests → Django on port 8000       │
│   - Strips the /api prefix before forwarding                │
└───────────────────────┬──────────────────────────────────────┘
                        │ Proxied HTTP (no /api prefix)
┌───────────────────────▼──────────────────────────────────────┐
│              DJANGO REST API (Python)                        │
│              backend/api/views.py                            │
│              Port 8000 (internal only)                       │
│   - Session-based authentication (cookies)                  │
│   - All business logic and database operations              │
│   - AI integrations (Groq, Gemini)                          │
│   - File upload handling (/backend/uploads/)                │
└───────────────────────┬──────────────────────────────────────┘
                        │ ORM queries
┌───────────────────────▼──────────────────────────────────────┐
│              POSTGRESQL DATABASE                             │
│              Managed via Django ORM (managed=False)         │
│              Schema defined in Drizzle (shared/schema.ts)   │
│              Tables seeded with demo data on startup        │
└──────────────────────────────────────────────────────────────┘
```

### Request Flow Example — Booking an Appointment

```
Patient clicks "Book Appointment"
        │
        ▼
React calls POST /api/patient/appointments/book
        │
        ▼
Express strips "/api" → forwards to Django POST /patient/appointments/book
        │
        ▼
Django validates session cookie → authenticates patient
        │
        ▼
Django checks patient credit balance ≥ appointment cost
        │
        ▼
Django atomically:
  1. Marks AvailabilitySlot → "booked"
  2. Creates Appointment record (status: "pending")
  3. Deducts credits from patient.credit_balance
  4. Adds credits to doctor.total_earnings
  5. Creates CreditTransaction records for both parties
  6. Creates Notification records for both patient and doctor
        │
        ▼
Returns 201 Created with appointment details
        │
        ▼
React TanStack Query invalidates cache → UI updates
```

> **Figure 2 — System Architecture Diagram:** The three-tier architecture showing the React SPA communicating through the Express proxy to the Django API, which connects to PostgreSQL.

---

## 3. Technology Stack

### Backend

| Component | Technology | Version / Detail |
|---|---|---|
| Web Framework | **Django** | 5.2.x (Python) |
| WSGI Server (Production) | **Gunicorn** | Multi-worker HTTP server |
| Database ORM | Django ORM | `managed=False` — schema managed separately |
| Database | **PostgreSQL** | Production-grade relational database |
| AI (Text) | **Groq API** | `llama-3.3-70b-versatile` model |
| AI (Vision) | **Groq API** | `meta-llama/llama-4-scout-17b-16e-instruct` |
| AI (Fallback Text) | **Google Gemini** | `gemini-2.0-flash-lite` / `gemini-2.0-flash` |
| AI (Fallback Vision) | **Google Gemini** | `gemini-2.0-flash` (multimodal) |
| File Storage | Local filesystem | `backend/uploads/` directory |
| Authentication | Session-based | Django sessions, cookie `dental_session` |
| Password Hashing | Django's `make_password` | PBKDF2 + SHA256 |
| API Proxy | **Express.js** | Node.js, port 5000 |

### Frontend

| Component | Technology | Detail |
|---|---|---|
| Framework | **React 18** | TypeScript, JSX transformer via Vite |
| Build Tool | **Vite** | Hot module replacement in development |
| Routing | **Wouter** | Lightweight client-side router |
| State Management | **TanStack Query v5** | Server state, caching, invalidation |
| UI Components | **shadcn/ui** | Radix UI primitives + Tailwind CSS |
| Styling | **Tailwind CSS** | Utility-first; dark mode via `.dark` class |
| Form Handling | **React Hook Form** | With `zodResolver` for validation |
| Validation | **Zod** | Shared schema between frontend and backend types |
| Icons | **Lucide React** | Consistent icon set throughout |
| Date Handling | **date-fns** | Date formatting in tables and cards |

### Schema & Types

| Component | Technology | Detail |
|---|---|---|
| Database Schema | **Drizzle ORM** | `shared/schema.ts` defines all tables and types |
| Type Generation | `drizzle-zod` | `createInsertSchema` generates Zod validators |
| Shared Types | TypeScript | Insert types and select types shared frontend ↔ backend |

---

## 4. Database Design & Data Models

The PostgreSQL database contains 11 tables. The schema is defined in `shared/schema.ts` using Drizzle ORM, and the Django models in `backend/api/models.py` mirror this schema using `managed=False` (meaning Django does not manage migrations — all DDL is handled by Drizzle's `db:push`).

### Entity Relationship Overview

```
User (1) ──────────────── (1) DoctorProfile
  │                              │
  │                        (many)│
  │ (many)               AvailabilitySlot
  │                              │
  └─── (many) Appointment ───────┘
                │
          (0..1)│
          MedicalRecord
                │
          prescriptions (JSON array)

User ──── (many) CreditTransaction
User ──── (many) Notification
DoctorProfile ──── (many) Payout
User ──── (1) ChatSession ──── (many) ChatMessage
User ──── (many) ChatFile
```

### Table Definitions

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (varchar 36) | Primary key, generated on creation |
| `email` | text | Unique, used as login identifier |
| `password` | text | PBKDF2+SHA256 hashed via Django |
| `first_name` | text | |
| `last_name` | text | |
| `role` | varchar(20) | `patient` \| `doctor` \| `admin` |
| `credit_balance` | integer | Current wallet balance (1 credit = ৳1) |
| `avatar_url` | text | Optional profile photo URL |
| `phone` | text | Optional contact number |
| `created_at` | timestamp | Account creation time |

#### `doctor_profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID (varchar 36) | Primary key |
| `user_id` | UUID | FK → `users.id` |
| `specialty` | text | e.g. "General Dentistry", "Orthodontics" |
| `bio` | text | Professional biography |
| `license_number` | text | Dental licence (verified by admin) |
| `years_experience` | integer | Years in practice |
| `consultation_fee` | integer | Credits per appointment (default: 2, equals ৳2) |
| `rating` | decimal(3,2) | Average rating from patient reviews |
| `total_reviews` | integer | Review count |
| `verification_status` | varchar(20) | `pending` \| `approved` \| `rejected` |
| `verification_notes` | text | Admin's feedback on verification |
| `clinic_name` | text | Practice name |
| `clinic_address` | text | Physical location |
| `education` | text | Qualifications and degrees |
| `total_earnings` | integer | Cumulative credits earned |
| `pending_payouts` | integer | Credits awaiting withdrawal |
| `is_active` | boolean | Whether the doctor is visible to patients |
| `created_at` | timestamp | |

#### `availability_slots`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `doctor_id` | UUID | FK → `doctor_profiles.id` |
| `date` | text | ISO date string (YYYY-MM-DD) |
| `start_time` | text | e.g. "09:00" |
| `end_time` | text | e.g. "09:30" |
| `status` | varchar(20) | `available` \| `booked` |
| `created_at` | timestamp | |

#### `appointments`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK → `users.id` |
| `doctor_id` | UUID | FK → `doctor_profiles.id` |
| `slot_id` | UUID | FK → `availability_slots.id` (nullable if slot deleted) |
| `status` | varchar(20) | `pending` \| `confirmed` \| `completed` \| `cancelled` |
| `notes` | text | Pre-appointment notes from patient |
| `credits_cost` | integer | Cost at time of booking (snapshot) |
| `is_video_call` | boolean | Whether a video link was generated |
| `meeting_link` | text | Telemedicine URL (if video consultation) |
| `created_at` | timestamp | |

#### `credit_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `users.id` |
| `type` | varchar(20) | `purchase` \| `booking` \| `earning` \| `refund` |
| `amount` | integer | Positive (credit) or negative (debit) |
| `description` | text | Human-readable description |
| `package_name` | text | Package tier for purchase transactions |
| `created_at` | timestamp | |

#### `medical_records`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK → `users.id` |
| `doctor_id` | UUID | FK → `doctor_profiles.id` |
| `appointment_id` | UUID | FK → `appointments.id` (optional) |
| `diagnosis` | text | Clinical diagnosis |
| `treatment` | text | Treatment plan |
| `prescriptions` | JSONB | Array of `{medication, dosage, frequency, duration}` objects |
| `notes` | text | Additional clinical notes |
| `follow_up_date` | text | Recommended follow-up date |
| `created_at` | timestamp | |

#### `payouts`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `doctor_id` | UUID | FK → `doctor_profiles.id` |
| `amount` | integer | Credits requested for withdrawal |
| `status` | varchar(20) | `pending` \| `approved` \| `rejected` |
| `requested_at` | timestamp | When the doctor submitted the request |
| `processed_at` | timestamp | When admin processed it |
| `notes` | text | Admin notes or rejection reason |

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → `users.id` |
| `title` | text | Short notification headline |
| `message` | text | Full notification body |
| `type` | text | `info` \| `success` \| `warning` \| `error` |
| `is_read` | boolean | Read/unread status |
| `created_at` | timestamp | |

#### `chat_sessions`, `chat_messages`, `chat_files`
| Table | Purpose |
|---|---|
| `chat_sessions` | One session per user; groups messages together |
| `chat_messages` | Individual messages (role: `user` or `assistant`) |
| `chat_files` | Uploaded images/reports with metadata and stored filename |

---

## 5. User Roles & Access Control

The platform implements **role-based access control (RBAC)** at two layers:

1. **Backend (Django):** Every protected view checks `request.session.get('user_id')` and the user's `role` field. Requests with the wrong role receive a `403 Forbidden` response.
2. **Frontend (React):** The `ProtectedRoute` component in `App.tsx` checks the authenticated user's role and redirects to `/login` if the role does not match the route's requirement.

### Role Summary

| Role | Registration | Verification Required | Portal Entry Point |
|---|---|---|---|
| **Patient** | Self-register at `/register` | None | `/dashboard` |
| **Doctor** | Self-register at `/register` (select role) | Admin approval required | `/doctor/dashboard` |
| **Admin** | Pre-seeded account only | N/A | `/admin/dashboard` |

> **Figure 3 — Registration Page:** The registration form allows new users to select their role (Patient or Doctor), enter their personal details, and create an account.

---

## 6. Authentication System

Authentication uses Django's **session-based** mechanism with a custom session cookie named `dental_session`.

### Registration Flow

```
User fills registration form
        │
        ▼
POST /api/auth/register
{email, password, firstName, lastName, role, specialty (if doctor), licenseNumber (if doctor)}
        │
        ▼
Django validates email uniqueness
        │
        ├── If doctor → creates DoctorProfile with verification_status="pending"
        │
        ▼
Django hashes password → make_password(password)
Creates User record with UUID primary key
        │
        ▼
Creates Django session → sets dental_session cookie
        │
        ▼
Returns 201 Created with serialised user object
```

### Login Flow

```
User submits email + password
        │
        ▼
POST /api/auth/login { email, password }
        │
        ▼
Django looks up user by email
Django verifies password via check_password()
        │
        ▼
Creates session → sets HttpOnly cookie
        │
        ▼
Returns 200 OK with user data + doctorProfile (if applicable)
```

### Session Persistence

- The `GET /api/auth/me` endpoint is called on every page load to restore session state.
- The React `AuthProvider` context stores `user` and `doctorProfile` in memory and exposes a `refresh()` function.
- All protected routes check this context before rendering.

> **Figure 4 — Login Page:** The login form with email and password fields, styled with the platform's colour scheme. Redirects automatically to the appropriate role-specific dashboard.

---

## 7. Patient Portal — Features & Workflows

### 7.1 Patient Dashboard (`/dashboard`)

The patient dashboard is the main landing page after login. It displays:

- **Welcome card** with the patient's name and current credit balance
- **Stats overview:** total appointments, completed visits, pending appointments
- **Upcoming appointments list** showing the next 3 confirmed or pending appointments with doctor name, date/time, and cost
- **Quick action links:** Find a Doctor, Buy Credits, View Records
- **DentAI shortcut:** Direct link to the AI chatbot

> **Figure 5 — Patient Dashboard:** Shows the welcome banner with credit balance, stat cards for total/completed/pending appointments, and the upcoming appointments panel.

### 7.2 Find a Doctor (`/doctors`)

Patients can browse and search through the list of **verified and active doctors**.

**Features:**
- Search bar filters by doctor name, specialty, clinic, or bio text (client-side filtering)
- Specialty filter dropdown (General Dentistry, Orthodontics, Oral Surgery, Periodontics, Endodontics, Cosmetic Dentistry, Pediatric Dentistry, Prosthodontics)
- Doctor cards display: name, specialty, rating (star display), experience, fee in credits and ৳, clinic name, and a "Book Appointment" button
- Only `verification_status = "approved"` and `is_active = true` doctors are returned by the API

> **Figure 6 — Doctors Listing Page:** A grid of doctor cards with search bar and specialty filter. Each card shows the doctor's profile photo placeholder, specialty badge, rating, years of experience, and consultation fee.

### 7.3 Doctor Detail & Appointment Booking (`/doctors/:id`)

Clicking a doctor's card opens their full profile page with a booking interface.

**Profile Section:**
- Doctor's full name, specialty badge
- Fee: displayed as "{N} credits (৳{N}) / appointment"
- Clinic name and address
- Education and professional biography
- Rating and review count

**Booking Workflow:**

```
Patient views doctor profile
        │
        ▼
Clicks a date on the calendar
        │
        ▼
Available time slots for that date load (GET /api/doctors/:id/slots)
        │
        ▼
Patient selects a time slot
        │
        ▼
Booking dialog opens showing:
  - Doctor name + date + time slot
  - Cost: "{N} credits (৳{N})"
  - Optional: Video consultation toggle (generates meeting link)
  - Optional: Notes for the doctor (text area)
        │
        ├── If balance < cost → warning banner "Insufficient Credits"
        │   with link to Credits page
        │
        ▼
Patient clicks "Confirm Booking"
        │
        ▼
POST /api/patient/appointments/book
{ doctorId, slotId, notes, isVideoCall }
        │
        ▼
Django: atomically deducts credits, creates appointment,
marks slot as booked, sends notifications to both parties
        │
        ▼
Success toast → TanStack Query cache invalidated
```

> **Figure 7 — Doctor Detail Page:** Shows the doctor's full profile on the left with bio, clinic details, and fee. The right panel contains a date picker calendar and, after selecting a date, a list of available time slots.

> **Figure 8 — Booking Confirmation Dialog:** A modal showing the appointment summary (doctor, date, time, cost in credits and ৳), video call toggle, notes text area, and credit balance warning if insufficient.

### 7.4 My Appointments (`/appointments`)

Displays all of the patient's appointments with full status tracking.

**Features:**
- Tab filters: All | Upcoming | Completed | Cancelled
- Each appointment card shows: doctor name, specialty, date and time, appointment status (colour-coded badge), cost, video call indicator, and patient notes
- Status colour coding:
  - `pending` → amber
  - `confirmed` → primary blue
  - `completed` → emerald green
  - `cancelled` → red
- Cancel button available for pending/confirmed appointments (opens confirmation dialog)
- Video call link button for confirmed video appointments

> **Figure 9 — Appointments Page:** A filtered list of appointment cards with status badges. Shows upcoming appointments at the top with cancel buttons, and historical completed/cancelled appointments below.

### 7.5 Credits Wallet (`/credits`)

The prepaid credit system allows patients to purchase appointment credits.

**Credit Balance Banner:** Shows the current balance with a large number and the ৳ equivalent (e.g., "15 credits · equivalent to ৳15").

**Credit Packages:**

| Package | Credits | Price | Badge |
|---|---|---|---|
| Starter | 5 | ৳5 | — |
| Standard | 10 | ৳10 | Most Popular |
| Premium | 20 | ৳20 | — |
| Ultimate | 50 | ৳50 | Best Value |

**Mock Payment Modal Workflow:**

```
Patient clicks "Buy Now" on a package
        │
        ▼
Payment modal opens showing:
  - Package name and credit amount
  - Total price in ৳
  - Pre-filled card number: 4242 4242 4242 4242
  - Pre-filled expiry: 12/26 | CVV: 123
  - Cardholder name field (required)
  - Disclaimer: "Simulated payment for demonstration purposes"
        │
        ▼
Patient enters their name and clicks "Pay ৳X"
        │
        ▼
POST /api/patient/credits/purchase { packageId: "starter"|"standard"|"premium"|"ultimate" }
        │
        ▼
Django creates CreditTransaction (type="purchase")
Adds credits to patient.credit_balance
Creates notification: "Credits purchased successfully"
        │
        ▼
Success toast "Payment successful! X credits added"
Modal closes → balance updates in real time
```

**Transaction History:** Below the packages, a chronological list of all credit transactions is displayed. Each entry shows the description, date/time, amount (green for credit, red for debit), and ৳ equivalent.

> **Figure 10 — Credits Page:** The credit balance banner at the top, four package cards with buy buttons, and the transaction history list below showing deposits and deductions.

> **Figure 11 — Payment Modal:** The mock payment form with card number (pre-filled), expiry, CVV, cardholder name field, total in ৳, and the simulated payment disclaimer.

### 7.6 Medical Records (`/records`)

Displays all medical records created by doctors for the patient.

**Each record card shows:**
- Diagnosis (primary heading)
- Treating doctor's name and specialty
- Date of record creation
- Treatment plan
- Prescriptions (each listed as: medication name, dosage, frequency, duration)
- Additional clinical notes
- Follow-up date (if set)
- Linked appointment reference

> **Figure 12 — Medical Records Page:** A list of record cards, each expandable to show full diagnosis, treatment, and prescriptions in a clean, readable format.

### 7.7 My Reports (`/my-reports`)

A dedicated image gallery for the patient's uploaded dental reports, X-rays, and photographs.

**Features:**
- Upload new images via file picker (JPG, PNG, GIF, WebP, PDF, DICOM)
- Thumbnail grid view of all uploaded files
- Click any thumbnail to open a full-size preview modal
- Delete individual files (with confirmation)
- Each file shows: filename, upload date, file size
- "Analyze with AI" button on each image → navigates to DentAI chat with the image pre-attached

> **Figure 13 — My Reports Gallery:** A grid of image thumbnails with file names and dates. An upload button in the top right, and a preview modal opens when any thumbnail is clicked.

### 7.8 DentAI Chat — Patient Mode (`/chat`)

The AI dental assistant for patient symptom triage. See Section 10 for full detail.

---

## 8. Doctor Portal — Features & Workflows

### 8.1 Doctor Dashboard (`/doctor/dashboard`)

The central hub for a doctor's daily activity.

**Stats Cards:**
- Today's Appointments count
- Pending (unconfirmed) appointments
- Total Patients seen
- Total Earnings (credits)

**Profile Info Card (right panel):**
Shows the doctor's professional details including:
- Specialty and verification status badge
- Licence number
- Years of experience
- **Consultation Fee (editable inline)**
- Rating

**Inline Fee Editor Workflow:**

```
Doctor sees "Fee per visit: 2 credits (৳2)" with a pencil icon
        │
        ▼
Clicks pencil icon (data-testid="button-edit-fee")
        │
        ▼
Input field appears with current value pre-filled
Save (✓) and Cancel (✗) buttons appear
        │
        ▼
Doctor types new fee (e.g., 3)
Clicks save (✓)
        │
        ▼
PUT /api/doctor/profile { consultationFee: 3 }
        │
        ▼
Django updates DoctorProfile.consultation_fee
Returns updated profile
        │
        ▼
Success toast: "Consultation fee updated — New fee: 3 credits (৳3)"
Profile card updates in real time
```

**Today's Appointments List:** The upcoming appointments for today with patient name, time slot, status badge, and action buttons to view records.

**Recent Slots:** Shows the doctor's most recently created availability slots with dates and status.

> **Figure 14 — Doctor Dashboard:** Shows the four stat cards at the top, recent appointments in the centre, and the profile info card on the right with the inline fee editor.

### 8.2 Manage Appointments (`/doctor/appointments`)

Full appointment management view for the doctor.

**Features:**
- Status filter tabs: All | Pending | Confirmed | Completed | Cancelled
- Each appointment shows: patient name, date/time, status, cost, notes, and video call indicator
- Action buttons:
  - **Confirm** a pending appointment (updates status → "confirmed")
  - **Complete** a confirmed appointment (updates status → "completed")
  - **Cancel** an appointment (with reason)
  - **View / Create Medical Record** (links to DoctorRecords)
  - **Join Video Call** link for video appointments

> **Figure 15 — Doctor Appointments Page:** Tabbed view of all appointments with status badges and action buttons for confirming, completing, or cancelling.

### 8.3 Availability Management (`/doctor/availability`)

Doctors publish their available time slots for patients to book.

**Add Slot Form:**
- Date picker
- Start time (15-minute increments)
- End time
- Submit creates a new `AvailabilitySlot` with `status="available"`

**Existing Slots Display:**
- Calendar-style view grouped by date
- Each slot shows the time range and status (`available` = clickable / `booked` = greyed out)
- Delete button for available (unbooked) slots

> **Figure 16 — Availability Page:** The slot creation form on the left and a list of existing slots grouped by date on the right. Booked slots are shown but cannot be deleted.

### 8.4 Medical Records — Doctor View (`/doctor/records`)

Doctors create and manage medical records linked to patient appointments.

**Create Record Form:**
- Select patient (from doctor's appointment history)
- Select linked appointment (optional)
- Diagnosis (required free text)
- Treatment plan
- Prescriptions: dynamic list, each row has medication name, dosage, frequency, and duration
- Follow-up date
- Additional notes

**Records List:**
- All records created by this doctor
- Patient name and appointment reference
- Full record details expandable in a card

> **Figure 17 — Doctor Records Page:** A split view with the record creation form and the list of existing patient records. The prescription section allows adding multiple medications dynamically.

### 8.5 Payouts (`/doctor/payouts`)

Doctors can withdraw their earned credits as real-world payments.

**Earnings Summary:**
- Total Earnings (lifetime credits earned)
- Pending Payouts (credits in awaiting withdrawal requests)
- Available to Withdraw (total earnings minus pending)

**Payout Request Workflow:**

```
Doctor enters withdrawal amount (≤ available balance)
        │
        ▼
POST /api/doctor/payouts/request { amount }
        │
        ▼
Django creates Payout record (status="pending")
Increments DoctorProfile.pending_payouts
Creates notification for doctor
        │
        ▼
Admin sees request in Admin → Payouts panel
        │
        ├── Admin approves → Payout.status = "approved", processed_at set
        │   Notification sent to doctor: "Payout approved"
        │
        └── Admin rejects → Payout.status = "rejected", credits returned
            Notification sent to doctor: "Payout rejected"
```

**Payout History:** Table of all past requests with amount, date, status badge, and admin notes.

> **Figure 18 — Doctor Payouts Page:** Shows the earnings summary panel with three KPI cards, the withdrawal request form, and the payout history table with status badges.

### 8.6 DentAI Chat — Doctor Mode (`/doctor/chat`)

The AI clinical decision support tool for doctors. See Section 10 for full detail.

---

## 9. Admin Portal — Features & Workflows

### 9.1 Admin Dashboard (`/admin/dashboard`)

Platform-wide analytics and monitoring.

**KPI Cards (top row):**
- Total Users
- Total Doctors (verified)
- Total Appointments
- Total Revenue (credits circulated)

**Charts and Data Panels:**
- Appointment status breakdown (pending / confirmed / completed / cancelled)
- Recent signups
- Platform activity summary

> **Figure 19 — Admin Dashboard:** The analytics overview with KPI cards, charts showing appointment status distribution, and recent platform activity.

### 9.2 Doctor Verification (`/admin/doctors`)

The most critical admin workflow — reviewing and approving doctors before they can accept patients.

**Doctor List:**
- All registered doctors with verification status badges
- Colour coding: `pending` = amber, `approved` = green, `rejected` = red

**Verification Workflow:**

```
Doctor registers → DoctorProfile created with verification_status="pending"
        │
        ▼
Admin views doctor in Admin → Doctors panel
Sees: name, specialty, licence number, education, years of experience, bio
        │
        ▼
Admin clicks "Approve" or "Reject" with optional notes
        │
        ▼
POST /api/admin/doctors/:id/verify { status: "approved"|"rejected", notes }
        │
        ▼
Django updates DoctorProfile.verification_status and verification_notes
Creates notification for the doctor
        │
        ├── Approved → Doctor becomes visible in patient doctor search
        │              Doctor can now receive bookings
        │
        └── Rejected → Doctor remains hidden from patients
                       Doctor notified with admin feedback
```

> **Figure 20 — Admin Doctor Verification:** A list of all registered doctors with their verification status badges. Each entry has Approve/Reject buttons and displays licence number, specialty, and registration date.

### 9.3 User Management (`/admin/users`)

Admin view of all registered users (patients, doctors, admins).

**Features:**
- Full user list with role badges
- Search/filter by name or email
- View credit balance for each patient
- Account creation timestamps

> **Figure 21 — Admin Users Page:** A table of all platform users with role badges (Patient/Doctor/Admin), credit balances, and account creation dates.

### 9.4 Appointment Management (`/admin/appointments`)

Admin oversight of all appointments across the platform.

**Features:**
- Full appointment list with patient and doctor details
- Status filter
- Override appointment status if needed (e.g., marking as completed or cancelling)
- View appointment notes, costs, and video call status

> **Figure 22 — Admin Appointments Page:** A comprehensive table of all platform appointments showing patient name, doctor name, date/time, status, and cost.

### 9.5 Payout Management (`/admin/payouts`)

Admin review and processing of doctor withdrawal requests.

**Features:**
- List of all payout requests with doctor name, amount, and request date
- Status filter: All | Pending | Approved | Rejected
- Approve or Reject each request with optional admin notes
- Approved payouts increment doctor's confirmed payout total
- Rejected payouts return credits to the doctor's pending balance

> **Figure 23 — Admin Payouts Page:** The payout requests list with doctor names, requested amounts, status badges, and Approve/Reject action buttons.

---

## 10. DentAI — Artificial Intelligence Chatbot

DentAI is the platform's integrated AI assistant, powered by large language models. It operates in two distinct modes depending on the user's role.

### 10.1 AI Model Architecture

```
Incoming chat message
        │
        ├── Has image file_id?
        │         │
        │         ▼ YES
        │   _call_ai_with_image()
        │         │
        │         ├── Groq API available?
        │         │   YES → meta-llama/llama-4-scout-17b-16e-instruct
        │         │         (Vision-capable Llama 4 Scout model)
        │         │
        │         └── Fallback → Google Gemini API
        │                        gemini-2.0-flash (multimodal)
        │
        └── Text only
                  │
                  ▼
            _call_ai()
                  │
                  ├── Groq API available?
                  │   YES → llama-3.3-70b-versatile
                  │         (70B parameter Llama 3.3 model)
                  │
                  └── Fallback → Google Gemini API
                                 gemini-2.0-flash-lite
                                 (then gemini-2.0-flash if lite fails)
```

### 10.2 Patient Mode — Symptom Triage

**System Prompt Behaviour (PATIENT_SYSTEM_PROMPT):**

DentAI is instructed to act as a professional dental health assistant and follow a structured consultation approach:

1. **Warm greeting** — welcomes the patient and asks about their primary concern
2. **Targeted questioning** — asks one question at a time:
   - Symptom location (upper/lower jaw, left/right, front/back)
   - Pain scale 1–10
   - Duration of symptoms
   - Triggers (hot/cold/sweet foods, pressure, biting)
   - Visible symptoms (swelling, bleeding gums, visible damage)
   - Previous dental work in the affected area
   - Medications, allergies, or medical conditions
3. **Differential suggestion** — after gathering information, suggests possible conditions using cautious language ("this could indicate...", "this sounds like it might be...")
4. **Urgency classification:**
   - Routine appointment
   - Soon (within a week)
   - Urgent (within 48 hours)
   - Emergency care immediately
5. **Encourages report upload** — prompts the patient to upload X-rays or photos

**Safety Override Rules (highest priority):**
- Severe facial/neck swelling + difficulty breathing → immediate emergency care instruction
- Never provides a definitive diagnosis
- Always recommends professional consultation

### 10.3 Doctor Mode — Clinical Decision Support

**System Prompt Behaviour (DOCTOR_SYSTEM_PROMPT):**

In doctor mode, DentAI acts as a clinical reference tool:

- Differential diagnosis assistance
- Evidence-based treatment planning
- Pharmacology reference (analgesics, antibiotics, local anaesthetics) with guideline verification reminders
- Radiographic finding interpretation
- Referral decision support (which specialty, when)
- Post-operative care guidance
- Patient communication strategies

The AI uses appropriate clinical terminology, structures responses with bullet points, and always clarifies that it is a reference tool — not a replacement for clinical judgement.

### 10.4 Dynamic Context Injection (`_build_system_context`)

Before every AI call, the backend queries the database and injects live platform data into the system prompt:

**For Patients:**
```python
# Queries all approved doctors and injects into prompt:
"Available verified doctors on this platform:
- Dr. Emily Davis (General Dentistry) at City Dental Clinic — 2 credits/visit
- Dr. James Wilson (Orthodontics) at Smile Orthodontics — 3 credits/visit
- ..."
```

This enables DentAI to recommend **actual platform doctors** by name and specialty based on the patient's symptoms — making the chatbot genuinely useful for converting conversations into bookings.

**For Doctors:**
```python
# Injects platform scale context:
"Platform context: There are currently {N} registered patients on this platform."
```

### 10.5 Vision Analysis — X-ray & Image Interpretation

Patients and doctors can upload dental images (X-rays, photographs, reports) and ask the AI to analyse them.

**Image Upload Flow:**

```
User clicks "Upload" in chat or My Reports page
        │
        ▼
POST /api/chat/files (multipart/form-data)
        │
        ▼
Django saves file to backend/uploads/
Creates ChatFile record with metadata
Returns file_id
        │
        ▼
Patient mode: "Analyze with AI" button appears on image
Doctor mode: Thumbnail shown with "Ask AI about this report" button
        │
        ▼
User clicks Analyze → chat message sent with file_id
        │
        ▼
POST /api/chat/message { message: "...", file_id: "..." }
        │
        ▼
Django reads image from disk
Converts to Base64 Data URL
        │
        ▼
_call_ai_with_image() called:
  → Groq: sends as vision message content with base64 image URL
  → Gemini: sends as Part() multimodal content
        │
        ▼
LLM analyses the dental image
Returns clinical observations and recommendations
        │
        ▼
Response saved to ChatMessage table
Returned to frontend → displayed in chat
```

**Supported File Types:** JPEG, PNG, GIF, WebP, PDF, DICOM

### 10.6 Conversation Persistence

- The last **50 messages** from the user's `ChatSession` are loaded as conversation history with every API call
- Conversation history is formatted as alternating `user` / `assistant` messages
- The `DELETE /api/chat/session` endpoint clears the conversation history
- Doctors can view a patient's chat history (read-only) via `GET /api/chat/patient/:patientId`

> **Figure 24 — Patient DentAI Chat:** The chat interface showing the conversation with DentAI. An uploaded X-ray thumbnail is visible with the "Analyze with AI" button. The AI response includes structured symptom assessment and urgency level.

> **Figure 25 — Doctor DentAI Chat:** The clinical decision support interface. An uploaded patient report thumbnail appears in the sidebar with an "Ask AI about this report" button. The AI response uses clinical terminology with differential diagnoses.

---

## 11. Credit & Payment System

### 11.1 Credit Economy Rules

| Transaction Type | Direction | Effect |
|---|---|---|
| Patient purchases credits | Patient ← credits | `credit_balance` increases; `CreditTransaction(type="purchase")` created |
| Patient books appointment | Patient → Doctor | Patient `credit_balance` decreases; Doctor `total_earnings` increases; Two `CreditTransaction` records created |
| Appointment cancelled | Patient ← credits refunded | Patient `credit_balance` restored; `CreditTransaction(type="refund")` created |
| Doctor requests payout | Doctor → Payout queue | Doctor `pending_payouts` increases |
| Admin approves payout | Payout completed | Doctor `pending_payouts` decreases; real payment processed externally |

### 11.2 Credit Pricing

```
1 credit = ৳1

Packages:
  Starter  — 5 credits  = ৳5
  Standard — 10 credits = ৳10   (Most Popular)
  Premium  — 20 credits = ৳20
  Ultimate — 50 credits = ৳50   (Best Value)
```

### 11.3 Doctor Fee Configuration

Each doctor sets their own `consultation_fee` (in credits, minimum 1) from their dashboard. The fee is stored as a snapshot in each `Appointment.credits_cost` at the time of booking, so historical appointments are unaffected by future fee changes.

---

## 12. Notifications System

A real-time notification system keeps all users informed of platform events.

**Events that trigger notifications:**

| Trigger | Recipient(s) |
|---|---|
| Patient books appointment | Patient + Doctor |
| Doctor confirms appointment | Patient |
| Doctor completes appointment | Patient |
| Appointment cancelled (by either party) | Both |
| Doctor creates medical record | Patient |
| Patient purchases credits | Patient |
| Doctor requests payout | Doctor (confirmation) |
| Admin approves payout | Doctor |
| Admin rejects payout | Doctor |
| Admin approves doctor verification | Doctor |
| Admin rejects doctor verification | Doctor |

**Notification Bell:** The top navigation bar shows a bell icon with an unread count badge. Clicking it opens the Notifications page (`/notifications`) where all notifications are listed with read/unread status.

`GET /api/notifications` — fetches all notifications for the current user, ordered by `created_at` DESC  
`POST /api/notifications/read-all` — marks all as read  
`POST /api/notifications/:id/read` — marks a single notification as read

---

## 13. API Reference

All endpoints are prefixed with `/api/` in the frontend (Express strips this and forwards to Django).

### Authentication

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login and create session |
| POST | `/api/auth/logout` | Yes | Destroy session |
| GET | `/api/auth/me` | Yes | Get current user data |

### Public Doctor Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctors` | Yes (any role) | List all approved doctors |
| GET | `/api/doctors/:id` | Yes | Get doctor profile |
| GET | `/api/doctors/:id/slots` | Yes | Get available slots for a doctor |

### Patient Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patient/appointments` | Patient | List all appointments |
| POST | `/api/patient/appointments/book` | Patient | Book an appointment |
| POST | `/api/patient/appointments/:id/cancel` | Patient | Cancel an appointment |
| GET | `/api/patient/medical-records` | Patient | View medical records |
| GET | `/api/patient/credits` | Patient | Balance + transaction history |
| POST | `/api/patient/credits/purchase` | Patient | Purchase credit package |

### Doctor Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/doctor/profile` | Doctor | Get own profile |
| PUT | `/api/doctor/profile` | Doctor | Update profile + fee |
| GET | `/api/doctor/slots` | Doctor | List own availability slots |
| POST | `/api/doctor/slots` | Doctor | Create availability slot |
| DELETE | `/api/doctor/slots/:id` | Doctor | Delete a slot |
| GET | `/api/doctor/appointments` | Doctor | List own appointments |
| GET | `/api/doctor/medical-records` | Doctor | List created records |
| POST | `/api/doctor/medical-records` | Doctor | Create a medical record |
| GET | `/api/doctor/payouts` | Doctor | List payout history |
| POST | `/api/doctor/payouts/request` | Doctor | Request payout |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform analytics |
| GET | `/api/admin/users` | Admin | All users list |
| GET | `/api/admin/doctors` | Admin | All doctors with status |
| POST | `/api/admin/doctors/:id/verify` | Admin | Approve or reject doctor |
| GET | `/api/admin/appointments` | Admin | All platform appointments |
| PUT | `/api/admin/appointments/:id` | Admin | Update appointment status |
| GET | `/api/admin/payouts` | Admin | All payout requests |
| PUT | `/api/admin/payouts/:id` | Admin | Approve or reject payout |

### AI Chat Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/chat/session` | Any | Get conversation history |
| DELETE | `/api/chat/session` | Any | Clear conversation |
| POST | `/api/chat/message` | Any | Send message (+ optional file_id) |
| GET | `/api/chat/files` | Any | List uploaded files |
| POST | `/api/chat/files` | Any | Upload a file |
| GET | `/api/chat/files/:id/download` | Any | Download/view a file |
| DELETE | `/api/chat/files/:id` | Any | Delete a file |
| GET | `/api/chat/patient/:id` | Doctor | View patient's chat history |

### Shared Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | Any | List notifications |
| POST | `/api/notifications/read-all` | Any | Mark all as read |
| POST | `/api/notifications/:id/read` | Any | Mark one as read |

---

## 14. Frontend Architecture

### Component Structure

```
client/src/
├── App.tsx                    # Router + ProtectedRoute + AppShell
├── contexts/
│   └── AuthContext.tsx        # Global auth state (user, doctorProfile, refresh)
├── components/
│   ├── app-sidebar.tsx        # Role-aware navigation sidebar
│   └── ui/                   # shadcn/ui component library
├── pages/
│   ├── landing.tsx            # Public landing page
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── patient/
│   │   ├── dashboard.tsx
│   │   ├── doctors.tsx
│   │   ├── doctor-detail.tsx  # Profile + booking dialog
│   │   ├── appointments.tsx
│   │   ├── credits.tsx        # Wallet + mock payment modal
│   │   ├── medical-records.tsx
│   │   ├── my-reports.tsx     # Image gallery + AI analysis
│   │   └── chat.tsx           # DentAI patient mode
│   ├── doctor/
│   │   ├── dashboard.tsx      # Stats + inline fee editor
│   │   ├── appointments.tsx
│   │   ├── availability.tsx
│   │   ├── records.tsx
│   │   ├── payouts.tsx
│   │   └── chat.tsx           # DentAI doctor mode
│   ├── admin/
│   │   ├── dashboard.tsx
│   │   ├── doctors.tsx        # Verification workflow
│   │   ├── users.tsx
│   │   ├── appointments.tsx
│   │   └── payouts.tsx
│   └── notifications.tsx
└── lib/
    └── queryClient.ts         # TanStack Query + apiRequest helper
```

### Navigation Sidebar

The `AppSidebar` component is **role-aware** — it renders different navigation links depending on the logged-in user's role:

**Patient sidebar:**  Dashboard · Find Doctors · My Appointments · Credits · Medical Records · My Reports · DentAI Chat

**Doctor sidebar:**  Dashboard · Appointments · Availability · Patient Records · Payouts · DentAI Chat

**Admin sidebar:**  Dashboard · Doctor Verification · Users · Appointments · Payouts

All sidebars include: Notifications (with unread badge) · Profile section · Dark mode toggle

### State Management Pattern

All server state is managed through **TanStack Query v5**:
- Queries use array query keys for hierarchical cache invalidation (e.g., `['/api/doctors', doctorId]`)
- Mutations call `apiRequest()` from `@/lib/queryClient` (which handles credentials and content type automatically)
- After every mutation, relevant query keys are invalidated to trigger refetches
- Loading states shown via `.isLoading` (skeleton components) and `.isPending` (button spinners)

### Dark Mode

The application supports full dark mode:
- Toggle button in the top header bar (sun/moon icon)
- Preference persisted in `localStorage`
- Implemented via the `.dark` class on `document.documentElement`
- All components use Tailwind's `dark:` variant for colour adjustments

> **Figure 26 — Dark Mode:** The same dashboard page rendered in dark mode, showing the inverted colour scheme with dark backgrounds and light text.

---

## 15. Security Considerations

### Authentication Security

| Measure | Implementation |
|---|---|
| Password hashing | Django `make_password()` — PBKDF2 + SHA256 with salt |
| Session management | Server-side sessions via Django session framework |
| HttpOnly cookies | Session cookie not accessible to JavaScript |
| Session cookie name | `dental_session` (custom, not default `sessionid`) |
| CSRF | Django's CSRF middleware (token on state-changing requests) |

### Role-Based Access Control

Every Django view function validates both:
1. **Authentication:** `request.session.get('user_id')` must exist
2. **Authorisation:** The user's `role` must match the required role for the endpoint

Cross-role access (e.g., a patient calling a doctor endpoint) returns `403 Forbidden`.

### Data Validation

- All request bodies are validated in Django views before any database operation
- Frontend forms use Zod schemas (from `drizzle-zod`) for client-side validation
- Numeric inputs (fees, payout amounts) are validated for valid ranges

### File Upload Security

- Uploaded files are stored in `backend/uploads/` with a UUID-prefixed stored name (preventing filename collisions and path traversal)
- File type is stored in the database metadata; the download endpoint sets correct `Content-Type` headers

---

## 16. Deployment Architecture

### Development Mode

```
bash start.sh
  ├── Django migrations check (python manage.py migrate --run-syncdb)
  ├── Database initialisation (python init_db.py — seeds demo data)
  ├── Django dev server → port 8000
  └── Node.js (tsx server/index.ts) → port 5000
       ├── Serves Vite frontend (hot reload via HMR)
       └── Proxies /api/* → localhost:8000
```

### Production Mode

```
bash start-prod.sh
  ├── Django migrations check
  ├── Database initialisation
  ├── Gunicorn WSGI server → port 8000
  │     backend.dental_care.wsgi:application
  │     Multiple worker processes for concurrent requests
  └── Node.js (tsx server/index.ts) → port 5000
       ├── Serves built Vite static files
       └── Proxies /api/* → localhost:8000
```

**Deployment Configuration:**
- External port: 5000 (Node.js entry point)
- Build command: `npm run build`
- Run command: `bash start-prod.sh` (Linux/Mac) or `start-local.ps1` (Windows)

---

## 17. Demo Accounts & Test Data

The database is seeded with demo data on first startup via `backend/init_db.py`.

### Credentials

| Role | Email | Password | Name |
|---|---|---|---|
| Admin | `admin@dentalcare.com` | `admin123` | Admin User |
| Patient | `sarah.johnson@email.com` | `patient123` | Sarah Johnson |
| Doctor | `dr.emily.davis@dentalcare.com` | `doctor123` | Dr. Emily Davis (General Dentistry) |
| Doctor | `dr.james.wilson@dentalcare.com` | `doctor123` | Dr. James Wilson (Orthodontics) |
| Doctor | `dr.priya.patel@dentalcare.com` | `doctor123` | Dr. Priya Patel (Oral Surgery) |
| Doctor | `dr.michael.nguyen@dentalcare.com` | `doctor123` | Dr. Michael Nguyen (Cosmetic Dentistry) |

### Seeded Data

The seed script creates:
- All 4 doctors with `verification_status="approved"`
- Sample availability slots across the next 14 days for each doctor
- Sample appointments in various statuses (pending, confirmed, completed)
- Sample medical records with prescriptions
- Sample credit transactions
- Sample notifications

---

*End of System Report*
