from django.urls import path
from . import views

urlpatterns = [
    path('auth/register', views.register_view),
    path('auth/login', views.login_view),
    path('auth/logout', views.logout_view),
    path('auth/me', views.me_view),

    path('doctors', views.doctors_list),
    path('doctors/<str:doctor_id>', views.doctor_detail),
    path('doctors/<str:doctor_id>/slots', views.doctor_slots_list),

    path('doctor/profile', views.my_doctor_profile),
    path('doctor/slots', views.my_doctor_slots),
    path('doctor/slots/<str:slot_id>', views.delete_slot),
    path('doctor/appointments', views.my_doctor_appointments),
    path('doctor/medical-records', views.my_doctor_medical_records),
    path('doctor/patients', views.doctor_patients_list),
    path('doctor/private-notes', views.doctor_private_notes_view),
    path('doctor/private-notes/<str:note_id>', views.doctor_private_note_detail),
    path('doctor/payouts', views.my_doctor_payouts),
    path('doctor/payouts/request', views.my_doctor_payouts),

    path('patient/appointments', views.patient_appointments),
    path('patient/appointments/book', views.book_appointment),
    path('patient/appointments/<str:appointment_id>/cancel', views.cancel_appointment),
    path('patient/appointments/<str:appointment_id>/complete', views.patient_complete_appointment),
    path('patient/medical-records', views.patient_medical_records),
    path('patient/credits', views.patient_credits),
    path('patient/credits/purchase', views.purchase_credits),
    path('patient/reviews', views.patient_reviews),

    path('credit-plans', views.credit_plans_list),
    path('credit-plans/create', views.create_credit_plan),
    path('credit-plans/<str:plan_id>/update', views.update_credit_plan),
    path('credit-plans/<str:plan_id>/delete', views.delete_credit_plan),

    path('notifications', views.notifications_list),
    path('notifications/read-all', views.notifications_read_all),
    path('notifications/<str:notification_id>/read', views.notification_read),

    path('admin/stats', views.admin_stats),
    path('admin/users', views.admin_users),
    path('admin/doctors', views.admin_doctors),
    path('admin/doctors/<str:doctor_id>/verify', views.admin_verify_doctor),
    path('admin/appointments', views.admin_appointments),
    path('admin/appointments/<str:appointment_id>', views.admin_update_appointment),
    path('admin/payouts', views.admin_payouts),
    path('admin/payouts/<str:payout_id>', views.admin_update_payout),

    path('certificates/<str:filename>', views.download_certificate),

    path('chat/session', views.chat_session_view),
    path('chat/message', views.chat_message_view),
    path('chat/files', views.chat_files_view),
    path('chat/files/<str:file_id>/download', views.chat_file_download),
    path('chat/files/<str:file_id>', views.chat_file_delete),
    path('chat/patient/<str:patient_id>', views.doctor_patient_chat_view),
]
