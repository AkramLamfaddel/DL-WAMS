from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    # Public
    path('register/',    views.register_view,    name='register'),
    path('login/',       views.login_view,        name='login'),
    path('verify/',      views.verify_token_view, name='verify'),
    path('health/',      views.health_check,      name='health'),
    path('me/',          views.me_view,           name='me'),
    # Admin only
    path('users/',                    views.list_users_view,  name='list_users'),
    path('users/<int:user_id>/role/', views.update_role_view, name='update_role'),
]
