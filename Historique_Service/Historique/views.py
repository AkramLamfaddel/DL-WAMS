import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import ActionLog


@csrf_exempt
@require_http_methods(["POST"])
def log_action(request):
    """
    POST /api/history/log/
    Body: { "user_id": int, "action": str, "details": dict, "service": str }

    Called by other microservices (Gallery, Auth, AI) to record user actions.
    """
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    user_id = data.get('user_id')
    action = data.get('action', 'other')
    details = data.get('details', {})
    service = data.get('service', 'unknown')

    if not user_id:
        return JsonResponse({'error': 'user_id is required.'}, status=400)

    log_entry = ActionLog.objects.create(
        user_id=user_id,
        action=action,
        details=details,
        service=service,
    )

    return JsonResponse({
        'status': 'logged',
        'id': log_entry.id,
        'timestamp': log_entry.timestamp.isoformat(),
    }, status=201)


@require_http_methods(["GET"])
def get_logs(request):
    """
    GET /api/history/logs/
    Query params:
        ?user_id=<int>      — filter by user
        ?action=<str>       — filter by action type
        ?service=<str>      — filter by source service
        ?limit=<int>        — max results (default 50)
        ?offset=<int>       — pagination offset (default 0)

    Returns the audit trail for the frontend History page.
    """
    qs = ActionLog.objects.all()

    # Filters
    user_id = request.GET.get('user_id')
    if user_id:
        qs = qs.filter(user_id=int(user_id))

    action = request.GET.get('action')
    if action:
        qs = qs.filter(action=action)

    service = request.GET.get('service')
    if service:
        qs = qs.filter(service=service)

    # Pagination
    limit = min(int(request.GET.get('limit', 50)), 200)
    offset = int(request.GET.get('offset', 0))

    total = qs.count()
    logs = qs[offset:offset + limit]

    data = [
        {
            'id': log.id,
            'user_id': log.user_id,
            'action': log.action,
            'action_display': log.get_action_display(),
            'details': log.details,
            'service': log.service,
            'timestamp': log.timestamp.isoformat(),
        }
        for log in logs
    ]

    return JsonResponse({
        'total': total,
        'limit': limit,
        'offset': offset,
        'logs': data,
    })


@require_http_methods(["GET"])
def get_stats(request):
    """
    GET /api/history/stats/
    Returns summary counts of actions grouped by type.
    """
    from django.db.models import Count

    qs = ActionLog.objects.all()

    user_id = request.GET.get('user_id')
    if user_id:
        qs = qs.filter(user_id=int(user_id))

    counts = qs.values('action').annotate(count=Count('id')).order_by('-count')

    stats = {item['action']: item['count'] for item in counts}
    stats['total'] = qs.count()

    return JsonResponse(stats)


@require_http_methods(["GET"])
def health_check(request):
    """
    GET /api/health/
    Simple health check for service discovery.
    """
    return JsonResponse({
        'service': 'Historique_Service',
        'status': 'healthy',
    })
