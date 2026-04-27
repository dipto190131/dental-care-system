import json
import os
import uuid
from datetime import datetime, timezone
from functools import wraps

import bcrypt
from django.db import transaction
from django.http import JsonResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import (
    Appointment, AvailabilitySlot, ChatFile, ChatMessage, ChatSession,
    CreditTransaction, DoctorPrivateNote, DoctorProfile, MedicalRecord, Notification, Payout, Review, User, CreditPlan,
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')

PATIENT_SYSTEM_PROMPT = """You are DentAI, a professional dental health assistant integrated into the DentalCare platform. You help patients understand their dental concerns before seeing a dentist.

Your structured approach:
1. Warmly greet the patient and ask about their primary concern
2. Ask targeted follow-up questions ONE AT A TIME:
   - What symptoms are you experiencing? Where exactly (upper/lower jaw, left/right, front/back)?
   - Rate your pain or discomfort on a scale of 1-10
   - How long has this been going on?
   - Any triggers? (hot drinks, cold drinks, sweet foods, biting/chewing, pressure)
   - Any swelling, bleeding gums, or visible damage?
   - Any previous dental work in that area? (fillings, crowns, root canals, extractions)
   - Any medications, allergies, or medical conditions we should know about?
3. After gathering information, suggest possible dental conditions using phrases like "this could indicate...", "this sounds like it might be...", or "based on what you've described, this may suggest..."
4. Recommend next steps with urgency level (routine appointment, soon within a week, urgent within 48 hours, or emergency care)
5. Encourage the patient to bring or upload any existing X-rays, reports, or photos to share with their dentist

SAFETY RULES - These override everything else:
- If patient mentions severe swelling spreading to the neck or face, difficulty breathing or swallowing, or high fever combined with dental pain → immediately say: "These symptoms could indicate a serious infection. Please seek emergency medical care or go to an emergency room immediately."
- Never provide a definitive diagnosis
- Always recommend professional consultation
- Be empathetic, clear, and professional
- Keep responses concise and readable — use short paragraphs or bullet points"""

DOCTOR_SYSTEM_PROMPT = """You are DentAI, a clinical decision support assistant for dental professionals on the DentalCare platform.

Your role is to assist dentists with:
- Clinical reasoning and differential diagnosis
- Treatment planning and options with evidence-based rationale
- Pharmacology reference (analgesics, antibiotics, local anaesthetics) — always note to verify with current guidelines
- Interpretation of radiographic findings described to you
- Patient communication strategies
- Referral decisions (when to refer to specialist and which specialty)
- Post-operative care instructions
- Questions about international dental standards and techniques

Guidelines:
- Use appropriate clinical terminology
- Be concise and structured — use bullet points or numbered steps when listing
- Clearly state assumptions when clinical data is incomplete
- Always note when a recommendation should be verified against current evidence-based guidelines
- Never replace clinical judgment — you are a reference tool
- If the doctor shares patient history or symptoms, ask clarifying questions before offering differential diagnoses"""


def _dt(val):
    if val is None:
        return None
    if hasattr(val, 'isoformat'):
        return val.isoformat()
    return str(val)


def serialize_user(u):
    return {
        'id': u.id,
        'email': u.email,
        'firstName': u.first_name,
        'lastName': u.last_name,
        'role': u.role,
        'creditBalance': u.credit_balance,
        'avatarUrl': u.avatar_url,
        'phone': u.phone,
        'createdAt': _dt(u.created_at),
    }


def serialize_doctor_profile(p):
    return {
        'id': p.id,
        'userId': p.user_id,
        'specialty': p.specialty,
        'bio': p.bio,
        'licenseNumber': p.license_number,
        'yearsExperience': p.years_experience,
        'consultationFee': p.consultation_fee,
        'rating': str(p.rating) if p.rating is not None else None,
        'totalReviews': p.total_reviews,
        'verificationStatus': p.verification_status,
        'verificationNotes': p.verification_notes,
        'clinicName': p.clinic_name,
        'clinicAddress': p.clinic_address,
        'education': p.education,
        'medicalCertificate': p.medical_certificate,
        'totalEarnings': p.total_earnings,
        'pendingPayouts': p.pending_payouts,
        'isActive': p.is_active,
        'createdAt': _dt(p.created_at),
    }


def serialize_slot(s):
    return {
        'id': s.id,
        'doctorId': s.doctor_id,
        'date': s.date,
        'startTime': s.start_time,
        'endTime': s.end_time,
        'status': s.status,
        'createdAt': _dt(s.created_at),
    }


def serialize_appointment(a):
    return {
        'id': a.id,
        'patientId': a.patient_id,
        'doctorId': a.doctor_id,
        'slotId': a.slot_id,
        'status': a.status,
        'notes': a.notes,
        'creditsCost': a.credits_cost,
        'isVideoCall': a.is_video_call,
        'meetingLink': a.meeting_link,
        'createdAt': _dt(a.created_at),
    }


def serialize_transaction(t):
    return {
        'id': t.id,
        'userId': t.user_id,
        'type': t.type,
        'amount': t.amount,
        'description': t.description,
        'packageName': t.package_name,
        'createdAt': _dt(t.created_at),
    }


def serialize_medical_record(r):
    doctor_data = None
    if r.doctor and r.doctor.user:
        doctor_data = {
            'id': r.doctor.id,
            'firstName': r.doctor.user.first_name,
            'lastName': r.doctor.user.last_name,
        }
    
    patient_data = None
    if r.patient:
        patient_data = {
            'id': r.patient.id,
            'firstName': r.patient.first_name,
            'lastName': r.patient.last_name,
        }
    
    return {
        'id': r.id,
        'patientId': r.patient_id,
        'doctorId': r.doctor_id,
        'appointmentId': r.appointment_id,
        'diagnosis': r.diagnosis,
        'treatment': r.treatment,
        'prescriptions': r.prescriptions,
        'notes': r.notes,
        'followUpDate': r.follow_up_date,
        'createdAt': _dt(r.created_at),
        'doctor': doctor_data,
        'patient': patient_data,
    }


def serialize_notification(n):
    return {
        'id': n.id,
        'userId': n.user_id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'isRead': n.is_read,
        'createdAt': _dt(n.created_at),
    }


def serialize_payout(p):
    return {
        'id': p.id,
        'doctorId': p.doctor_id,
        'amount': p.amount,
        'status': p.status,
        'requestedAt': _dt(p.requested_at),
        'processedAt': _dt(p.processed_at),
        'notes': p.notes,
    }


def serialize_credit_plan(cp):
    return {
        'id': cp.id,
        'name': cp.name,
        'credits': cp.credits,
        'price': cp.price,
        'description': cp.description,
        'badge': cp.badge,
        'isActive': cp.is_active,
        'displayOrder': cp.display_order,
        'createdAt': _dt(cp.created_at),
        'updatedAt': _dt(cp.updated_at),
    }


def _create_notification(user_id, title, message, notif_type='info'):
    Notification.objects.create(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False,
        created_at=datetime.now(),
    )


def require_auth(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.session.get('user_id'):
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        return view_func(request, *args, **kwargs)
    return wrapper


def require_role(*roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.session.get('user_id'):
                return JsonResponse({'error': 'Unauthorized'}, status=401)
            if request.session.get('user_role') not in roles:
                return JsonResponse({'error': 'Forbidden'}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def parse_body(request):
    try:
        return json.loads(request.body or '{}')
    except (json.JSONDecodeError, ValueError):
        return {}


@csrf_exempt
@require_http_methods(['POST'])
def register_view(request):
    # Handle both JSON and FormData
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = {
            'email': request.POST.get('email', '').strip(),
            'password': request.POST.get('password', ''),
            'firstName': request.POST.get('firstName', '').strip(),
            'lastName': request.POST.get('lastName', '').strip(),
            'role': request.POST.get('role', 'patient').strip(),
            'phone': request.POST.get('phone', '').strip() or None,
            'specialty': request.POST.get('specialty', '').strip(),
            'licenseNumber': request.POST.get('licenseNumber', '').strip(),
            'yearsExperience': request.POST.get('yearsExperience', '0').strip(),
            'bio': request.POST.get('bio', '').strip(),
            'clinicName': request.POST.get('clinicName', '').strip(),
        }
    else:
        data = parse_body(request)
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    first_name = data.get('firstName', '').strip()
    last_name = data.get('lastName', '').strip()
    role = data.get('role', 'patient').strip()
    phone = data.get('phone')

    if not email or not password or not first_name or not last_name:
        return JsonResponse({'error': 'All fields are required'}, status=400)
    if role not in ('patient', 'doctor'):
        return JsonResponse({'error': 'Invalid role'}, status=400)
    if len(password) < 6:
        return JsonResponse({'error': 'Password must be at least 6 characters'}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({'error': 'Email already registered'}, status=400)

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User.objects.create(
        id=str(uuid.uuid4()),
        email=email,
        password=hashed,
        first_name=first_name,
        last_name=last_name,
        role=role,
        credit_balance=0,
        phone=phone,
        created_at=datetime.now(),
    )

    if role == 'doctor':
        specialty = data.get('specialty', '').strip()
        license_number = data.get('licenseNumber', '').strip()
        if not specialty or not license_number:
            user.delete()
            return JsonResponse({'error': 'Specialty and license number are required for doctors'}, status=400)
        
        # Handle medical certificate file upload
        certificate_path = None
        if 'medicalCertificate' in request.FILES:
            certificate_file = request.FILES['medicalCertificate']
            if certificate_file.content_type != 'application/pdf':
                user.delete()
                return JsonResponse({'error': 'Medical certificate must be a PDF file'}, status=400)
            
            # Create uploads directory if it doesn't exist
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            
            # Save file with unique name
            cert_filename = f"certificate_{user.id}_{certificate_file.name}"
            cert_path = os.path.join(UPLOAD_DIR, cert_filename)
            with open(cert_path, 'wb+') as destination:
                for chunk in certificate_file.chunks():
                    destination.write(chunk)
            certificate_path = cert_filename
        
        verification_status = 'certificate_pending' if certificate_path else 'pending'
        
        DoctorProfile.objects.create(
            id=str(uuid.uuid4()),
            user_id=user.id,
            specialty=specialty,
            license_number=license_number,
            years_experience=data.get('yearsExperience', 0),
            bio=data.get('bio'),
            clinic_name=data.get('clinicName'),
            medical_certificate=certificate_path,
            consultation_fee=2,
            is_active=True,
            verification_status=verification_status,
            created_at=datetime.now(),
        )

    request.session['user_id'] = user.id
    request.session['user_role'] = user.role
    request.session.modified = True
    return JsonResponse({'user': serialize_user(user)}, status=201)


@csrf_exempt
@require_http_methods(['POST'])
def login_view(request):
    data = parse_body(request)
    email = data.get('email', '').strip()
    password = data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Invalid credentials'}, status=400)

    if not bcrypt.checkpw(password.encode(), user.password.encode()):
        return JsonResponse({'error': 'Invalid credentials'}, status=400)

    request.session['user_id'] = user.id
    request.session['user_role'] = user.role
    request.session.modified = True
    return JsonResponse({'user': serialize_user(user)})


@csrf_exempt
@require_http_methods(['POST'])
def logout_view(request):
    request.session.flush()
    return JsonResponse({'success': True})


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def me_view(request):
    try:
        user = User.objects.get(id=request.session['user_id'])
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)

    doctor_profile = None
    if user.role == 'doctor':
        try:
            dp = DoctorProfile.objects.get(user_id=user.id)
            doctor_profile = serialize_doctor_profile(dp)
        except DoctorProfile.DoesNotExist:
            pass

    return JsonResponse({'user': serialize_user(user), 'doctorProfile': doctor_profile})


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def doctors_list(request):
    verified_only = request.GET.get('verified') == 'true'
    qs = DoctorProfile.objects.select_related('user').all()
    if verified_only:
        qs = qs.filter(verification_status='approved')
    result = []
    for p in qs:
        d = serialize_doctor_profile(p)
        d['user'] = serialize_user(p.user)
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def doctor_detail(request, doctor_id):
    try:
        profile = DoctorProfile.objects.select_related('user').get(id=doctor_id)
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Doctor not found'}, status=404)

    slots = AvailabilitySlot.objects.filter(doctor_id=doctor_id).order_by('date', 'start_time')
    d = serialize_doctor_profile(profile)
    d['user'] = serialize_user(profile.user)
    d['slots'] = [serialize_slot(s) for s in slots]
    return JsonResponse(d)


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def doctor_slots_list(request, doctor_id):
    slots = AvailabilitySlot.objects.filter(doctor_id=doctor_id).order_by('date', 'start_time')
    return JsonResponse([serialize_slot(s) for s in slots], safe=False)


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET', 'PUT'])
def my_doctor_profile(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse(serialize_doctor_profile(profile))

    data = parse_body(request)
    allowed = ['bio', 'specialty', 'clinic_name', 'clinic_address', 'education',
               'years_experience', 'consultation_fee', 'is_active']
    camel_to_snake = {
        'bio': 'bio', 'specialty': 'specialty', 'clinicName': 'clinic_name',
        'clinicAddress': 'clinic_address', 'education': 'education',
        'yearsExperience': 'years_experience', 'consultationFee': 'consultation_fee',
        'isActive': 'is_active',
    }
    for camel, snake in camel_to_snake.items():
        if camel in data:
            setattr(profile, snake, data[camel])
    profile.save()
    return JsonResponse(serialize_doctor_profile(profile))


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET', 'POST'])
def my_doctor_slots(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    if request.method == 'GET':
        slots = AvailabilitySlot.objects.filter(doctor_id=profile.id).order_by('date', 'start_time')
        return JsonResponse([serialize_slot(s) for s in slots], safe=False)

    data = parse_body(request)
    date = data.get('date', '').strip()
    start_time = data.get('startTime', '').strip()
    end_time = data.get('endTime', '').strip()
    if not date or not start_time or not end_time:
        return JsonResponse({'error': 'date, startTime, endTime are required'}, status=400)

    slot = AvailabilitySlot.objects.create(
        id=str(uuid.uuid4()),
        doctor_id=profile.id,
        date=date,
        start_time=start_time,
        end_time=end_time,
        status='available',
        created_at=datetime.now(),
    )
    return JsonResponse(serialize_slot(slot), status=201)


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['DELETE'])
def delete_slot(request, slot_id):
    AvailabilitySlot.objects.filter(id=slot_id).delete()
    return JsonResponse({'success': True})


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET'])
def my_doctor_appointments(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    appts = Appointment.objects.filter(doctor_id=profile.id).order_by('-created_at')
    result = []
    for a in appts:
        d = serialize_appointment(a)
        try:
            patient = User.objects.get(id=a.patient_id)
            d['patient'] = serialize_user(patient)
        except User.DoesNotExist:
            d['patient'] = None
        try:
            slot = AvailabilitySlot.objects.get(id=a.slot_id)
            d['slot'] = serialize_slot(slot)
        except AvailabilitySlot.DoesNotExist:
            d['slot'] = None
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET', 'POST'])
def my_doctor_medical_records(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    if request.method == 'GET':
        records = MedicalRecord.objects.filter(doctor_id=profile.id).order_by('-created_at')
        result = []
        for r in records:
            d = serialize_medical_record(r)
            try:
                patient = User.objects.get(id=r.patient_id)
                d['patient'] = serialize_user(patient)
            except User.DoesNotExist:
                d['patient'] = None
            result.append(d)
        return JsonResponse(result, safe=False)

    data = parse_body(request)
    patient_id = data.get('patientId', '').strip()
    diagnosis = data.get('diagnosis', '').strip()
    if not patient_id or not diagnosis:
        return JsonResponse({'error': 'patientId and diagnosis are required'}, status=400)

    record = MedicalRecord.objects.create(
        id=str(uuid.uuid4()),
        patient_id=patient_id,
        doctor_id=profile.id,
        appointment_id=data.get('appointmentId'),
        diagnosis=diagnosis,
        treatment=data.get('treatment'),
        prescriptions=data.get('prescriptions'),
        notes=data.get('notes'),
        follow_up_date=data.get('followUpDate'),
        created_at=datetime.now(),
    )
    return JsonResponse(serialize_medical_record(record), status=201)


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET', 'POST'])
def my_doctor_payouts(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    if request.method == 'GET':
        payouts = Payout.objects.filter(doctor_id=profile.id).order_by('-requested_at')
        return JsonResponse([serialize_payout(p) for p in payouts], safe=False)

    data = parse_body(request)
    amount = data.get('amount', 0)
    try:
        amount = int(amount)
    except (TypeError, ValueError):
        return JsonResponse({'error': 'Invalid amount'}, status=400)
    if amount <= 0:
        return JsonResponse({'error': 'Amount must be positive'}, status=400)
    if amount > profile.pending_payouts:
        return JsonResponse({'error': 'Insufficient pending payouts'}, status=400)

    with transaction.atomic():
        payout = Payout.objects.create(
            id=str(uuid.uuid4()),
            doctor_id=profile.id,
            amount=amount,
            status='pending',
            requested_at=datetime.now(),
        )
        DoctorProfile.objects.filter(id=profile.id).update(
            pending_payouts=profile.pending_payouts - amount
        )
    return JsonResponse(serialize_payout(payout), status=201)


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['GET'])
def patient_appointments(request):
    appts = Appointment.objects.filter(patient_id=request.session['user_id']).order_by('-created_at')
    result = []
    for a in appts:
        d = serialize_appointment(a)
        try:
            dp = DoctorProfile.objects.get(id=a.doctor_id)
            d['doctorProfile'] = serialize_doctor_profile(dp)
            doctor_user = User.objects.get(id=dp.user_id)
            d['doctor'] = serialize_user(doctor_user)
        except (DoctorProfile.DoesNotExist, User.DoesNotExist):
            d['doctorProfile'] = None
            d['doctor'] = None
        try:
            slot = AvailabilitySlot.objects.get(id=a.slot_id)
            d['slot'] = serialize_slot(slot)
        except AvailabilitySlot.DoesNotExist:
            d['slot'] = None
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['POST'])
def book_appointment(request):
    data = parse_body(request)
    doctor_id = data.get('doctorId', '').strip()
    slot_id = data.get('slotId', '').strip()
    notes = data.get('notes')
    is_video_call = data.get('isVideoCall', False)

    if not doctor_id or not slot_id:
        return JsonResponse({'error': 'doctorId and slotId are required'}, status=400)

    try:
        patient = User.objects.get(id=request.session['user_id'])
    except User.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)

    try:
        doctor_profile = DoctorProfile.objects.get(id=doctor_id)
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Doctor not found'}, status=404)

    if doctor_profile.verification_status != 'approved':
        return JsonResponse({'error': 'Doctor is not verified'}, status=400)

    cost = doctor_profile.consultation_fee
    if patient.credit_balance < cost:
        return JsonResponse({'error': 'Insufficient credits'}, status=400)

    try:
        slot = AvailabilitySlot.objects.get(id=slot_id)
    except AvailabilitySlot.DoesNotExist:
        return JsonResponse({'error': 'Slot not found'}, status=404)

    if slot.status == 'booked':
        return JsonResponse({'error': 'Slot is already booked'}, status=400)

    try:
        doctor_user = User.objects.get(id=doctor_profile.user_id)
    except User.DoesNotExist:
        doctor_user = None

    meeting_link = None
    if is_video_call:
        meeting_link = f'https://meet.dental.app/room/{uuid.uuid4()}'

    with transaction.atomic():
        AvailabilitySlot.objects.filter(id=slot_id).update(status='booked')

        User.objects.filter(id=patient.id).update(credit_balance=patient.credit_balance - cost)
        CreditTransaction.objects.create(
            id=str(uuid.uuid4()),
            user_id=patient.id,
            type='deduction',
            amount=-cost,
            description=f'Appointment with Dr. {doctor_user.first_name if doctor_user else ""}',
            created_at=datetime.now(),
        )

        DoctorProfile.objects.filter(id=doctor_profile.id).update(
            total_earnings=doctor_profile.total_earnings + cost,
            pending_payouts=doctor_profile.pending_payouts + cost,
        )

        appt = Appointment.objects.create(
            id=str(uuid.uuid4()),
            patient_id=patient.id,
            doctor_id=doctor_id,
            slot_id=slot_id,
            status='confirmed',
            notes=notes,
            credits_cost=cost,
            is_video_call=bool(is_video_call),
            meeting_link=meeting_link,
            created_at=datetime.now(),
        )

    _create_notification(
        doctor_profile.user_id,
        'New Appointment Booked',
        f'{patient.first_name} {patient.last_name} has booked an appointment with you.',
        'appointment',
    )
    _create_notification(
        patient.id,
        'Appointment Confirmed',
        f'Your appointment with Dr. {doctor_user.first_name if doctor_user else ""} {doctor_user.last_name if doctor_user else ""} has been confirmed.',
        'appointment',
    )

    return JsonResponse(serialize_appointment(appt), status=201)


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['POST'])
def cancel_appointment(request, appointment_id):
    try:
        appt = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)

    if appt.patient_id != request.session['user_id'] and request.session.get('user_role') != 'admin':
        return JsonResponse({'error': 'Forbidden'}, status=403)

    refund = appt.credits_cost

    with transaction.atomic():
        Appointment.objects.filter(id=appointment_id).update(status='cancelled')
        if appt.slot_id:
            AvailabilitySlot.objects.filter(id=appt.slot_id).update(status='available')

        patient = User.objects.get(id=appt.patient_id)
        User.objects.filter(id=appt.patient_id).update(credit_balance=patient.credit_balance + refund)
        CreditTransaction.objects.create(
            id=str(uuid.uuid4()),
            user_id=appt.patient_id,
            type='refund',
            amount=refund,
            description='Appointment cancellation refund',
            created_at=datetime.now(),
        )

        try:
            dp = DoctorProfile.objects.get(id=appt.doctor_id)
            DoctorProfile.objects.filter(id=dp.id).update(
                total_earnings=max(0, dp.total_earnings - refund),
                pending_payouts=max(0, dp.pending_payouts - refund),
            )
            _create_notification(
                dp.user_id,
                'Appointment Cancelled',
                'A patient has cancelled their appointment.',
                'appointment',
            )
        except DoctorProfile.DoesNotExist:
            pass

    return JsonResponse({'success': True})


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['GET'])
def patient_medical_records(request):
    records = MedicalRecord.objects.filter(patient_id=request.session['user_id']).order_by('-created_at')
    result = []
    for r in records:
        d = serialize_medical_record(r)
        try:
            dp = DoctorProfile.objects.get(id=r.doctor_id)
            d['doctorProfile'] = serialize_doctor_profile(dp)
            doctor_user = User.objects.get(id=dp.user_id)
            d['doctor'] = serialize_user(doctor_user)
        except (DoctorProfile.DoesNotExist, User.DoesNotExist):
            d['doctorProfile'] = None
            d['doctor'] = None
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['GET'])
def patient_credits(request):
    user_id = request.session['user_id']
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    transactions = CreditTransaction.objects.filter(user_id=user_id).order_by('-created_at')
    return JsonResponse({
        'balance': user.credit_balance,
        'transactions': [serialize_transaction(t) for t in transactions],
    })


@csrf_exempt
@require_role('patient', 'admin')
@require_http_methods(['POST'])
def purchase_credits(request):
    data = parse_body(request)
    plan_id = data.get('planId', '').strip()
    
    if not plan_id:
        return JsonResponse({'error': 'planId is required'}, status=400)
    
    try:
        plan = CreditPlan.objects.get(id=plan_id, is_active=True)
    except CreditPlan.DoesNotExist:
        return JsonResponse({'error': 'Credit plan not found or inactive'}, status=400)

    user_id = request.session['user_id']
    credits = plan.credits

    with transaction.atomic():
        user = User.objects.get(id=user_id)
        User.objects.filter(id=user_id).update(credit_balance=user.credit_balance + credits)
        CreditTransaction.objects.create(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type='purchase',
            amount=credits,
            description=f'Purchased {credits} credits',
            package_name=plan.name,
            created_at=datetime.now(),
        )

    _create_notification(
        user_id,
        'Credits Purchased',
        f'Successfully added {credits} credits to your account.',
        'credits',
    )

    updated_user = User.objects.get(id=user_id)
    return JsonResponse({'success': True, 'newBalance': updated_user.credit_balance})


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def notifications_list(request):
    notifs = Notification.objects.filter(user_id=request.session['user_id']).order_by('-created_at')
    return JsonResponse([serialize_notification(n) for n in notifs], safe=False)


@csrf_exempt
@require_auth
@require_http_methods(['POST'])
def notification_read(request, notification_id):
    Notification.objects.filter(id=notification_id).update(is_read=True)
    return JsonResponse({'success': True})


@csrf_exempt
@require_auth
@require_http_methods(['POST'])
def notifications_read_all(request):
    Notification.objects.filter(user_id=request.session['user_id']).update(is_read=True)
    return JsonResponse({'success': True})


@csrf_exempt
@require_role('admin')
@require_http_methods(['GET'])
def admin_stats(request):
    from django.db.models import Count
    total_patients = User.objects.filter(role='patient').count()
    total_doctors = User.objects.filter(role='doctor').count()
    total_appointments = Appointment.objects.count()
    pending_verifications = DoctorProfile.objects.filter(verification_status='pending').count()
    completed_appointments = Appointment.objects.filter(status='completed').count()
    cancelled_appointments = Appointment.objects.filter(status='cancelled').count()
    return JsonResponse({
        'totalPatients': total_patients,
        'totalDoctors': total_doctors,
        'totalAppointments': total_appointments,
        'pendingVerifications': pending_verifications,
        'completedAppointments': completed_appointments,
        'cancelledAppointments': cancelled_appointments,
    })


@csrf_exempt
@require_role('admin')
@require_http_methods(['GET'])
def admin_users(request):
    users = User.objects.all().order_by('-created_at')
    return JsonResponse([serialize_user(u) for u in users], safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['GET'])
def admin_doctors(request):
    profiles = DoctorProfile.objects.select_related('user').all()
    result = []
    for p in profiles:
        d = serialize_doctor_profile(p)
        d['user'] = serialize_user(p.user)
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['PUT'])
def admin_verify_doctor(request, doctor_id):
    data = parse_body(request)
    status = data.get('status')
    notes = data.get('notes')
    if status not in ('approved', 'rejected'):
        return JsonResponse({'error': 'status must be approved or rejected'}, status=400)

    try:
        profile = DoctorProfile.objects.get(id=doctor_id)
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Doctor not found'}, status=404)

    profile.verification_status = status
    if notes is not None:
        profile.verification_notes = notes
    profile.save()

    title = 'Profile Approved' if status == 'approved' else 'Profile Rejected'
    msg = (
        'Congratulations! Your doctor profile has been verified. You can now accept appointments.'
        if status == 'approved'
        else f'Your profile has been rejected. Notes: {notes or "No additional notes."}'
    )
    _create_notification(profile.user_id, title, msg, 'verification')

    return JsonResponse(serialize_doctor_profile(profile))


@csrf_exempt
@require_role('admin')
@require_http_methods(['GET'])
def admin_appointments(request):
    appts = Appointment.objects.all().order_by('-created_at')
    result = []
    for a in appts:
        d = serialize_appointment(a)
        try:
            patient = User.objects.get(id=a.patient_id)
            d['patient'] = serialize_user(patient)
        except User.DoesNotExist:
            d['patient'] = None
        try:
            dp = DoctorProfile.objects.get(id=a.doctor_id)
            d['doctorProfile'] = serialize_doctor_profile(dp)
            doctor_user = User.objects.get(id=dp.user_id)
            d['doctor'] = serialize_user(doctor_user)
        except (DoctorProfile.DoesNotExist, User.DoesNotExist):
            d['doctorProfile'] = None
            d['doctor'] = None
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['PUT'])
def admin_update_appointment(request, appointment_id):
    data = parse_body(request)
    status = data.get('status')
    if status not in ('confirmed', 'completed', 'cancelled'):
        return JsonResponse({'error': 'Invalid status'}, status=400)
    try:
        appt = Appointment.objects.get(id=appointment_id)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)
    appt.status = status
    appt.save()
    if status == 'completed':
        _update_doctor_rating(appt.doctor_id)
    return JsonResponse(serialize_appointment(appt))


@csrf_exempt
@require_role('admin')
@require_http_methods(['GET'])
def admin_payouts(request):
    payouts = Payout.objects.select_related('doctor__user').all().order_by('-requested_at')
    result = []
    for p in payouts:
        d = serialize_payout(p)
        dp = p.doctor
        doc_d = serialize_doctor_profile(dp)
        doc_d['user'] = serialize_user(dp.user)
        d['doctor'] = doc_d
        result.append(d)
    return JsonResponse(result, safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['PUT'])
def admin_update_payout(request, payout_id):
    data = parse_body(request)
    status = data.get('status')
    notes = data.get('notes')
    try:
        payout = Payout.objects.get(id=payout_id)
    except Payout.DoesNotExist:
        return JsonResponse({'error': 'Payout not found'}, status=404)
    payout.status = status
    if notes is not None:
        payout.notes = notes
    payout.processed_at = datetime.now()
    payout.save()
    return JsonResponse(serialize_payout(payout))


@csrf_exempt
@require_http_methods(['GET'])
def download_certificate(request, filename):
    """Download medical certificate for admin verification"""
    try:
        cert_path = os.path.join(UPLOAD_DIR, filename)
        if not os.path.exists(cert_path):
            return JsonResponse({'error': 'Certificate not found'}, status=404)
        
        # Security check: ensure the file is in the uploads directory
        if not os.path.abspath(cert_path).startswith(os.path.abspath(UPLOAD_DIR)):
            return JsonResponse({'error': 'Invalid file path'}, status=403)
        
        return FileResponse(open(cert_path, 'rb'), content_type='application/pdf')
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def serialize_chat_message(m):
    return {
        'id': m.id,
        'sessionId': m.session_id,
        'userId': m.user_id,
        'role': m.role,
        'content': m.content,
        'createdAt': _dt(m.created_at),
    }


def serialize_chat_file(f):
    return {
        'id': f.id,
        'userId': f.user_id,
        'originalName': f.original_name,
        'storedName': f.stored_name,
        'fileType': f.file_type,
        'fileSize': f.file_size,
        'description': f.description,
        'createdAt': _dt(f.created_at),
    }


def _build_system_context(role):
    try:
        if role == 'patient':
            doctors = DoctorProfile.objects.filter(
                verification_status='approved', is_active=True
            ).select_related()[:20]
            if not doctors:
                return ''
            lines = ['\n\nSYSTEM CONTEXT — AVAILABLE DOCTORS ON THIS PLATFORM:']
            for dp in doctors:
                try:
                    doc_user = User.objects.get(id=dp.user_id)
                    name = f"Dr. {doc_user.first_name} {doc_user.last_name}"
                except User.DoesNotExist:
                    name = "Dr. Unknown"
                clinic = dp.clinic_name or 'Private Practice'
                exp = f"{dp.years_experience} yrs exp" if dp.years_experience else ''
                fee = f"{dp.consultation_fee} credits (৳{dp.consultation_fee})"
                lines.append(f"  • {name} — {dp.specialty or 'General Dentistry'}, {clinic}{', ' + exp if exp else ''}, {fee}")
            lines.append('\nWhen a patient asks for a doctor recommendation or specialist suggestion, always refer to this list and suggest relevant doctors by name, specialty, and fee. Be specific and helpful.')
            return '\n'.join(lines)
        elif role == 'doctor':
            patients_count = User.objects.filter(role='patient').count()
            return f'\n\nSYSTEM CONTEXT: This platform currently has {patients_count} registered patients.'
    except Exception:
        pass
    return ''


def _call_ai(role, history, user_message, extra_context=''):
    base_prompt = DOCTOR_SYSTEM_PROMPT if role == 'doctor' else PATIENT_SYSTEM_PROMPT
    system_prompt = base_prompt + extra_context
    messages = [{'role': 'system', 'content': system_prompt}]
    for m in history:
        messages.append({
            'role': 'user' if m['role'] == 'user' else 'assistant',
            'content': m['parts'][0],
        })
    messages.append({'role': 'user', 'content': user_message})

    groq_key = os.environ.get('GROQ_API_KEY')
    gemini_key = os.environ.get('GEMINI_API_KEY')

    if groq_key:
        from groq import Groq
        client = Groq(api_key=groq_key)
        completion = client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content

    if gemini_key:
        from google import genai
        from google.genai import types
        from google.genai.errors import ClientError
        client = genai.Client(api_key=gemini_key)
        contents = []
        for m in history:
            contents.append(types.Content(
                role=m['role'],
                parts=[types.Part(text=m['parts'][0])],
            ))
        contents.append(types.Content(role='user', parts=[types.Part(text=user_message)]))
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            max_output_tokens=1024,
        )
        for model_name in ['gemini-2.0-flash-lite', 'gemini-2.0-flash']:
            try:
                response = client.models.generate_content(
                    model=model_name, contents=contents, config=config,
                )
                return response.text
            except ClientError as e:
                if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                    continue
                raise
        raise RuntimeError('Gemini quota exceeded on all models.')

    raise ValueError('No AI API key configured. Please set GROQ_API_KEY or GEMINI_API_KEY.')


def _call_ai_with_image(role, history, user_message, image_path, image_type, extra_context=''):
    import base64
    base_prompt = DOCTOR_SYSTEM_PROMPT if role == 'doctor' else PATIENT_SYSTEM_PROMPT
    system_prompt = base_prompt + extra_context

    with open(image_path, 'rb') as f:
        image_b64 = base64.b64encode(f.read()).decode('utf-8')

    data_url = f"data:{image_type};base64,{image_b64}"

    groq_key = os.environ.get('GROQ_API_KEY')
    gemini_key = os.environ.get('GEMINI_API_KEY')

    if groq_key:
        from groq import Groq
        client = Groq(api_key=groq_key)
        messages = [{'role': 'system', 'content': system_prompt}]
        for m in history:
            messages.append({
                'role': 'user' if m['role'] == 'user' else 'assistant',
                'content': m['parts'][0],
            })
        messages.append({
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': data_url}},
                {'type': 'text', 'text': user_message},
            ],
        })
        completion = client.chat.completions.create(
            model='meta-llama/llama-4-scout-17b-16e-instruct',
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )
        return completion.choices[0].message.content

    if gemini_key:
        from google import genai
        from google.genai import types
        from google.genai.errors import ClientError
        client = genai.Client(api_key=gemini_key)
        contents = []
        for m in history:
            contents.append(types.Content(
                role=m['role'],
                parts=[types.Part(text=m['parts'][0])],
            ))
        image_part = types.Part.from_bytes(
            data=base64.b64decode(image_b64),
            mime_type=image_type,
        )
        contents.append(types.Content(
            role='user',
            parts=[image_part, types.Part(text=user_message)],
        ))
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.7,
            max_output_tokens=1024,
        )
        for model_name in ['gemini-2.0-flash', 'gemini-2.0-flash-lite']:
            try:
                response = client.models.generate_content(
                    model=model_name, contents=contents, config=config,
                )
                return response.text
            except ClientError as e:
                if '429' in str(e) or 'RESOURCE_EXHAUSTED' in str(e):
                    continue
                raise
        raise RuntimeError('Gemini quota exceeded on all models.')

    raise ValueError('No AI API key configured. Please set GROQ_API_KEY or GEMINI_API_KEY.')


def _get_or_create_session(user_id):
    session = ChatSession.objects.filter(user_id=user_id).first()
    if not session:
        session = ChatSession.objects.create(
            id=str(uuid.uuid4()),
            user_id=user_id,
            created_at=datetime.now(),
        )
    return session


@csrf_exempt
@require_auth
def chat_session_view(request):
    user_id = request.session['user_id']
    if request.method == 'GET':
        session = _get_or_create_session(user_id)
        msgs = ChatMessage.objects.filter(session_id=session.id).order_by('created_at')
        return JsonResponse({
            'sessionId': session.id,
            'messages': [serialize_chat_message(m) for m in msgs],
        })
    elif request.method == 'DELETE':
        ChatMessage.objects.filter(session__user_id=user_id).delete()
        ChatSession.objects.filter(user_id=user_id).delete()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_auth
@require_http_methods(['POST'])
def chat_message_view(request):
    user_id = request.session['user_id']
    user_role = request.session.get('user_role', 'patient')
    data = parse_body(request)
    message_text = data.get('message', '').strip()
    file_id = data.get('file_id', '').strip()
    if not message_text:
        return JsonResponse({'error': 'Message is required'}, status=400)

    session = _get_or_create_session(user_id)
    prior_msgs = list(ChatMessage.objects.filter(session_id=session.id).order_by('created_at'))

    user_msg = ChatMessage.objects.create(
        id=str(uuid.uuid4()),
        session_id=session.id,
        user_id=user_id,
        role='user',
        content=message_text,
        created_at=datetime.now(),
    )

    history = []
    for m in prior_msgs:
        history.append({
            'role': 'user' if m.role == 'user' else 'model',
            'parts': [m.content],
        })

    extra_context = _build_system_context(user_role)

    try:
        if file_id:
            try:
                chat_file = ChatFile.objects.get(id=file_id, user_id=user_id)
                image_path = os.path.join(UPLOAD_DIR, chat_file.stored_name)
                if os.path.exists(image_path) and chat_file.file_type.startswith('image/'):
                    ai_text = _call_ai_with_image(user_role, history, message_text, image_path, chat_file.file_type, extra_context)
                else:
                    ai_text = _call_ai(user_role, history, message_text, extra_context)
            except ChatFile.DoesNotExist:
                ai_text = _call_ai(user_role, history, message_text, extra_context)
        else:
            ai_text = _call_ai(user_role, history, message_text, extra_context)
    except ValueError as e:
        ai_text = f"The AI assistant is not configured. Please ask the administrator to set up an API key. ({e})"
    except Exception as e:
        import traceback
        traceback.print_exc()
        err_str = str(e)
        
        # Debug logging
        import os
        groq_key_present = 'Yes' if os.environ.get('GROQ_API_KEY') else 'No'
        gemini_key_present = 'Yes' if os.environ.get('GEMINI_API_KEY') else 'No'
        
        if 'RESOURCE_EXHAUSTED' in err_str or '429' in err_str or 'rate_limit' in err_str.lower():
            ai_text = "The AI assistant has temporarily reached its usage limit. Please try again in a minute."
        else:
            # Show detailed error for debugging
            ai_text = f"AI Error: {err_str}\n\nDebug Info:\n- GROQ_API_KEY present: {groq_key_present}\n- GEMINI_API_KEY present: {gemini_key_present}\n- Error type: {type(e).__name__}"

    ai_msg = ChatMessage.objects.create(
        id=str(uuid.uuid4()),
        session_id=session.id,
        user_id=user_id,
        role='assistant',
        content=ai_text,
        created_at=datetime.now(),
    )

    return JsonResponse({
        'userMessage': serialize_chat_message(user_msg),
        'assistantMessage': serialize_chat_message(ai_msg),
    })


@csrf_exempt
@require_auth
def chat_files_view(request):
    user_id = request.session['user_id']
    if request.method == 'GET':
        files = ChatFile.objects.filter(user_id=user_id).order_by('-created_at')
        return JsonResponse([serialize_chat_file(f) for f in files], safe=False)
    elif request.method == 'POST':
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided'}, status=400)
        uploaded = request.FILES['file']
        description = request.POST.get('description', '')
        allowed_types = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'image/dicom',
        ]
        if uploaded.content_type not in allowed_types:
            return JsonResponse({'error': 'File type not allowed. Please upload images (JPG, PNG) or PDF files.'}, status=400)
        if uploaded.size > 10 * 1024 * 1024:
            return JsonResponse({'error': 'File too large. Maximum size is 10MB.'}, status=400)

        os.makedirs(UPLOAD_DIR, exist_ok=True)
        stored_name = f"{uuid.uuid4()}_{uploaded.name}"
        file_path = os.path.join(UPLOAD_DIR, stored_name)
        with open(file_path, 'wb+') as dest:
            for chunk in uploaded.chunks():
                dest.write(chunk)

        chat_file = ChatFile.objects.create(
            id=str(uuid.uuid4()),
            user_id=user_id,
            original_name=uploaded.name,
            stored_name=stored_name,
            file_type=uploaded.content_type or 'application/octet-stream',
            file_size=uploaded.size,
            description=description,
            created_at=datetime.now(),
        )
        return JsonResponse(serialize_chat_file(chat_file), status=201)
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
@require_auth
def chat_file_download(request, file_id):
    user_id = request.session['user_id']
    user_role = request.session.get('user_role', 'patient')
    try:
        if user_role in ('doctor', 'admin'):
            chat_file = ChatFile.objects.get(id=file_id)
        else:
            chat_file = ChatFile.objects.get(id=file_id, user_id=user_id)
    except ChatFile.DoesNotExist:
        return JsonResponse({'error': 'File not found'}, status=404)

    file_path = os.path.join(UPLOAD_DIR, chat_file.stored_name)
    if not os.path.exists(file_path):
        return JsonResponse({'error': 'File not found on disk'}, status=404)

    return FileResponse(
        open(file_path, 'rb'),
        content_type=chat_file.file_type,
        as_attachment=False,
        filename=chat_file.original_name,
    )


@csrf_exempt
@require_auth
@require_http_methods(['DELETE'])
def chat_file_delete(request, file_id):
    user_id = request.session['user_id']
    try:
        chat_file = ChatFile.objects.get(id=file_id, user_id=user_id)
    except ChatFile.DoesNotExist:
        return JsonResponse({'error': 'File not found'}, status=404)

    file_path = os.path.join(UPLOAD_DIR, chat_file.stored_name)
    if os.path.exists(file_path):
        os.remove(file_path)
    chat_file.delete()
    return JsonResponse({'success': True})


@csrf_exempt
@require_role('doctor', 'admin')
@require_http_methods(['GET'])
def doctor_patient_chat_view(request, patient_id):
    try:
        patient = User.objects.get(id=patient_id)
    except User.DoesNotExist:
        return JsonResponse({'error': 'Patient not found'}, status=404)

    session = ChatSession.objects.filter(user_id=patient_id).first()
    msgs = []
    if session:
        msgs = list(ChatMessage.objects.filter(session_id=session.id).order_by('created_at'))

    files = ChatFile.objects.filter(user_id=patient_id).order_by('-created_at')

    return JsonResponse({
        'patient': serialize_user(patient),
        'messages': [serialize_chat_message(m) for m in msgs],
        'files': [serialize_chat_file(f) for f in files],
    })


def _update_doctor_rating(doctor_id):
    reviews = Review.objects.filter(doctor_id=doctor_id)
    count = reviews.count()
    if count == 0:
        DoctorProfile.objects.filter(id=doctor_id).update(rating=None, total_reviews=0)
        return
    avg = sum(r.rating for r in reviews) / count
    DoctorProfile.objects.filter(id=doctor_id).update(rating=round(avg, 2), total_reviews=count)


def serialize_review(r):
    return {
        'id': r.id,
        'patientId': r.patient_id,
        'doctorId': r.doctor_id,
        'appointmentId': r.appointment_id,
        'rating': r.rating,
        'comment': r.comment,
        'createdAt': _dt(r.created_at),
    }


@csrf_exempt
@require_role('patient')
@require_http_methods(['POST'])
def patient_complete_appointment(request, appointment_id):
    user_id = request.session['user_id']
    try:
        appt = Appointment.objects.get(id=appointment_id, patient_id=user_id)
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found'}, status=404)

    if appt.status != 'confirmed':
        return JsonResponse({'error': 'Only confirmed appointments can be marked as complete'}, status=400)

    appt.status = 'completed'
    appt.save()

    Notification.objects.create(
        id=str(uuid.uuid4()),
        user_id=user_id,
        title='Appointment completed',
        message='You have marked your appointment as completed.',
        type='success',
        is_read=False,
        created_at=datetime.now(),
    )
    try:
        dp = DoctorProfile.objects.get(id=appt.doctor_id)
        Notification.objects.create(
            id=str(uuid.uuid4()),
            user_id=dp.user_id,
            title='Appointment marked completed',
            message=f'Patient has marked the appointment as completed.',
            type='info',
            is_read=False,
            created_at=datetime.now(),
        )
    except DoctorProfile.DoesNotExist:
        pass

    return JsonResponse(serialize_appointment(appt))


@csrf_exempt
@require_role('patient')
@require_http_methods(['POST', 'GET'])
def patient_reviews(request):
    user_id = request.session['user_id']

    if request.method == 'GET':
        appointment_id = request.GET.get('appointmentId')
        if appointment_id:
            try:
                review = Review.objects.get(appointment_id=appointment_id, patient_id=user_id)
                return JsonResponse(serialize_review(review))
            except Review.DoesNotExist:
                return JsonResponse(None, safe=False)
        reviews = Review.objects.filter(patient_id=user_id).order_by('-created_at')
        return JsonResponse([serialize_review(r) for r in reviews], safe=False)

    data = parse_body(request)
    appointment_id = data.get('appointmentId', '').strip()
    doctor_id = data.get('doctorId', '').strip()
    rating = data.get('rating')
    comment = data.get('comment', '').strip()

    if not appointment_id or not doctor_id or not rating:
        return JsonResponse({'error': 'appointmentId, doctorId, and rating are required'}, status=400)

    try:
        rating = int(rating)
        if rating < 1 or rating > 5:
            raise ValueError
    except (ValueError, TypeError):
        return JsonResponse({'error': 'Rating must be 1–5'}, status=400)

    try:
        appt = Appointment.objects.get(id=appointment_id, patient_id=user_id, status='completed')
    except Appointment.DoesNotExist:
        return JsonResponse({'error': 'Appointment not found or not completed'}, status=404)

    if Review.objects.filter(appointment_id=appointment_id).exists():
        return JsonResponse({'error': 'You have already reviewed this appointment'}, status=400)

    review = Review.objects.create(
        id=str(uuid.uuid4()),
        patient_id=user_id,
        doctor_id=doctor_id,
        appointment_id=appointment_id,
        rating=rating,
        comment=comment or None,
        created_at=datetime.now(),
    )
    _update_doctor_rating(doctor_id)

    return JsonResponse(serialize_review(review), status=201)


@csrf_exempt
@require_role('doctor')
@require_http_methods(['GET'])
def doctor_patients_list(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    appts = Appointment.objects.filter(doctor_id=profile.id).select_related('patient')
    seen = set()
    patients = []
    for a in appts:
        try:
            patient = User.objects.get(id=a.patient_id)
            if patient.id not in seen:
                seen.add(patient.id)
                patients.append(serialize_user(patient))
        except User.DoesNotExist:
            pass
    return JsonResponse(patients, safe=False)


def serialize_private_note(n):
    return {
        'id': n.id,
        'doctorId': n.doctor_id,
        'patientId': n.patient_id,
        'content': n.content,
        'createdAt': _dt(n.created_at),
        'updatedAt': _dt(n.updated_at),
    }


@csrf_exempt
@require_role('doctor')
@require_http_methods(['GET', 'POST'])
def doctor_private_notes_view(request):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    if request.method == 'GET':
        patient_id = request.GET.get('patientId')
        if patient_id:
            notes = DoctorPrivateNote.objects.filter(doctor_id=profile.id, patient_id=patient_id).order_by('-updated_at')
        else:
            notes = DoctorPrivateNote.objects.filter(doctor_id=profile.id).order_by('-updated_at')
        return JsonResponse([serialize_private_note(n) for n in notes], safe=False)

    data = parse_body(request)
    patient_id = data.get('patientId', '').strip()
    content = data.get('content', '').strip()
    if not patient_id or not content:
        return JsonResponse({'error': 'patientId and content are required'}, status=400)

    note = DoctorPrivateNote.objects.create(
        id=str(uuid.uuid4()),
        doctor_id=profile.id,
        patient_id=patient_id,
        content=content,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    return JsonResponse(serialize_private_note(note), status=201)


@csrf_exempt
@require_role('doctor')
@require_http_methods(['DELETE'])
def doctor_private_note_detail(request, note_id):
    try:
        profile = DoctorProfile.objects.get(user_id=request.session['user_id'])
    except DoctorProfile.DoesNotExist:
        return JsonResponse({'error': 'Profile not found'}, status=404)

    try:
        note = DoctorPrivateNote.objects.get(id=note_id, doctor_id=profile.id)
        note.delete()
        return JsonResponse({'success': True})
    except DoctorPrivateNote.DoesNotExist:
        return JsonResponse({'error': 'Note not found'}, status=404)


@csrf_exempt
@require_auth
@require_http_methods(['GET'])
def credit_plans_list(request):
    """Get all active credit plans"""
    plans = CreditPlan.objects.filter(is_active=True).order_by('display_order')
    return JsonResponse([serialize_credit_plan(p) for p in plans], safe=False)


@csrf_exempt
@require_role('admin')
@require_http_methods(['POST'])
def create_credit_plan(request):
    """Create a new credit plan (admin only)"""
    data = parse_body(request)
    name = data.get('name', '').strip()
    credits = data.get('credits')
    price = data.get('price')
    description = data.get('description', '').strip()
    badge = data.get('badge')
    display_order = data.get('displayOrder', 0)
    
    if not name or credits is None or price is None:
        return JsonResponse({'error': 'name, credits, and price are required'}, status=400)
    
    try:
        credits = int(credits)
        price = int(price)
    except (TypeError, ValueError):
        return JsonResponse({'error': 'credits and price must be numbers'}, status=400)
    
    if credits <= 0 or price <= 0:
        return JsonResponse({'error': 'credits and price must be positive'}, status=400)
    
    plan = CreditPlan.objects.create(
        id=str(uuid.uuid4()),
        name=name,
        credits=credits,
        price=price,
        description=description or None,
        badge=badge or None,
        is_active=True,
        display_order=display_order,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    return JsonResponse(serialize_credit_plan(plan), status=201)


@csrf_exempt
@require_role('admin')
@require_http_methods(['PUT'])
def update_credit_plan(request, plan_id):
    """Update an existing credit plan (admin only)"""
    try:
        plan = CreditPlan.objects.get(id=plan_id)
    except CreditPlan.DoesNotExist:
        return JsonResponse({'error': 'Plan not found'}, status=404)
    
    data = parse_body(request)
    
    if 'name' in data:
        plan.name = data.get('name', '').strip()
    if 'credits' in data:
        try:
            plan.credits = int(data.get('credits'))
        except (TypeError, ValueError):
            return JsonResponse({'error': 'credits must be a number'}, status=400)
    if 'price' in data:
        try:
            plan.price = int(data.get('price'))
        except (TypeError, ValueError):
            return JsonResponse({'error': 'price must be a number'}, status=400)
    if 'description' in data:
        plan.description = data.get('description', '').strip() or None
    if 'badge' in data:
        plan.badge = data.get('badge') or None
    if 'isActive' in data:
        plan.is_active = bool(data.get('isActive'))
    if 'displayOrder' in data:
        try:
            plan.display_order = int(data.get('displayOrder'))
        except (TypeError, ValueError):
            plan.display_order = 0
    
    plan.updated_at = datetime.now()
    plan.save()
    return JsonResponse(serialize_credit_plan(plan))


@csrf_exempt
@require_role('admin')
@require_http_methods(['DELETE'])
def delete_credit_plan(request, plan_id):
    """Delete a credit plan (admin only) - soft delete by marking inactive"""
    try:
        plan = CreditPlan.objects.get(id=plan_id)
    except CreditPlan.DoesNotExist:
        return JsonResponse({'error': 'Plan not found'}, status=404)
    
    # Soft delete: mark as inactive instead of actually deleting
    plan.is_active = False
    plan.updated_at = datetime.now()
    plan.save()
    return JsonResponse({'success': True})
