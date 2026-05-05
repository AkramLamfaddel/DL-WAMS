from functools import wraps
from django.shortcuts import redirect
from django.http import JsonResponse


def login_required_gallery(view_func):
    """Requires user to be authenticated via JWT."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not getattr(request, 'user_info', None):
            if request.path.startswith('/api/'):
                return JsonResponse({'error': 'Authentication required.'}, status=401)
            return redirect('gallery:login')
        return view_func(request, *args, **kwargs)
    return wrapper
