from django.contrib import admin
from .models import ActionLog


@admin.register(ActionLog)
class ActionLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_id', 'action', 'service', 'timestamp')
    list_filter = ('action', 'service', 'timestamp')
    search_fields = ('user_id', 'action', 'service')
    readonly_fields = ('timestamp',)
    ordering = ('-timestamp',)
