from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.analyze_image, name='analyze'),
    path('health/', views.health_check, name='health'),
    path('status/', views.model_status, name='status'),
]
