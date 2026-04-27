from django.db import models


class User(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    email = models.TextField(unique=True)
    password = models.TextField()
    first_name = models.TextField()
    last_name = models.TextField()
    role = models.CharField(max_length=20, default='patient')
    credit_balance = models.IntegerField(default=0)
    avatar_url = models.TextField(null=True, blank=True)
    phone = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'users'


class DoctorProfile(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    specialty = models.TextField()
    bio = models.TextField(null=True, blank=True)
    license_number = models.TextField()
    years_experience = models.IntegerField(default=0)
    consultation_fee = models.IntegerField(default=2)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    total_reviews = models.IntegerField(default=0)
    verification_status = models.CharField(max_length=20, default='pending')
    verification_notes = models.TextField(null=True, blank=True)
    clinic_name = models.TextField(null=True, blank=True)
    clinic_address = models.TextField(null=True, blank=True)
    education = models.TextField(null=True, blank=True)
    medical_certificate = models.TextField(null=True, blank=True)
    total_earnings = models.IntegerField(default=0)
    pending_payouts = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'doctor_profiles'


class AvailabilitySlot(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id')
    date = models.TextField()
    start_time = models.TextField()
    end_time = models.TextField()
    status = models.CharField(max_length=20, default='available')
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'availability_slots'


class Appointment(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, db_column='patient_id', related_name='patient_appointments')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id', related_name='doctor_appointments')
    slot = models.ForeignKey(AvailabilitySlot, on_delete=models.SET_NULL, null=True, db_column='slot_id')
    status = models.CharField(max_length=20, default='pending')
    notes = models.TextField(null=True, blank=True)
    credits_cost = models.IntegerField(default=2)
    is_video_call = models.BooleanField(default=False)
    meeting_link = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'appointments'


class CreditTransaction(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    type = models.CharField(max_length=20)
    amount = models.IntegerField()
    description = models.TextField()
    package_name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'credit_transactions'


class MedicalRecord(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, db_column='patient_id', related_name='patient_records')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id', related_name='doctor_records')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, db_column='appointment_id')
    diagnosis = models.TextField()
    treatment = models.TextField(null=True, blank=True)
    prescriptions = models.JSONField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    follow_up_date = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'medical_records'


class Notification(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    title = models.TextField()
    message = models.TextField()
    type = models.TextField(default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'notifications'


class Payout(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id')
    amount = models.IntegerField()
    status = models.CharField(max_length=20, default='pending')
    requested_at = models.DateTimeField(null=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'payouts'


class Review(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    patient = models.ForeignKey(User, on_delete=models.CASCADE, db_column='patient_id')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, db_column='appointment_id', unique=True)
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'reviews'


class DoctorPrivateNote(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, db_column='doctor_id')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, db_column='patient_id')
    content = models.TextField()
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'doctor_private_notes'


class ChatSession(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'chat_sessions'


class ChatMessage(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, db_column='session_id')
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    role = models.TextField()
    content = models.TextField()
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'chat_messages'


class ChatFile(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id')
    original_name = models.TextField()
    stored_name = models.TextField()
    file_type = models.TextField()
    file_size = models.IntegerField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'chat_files'


class CreditPlan(models.Model):
    id = models.CharField(max_length=36, primary_key=True)
    name = models.TextField()
    credits = models.IntegerField()
    price = models.IntegerField()
    description = models.TextField(null=True, blank=True)
    badge = models.TextField(null=True, blank=True)  # e.g., "Most Popular", "Best Value"
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        managed = False
        db_table = 'credit_plans'
