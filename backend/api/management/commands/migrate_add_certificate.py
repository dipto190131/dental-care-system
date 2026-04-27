import sys
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Add medical_certificate column to doctor_profiles table'

    def handle(self, *args, **options):
        self.stdout.write('Adding medical_certificate column...')
        try:
            with connection.cursor() as cur:
                # Check if the column already exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns
                        WHERE table_name = 'doctor_profiles'
                        AND column_name = 'medical_certificate'
                    );
                """)
                exists = cur.fetchone()[0]
                
                if exists:
                    self.stdout.write(self.style.WARNING('Column already exists, skipping...'))
                    return
                
                # Add the column
                cur.execute("""
                    ALTER TABLE doctor_profiles
                    ADD COLUMN medical_certificate TEXT
                """)
                
                # Update the verification_status enum if needed
                cur.execute("""
                    DO $$ BEGIN
                        ALTER TYPE verification_status ADD VALUE 'certificate_pending';
                    EXCEPTION WHEN duplicate_object THEN null;
                    END $$;
                """)
                
                self.stdout.write(self.style.SUCCESS('Migration completed successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Migration failed: {str(e)}'))
            sys.exit(1)
