from django.urls import path
from . import views

app_name = 'historique'

urlpatterns = [
    path('log/', views.log_action, name='log_action'),
    path('logs/', views.get_logs, name='get_logs'),
    path('stats/', views.get_stats, name='get_stats'),
    path('health/', views.health_check, name='health'),
]
