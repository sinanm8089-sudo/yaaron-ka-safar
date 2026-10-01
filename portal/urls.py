from django.urls import path

from . import views


urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('admin/', views.admin_section, {'section': 'home'}, name='admin-home'),
    path('admin/import/', views.student_import, name='student-import'),
    path('student/', views.student_section, {'section': 'home'}, name='student-home'),
    path('principal/', views.principal_section, {'section': 'home'}, name='principal-home'),
    path('admin/<slug:section>/', views.admin_section, name='admin-section'),
    path('admin/students/new/', views.student_create, name='student-create'),
    path('admin/students/<uuid:student_id>/', views.student_detail, name='student-detail'),
    path('admin/students/<uuid:student_id>/password/', views.student_password, name='student-password'),
    path('admin/students/<uuid:student_id>/delete/', views.student_delete, name='student-delete'),
    path('admin/students/<uuid:student_id>/payments/', views.payment_create, name='payment-create'),
    path('admin/payments/<uuid:payment_id>/delete/', views.payment_delete, name='payment-delete'),
    path('admin/photos/upload/', views.photo_upload, name='photo-upload'),
    path('admin/activities/<uuid:activity_id>/status/', views.activity_status, name='activity-status'),
    path('admin/attendance/<uuid:activity_id>/start/', views.attendance_start, name='attendance-start'),
    path('admin/attendance/sessions/<uuid:session_id>/close/', views.attendance_close, name='attendance-close'),
    path('admin/attendance-requests/<uuid:request_id>/review/', views.attendance_request_review, name='attendance-request-review'),
    path('admin/student-reports/<uuid:report_id>/review/', views.student_report_review, name='student-report-review'),
    path('student/<slug:section>/', views.student_section, name='student-section'),
    path('student/attendance/mark/', views.attendance_mark, name='attendance-mark'),
    path('student/attendance-request/submit/', views.attendance_request_submit, name='attendance-request-submit'),
    path('student/report/submit/', views.student_report_submit, name='student-report-submit'),
    path('principal/<slug:section>/', views.principal_section, name='principal-section'),
]