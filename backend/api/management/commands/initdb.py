import uuid
from datetime import datetime

import bcrypt
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Initialize database tables and seed demo data'

    def handle(self, *args, **options):
        self.stdout.write('Creating database tables...')
        self._create_tables()
        self.stdout.write('Seeding demo data...')
        self._seed_data()
        self.stdout.write(self.style.SUCCESS('Database initialized successfully.'))

    def _create_tables(self):
        with connection.cursor() as cur:
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """)
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """)
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE verification_status AS ENUM ('pending', 'certificate_pending', 'approved', 'rejected');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """)
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE slot_status AS ENUM ('available', 'booked');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """)
            cur.execute("""
                DO $$ BEGIN
                    CREATE TYPE transaction_type AS ENUM ('purchase', 'deduction', 'refund');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    email TEXT NOT NULL UNIQUE,
                    password TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    role user_role NOT NULL DEFAULT 'patient',
                    credit_balance INTEGER NOT NULL DEFAULT 0,
                    avatar_url TEXT,
                    phone TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS doctor_profiles (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    specialty TEXT NOT NULL,
                    bio TEXT,
                    license_number TEXT NOT NULL,
                    years_experience INTEGER NOT NULL DEFAULT 0,
                    consultation_fee INTEGER NOT NULL DEFAULT 2,
                    rating DECIMAL(3,2) DEFAULT 0.00,
                    total_reviews INTEGER NOT NULL DEFAULT 0,
                    verification_status verification_status NOT NULL DEFAULT 'pending',
                    verification_notes TEXT,
                    clinic_name TEXT,
                    clinic_address TEXT,
                    education TEXT,
                    medical_certificate TEXT,
                    total_earnings INTEGER NOT NULL DEFAULT 0,
                    pending_payouts INTEGER NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS availability_slots (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    doctor_id VARCHAR NOT NULL REFERENCES doctor_profiles(id),
                    date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    status slot_status NOT NULL DEFAULT 'available',
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS appointments (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id VARCHAR NOT NULL REFERENCES users(id),
                    doctor_id VARCHAR NOT NULL REFERENCES doctor_profiles(id),
                    slot_id VARCHAR NOT NULL REFERENCES availability_slots(id),
                    status appointment_status NOT NULL DEFAULT 'pending',
                    notes TEXT,
                    credits_cost INTEGER NOT NULL DEFAULT 2,
                    is_video_call BOOLEAN NOT NULL DEFAULT false,
                    meeting_link TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS credit_transactions (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    type transaction_type NOT NULL,
                    amount INTEGER NOT NULL,
                    description TEXT NOT NULL,
                    package_name TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS medical_records (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    patient_id VARCHAR NOT NULL REFERENCES users(id),
                    doctor_id VARCHAR NOT NULL REFERENCES doctor_profiles(id),
                    appointment_id VARCHAR REFERENCES appointments(id),
                    diagnosis TEXT NOT NULL,
                    treatment TEXT,
                    prescriptions JSONB,
                    notes TEXT,
                    follow_up_date TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'info',
                    is_read BOOLEAN NOT NULL DEFAULT false,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS payouts (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    doctor_id VARCHAR NOT NULL REFERENCES doctor_profiles(id),
                    amount INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
                    processed_at TIMESTAMP,
                    notes TEXT
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_sessions (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id VARCHAR NOT NULL REFERENCES chat_sessions(id),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_files (
                    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id VARCHAR NOT NULL REFERENCES users(id),
                    original_name TEXT NOT NULL,
                    stored_name TEXT NOT NULL,
                    file_type TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT NOW()
                )
            """)
        self.stdout.write('  Tables created.')

    def _seed_data(self):
        with connection.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = 'admin@dentalcare.com'")
            if cur.fetchone():
                self.stdout.write('  Seed data already exists, skipping.')
                return

        now = datetime.now()
        admin_pass = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
        patient_pass = bcrypt.hashpw(b'patient123', bcrypt.gensalt()).decode()
        doctor_pass = bcrypt.hashpw(b'doctor123', bcrypt.gensalt()).decode()

        admin_id = str(uuid.uuid4())
        patient1_id = str(uuid.uuid4())
        patient2_id = str(uuid.uuid4())
        doc1_user_id = str(uuid.uuid4())
        doc2_user_id = str(uuid.uuid4())
        doc3_user_id = str(uuid.uuid4())
        doc4_user_id = str(uuid.uuid4())
        doc1_profile_id = str(uuid.uuid4())
        doc2_profile_id = str(uuid.uuid4())
        doc3_profile_id = str(uuid.uuid4())
        doc4_profile_id = str(uuid.uuid4())

        with connection.cursor() as cur:
            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, created_at) VALUES (%s,%s,%s,%s,%s,'admin',0,%s)",
                [admin_id, 'admin@dentalcare.com', admin_pass, 'Admin', 'User', now]
            )
            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'patient',15,%s,%s)",
                [patient1_id, 'sarah.johnson@email.com', patient_pass, 'Sarah', 'Johnson', '+1-555-0101', now]
            )
            cur.execute(
                "INSERT INTO credit_transactions (id, user_id, type, amount, description, package_name, created_at) VALUES (%s,%s,'purchase',15,'Welcome bonus credits','welcome',%s)",
                [str(uuid.uuid4()), patient1_id, now]
            )
            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'patient',10,%s,%s)",
                [patient2_id, 'mike.chen@email.com', patient_pass, 'Mike', 'Chen', '+1-555-0102', now]
            )
            cur.execute(
                "INSERT INTO credit_transactions (id, user_id, type, amount, description, package_name, created_at) VALUES (%s,%s,'purchase',10,'Welcome bonus credits','welcome',%s)",
                [str(uuid.uuid4()), patient2_id, now]
            )

            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'doctor',0,%s,%s)",
                [doc1_user_id, 'dr.emily.davis@dentalcare.com', doctor_pass, 'Emily', 'Davis', '+1-555-0201', now]
            )
            cur.execute(
                "INSERT INTO doctor_profiles (id, user_id, specialty, bio, license_number, years_experience, consultation_fee, rating, total_reviews, verification_status, clinic_name, clinic_address, education, total_earnings, pending_payouts, is_active, created_at) VALUES (%s,%s,%s,%s,%s,12,2,4.90,127,'approved',%s,%s,%s,48,20,true,%s)",
                [doc1_profile_id, doc1_user_id, 'Orthodontics',
                 'Specialist in braces, aligners, and jaw correction. Passionate about creating beautiful, healthy smiles for patients of all ages.',
                 'DDS-12345', 'Bright Smiles Orthodontics', '123 Dental Ave, San Francisco, CA 94102',
                 'DDS from UCSF School of Dentistry, Orthodontics Residency at UCSF', now]
            )

            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'doctor',0,%s,%s)",
                [doc2_user_id, 'dr.james.wilson@dentalcare.com', doctor_pass, 'James', 'Wilson', '+1-555-0202', now]
            )
            cur.execute(
                "INSERT INTO doctor_profiles (id, user_id, specialty, bio, license_number, years_experience, consultation_fee, rating, total_reviews, verification_status, clinic_name, clinic_address, education, total_earnings, pending_payouts, is_active, created_at) VALUES (%s,%s,%s,%s,%s,8,2,4.75,89,'approved',%s,%s,%s,36,12,true,%s)",
                [doc2_profile_id, doc2_user_id, 'Cosmetic Dentistry',
                 'Expert in teeth whitening, veneers, and smile makeovers. I believe everyone deserves a confident smile.',
                 'DDS-67890', 'Smile Studio Dental', '456 Oak Street, Los Angeles, CA 90001',
                 'DDS from UCLA School of Dentistry, Fellowship in Cosmetic Dentistry', now]
            )

            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'doctor',0,%s,%s)",
                [doc3_user_id, 'dr.sarah.patel@dentalcare.com', doctor_pass, 'Sarah', 'Patel', '+1-555-0203', now]
            )
            cur.execute(
                "INSERT INTO doctor_profiles (id, user_id, specialty, bio, license_number, years_experience, consultation_fee, rating, total_reviews, verification_status, clinic_name, clinic_address, education, total_earnings, pending_payouts, is_active, created_at) VALUES (%s,%s,%s,%s,%s,15,2,4.95,203,'approved',%s,%s,%s,24,8,true,%s)",
                [doc3_profile_id, doc3_user_id, 'Pediatric Dentistry',
                 'Dedicated to making dental visits fun and stress-free for children. Gentle approach for little smiles.',
                 'DDS-11223', 'Kids Dental Care', '789 Maple Lane, Chicago, IL 60601',
                 'DDS from Northwestern University, Pediatric Dentistry Residency at Lurie Children\'s Hospital', now]
            )

            cur.execute(
                "INSERT INTO users (id, email, password, first_name, last_name, role, credit_balance, phone, created_at) VALUES (%s,%s,%s,%s,%s,'doctor',0,%s,%s)",
                [doc4_user_id, 'dr.robert.nguyen@dentalcare.com', doctor_pass, 'Robert', 'Nguyen', '+1-555-0204', now]
            )
            cur.execute(
                "INSERT INTO doctor_profiles (id, user_id, specialty, bio, license_number, years_experience, consultation_fee, rating, total_reviews, verification_status, clinic_name, clinic_address, education, total_earnings, pending_payouts, is_active, created_at) VALUES (%s,%s,%s,%s,%s,5,3,0,0,'pending',%s,%s,%s,0,0,true,%s)",
                [doc4_profile_id, doc4_user_id, 'General Dentistry',
                 'Recent graduate with strong training in preventive and restorative dentistry. Committed to comprehensive oral health care.',
                 'DDS-99887', 'Downtown Dental', '321 Pine Street, Seattle, WA 98101',
                 'DDS from University of Washington School of Dentistry', now]
            )

            for doc_id in [doc1_profile_id, doc2_profile_id, doc3_profile_id]:
                dates = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14']
                slots_times = [('09:00', '09:30'), ('10:00', '10:30'), ('14:00', '14:30'), ('15:00', '15:30')]
                for date in dates:
                    for start, end in slots_times:
                        cur.execute(
                            "INSERT INTO availability_slots (id, doctor_id, date, start_time, end_time, status, created_at) VALUES (%s,%s,%s,%s,%s,'available',%s)",
                            [str(uuid.uuid4()), doc_id, date, start, end, now]
                        )

        self.stdout.write('  Demo data seeded.')
