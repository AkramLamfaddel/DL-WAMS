from django.utils.deprecation import MiddlewareMixin
from .services import AuthService


class JWTAuthMiddleware(MiddlewareMixin):
    """Adds user_info to request from JWT token (session or header)."""

    def process_request(self, request):
        request.user_info = None

        # Try session first (web views)
        token = request.session.get('jwt_token')

        # Then try Authorization header (API calls)
        if not token:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if token:
            user_info = AuthService.verify_token(token)
            if user_info:
                request.user_info = user_info
            else:
                # Invalid token — clear session
                if 'jwt_token' in request.session:
                    del request.session['jwt_token']
