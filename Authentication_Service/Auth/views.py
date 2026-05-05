import os
import jwt
from datetime import datetime, timedelta, timezone

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, RoleUpdateSerializer


JWT_SECRET    = os.environ.get('JWT_SECRET', 'microservices-shared-secret-key-2026')
JWT_ALGORITHM = 'HS256'


def generate_token(user):
    """Generate a JWT token including the user's role."""
    payload = {
        'user_id':  user.id,
        'username': user.username,
        'email':    user.email or '',
        'role':     user.role,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _decode_token(request):
    """Decode the Bearer JWT from the request. Returns payload or None."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        return jwt.decode(auth.split(' ')[1], JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


# ─── Public Endpoints ────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user and return a JWT token."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user  = serializer.save()
        token = generate_token(user)
        return Response({
            'token':   token,
            'user':    UserSerializer(user).data,
            'message': 'Registration successful.',
        }, status=status.HTTP_201_CREATED)
    return Response({'errors': serializer.errors, 'message': 'Registration failed.'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate a user and return a JWT token."""
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'errors': serializer.errors}, status=400)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials.'}, status=401)

    if not user.check_password(password):
        return Response({'error': 'Invalid credentials.'}, status=401)

    if not user.is_active:
        return Response({'error': 'Account disabled.'}, status=403)

    token = generate_token(user)
    return Response({'token': token, 'user': UserSerializer(user).data, 'message': 'Login successful.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token_view(request):
    """Verify a JWT token. Used by other microservices for inter-service auth."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return Response({'valid': False, 'error': 'No token provided.'}, status=401)

    token = auth.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user    = User.objects.get(id=payload['user_id'])
        return Response({
            'valid':    True,
            'user_id':  user.id,
            'username': user.username,
            'email':    user.email or '',
            'role':     user.role,
        })
    except jwt.ExpiredSignatureError:
        return Response({'valid': False, 'error': 'Token expired.'}, status=401)
    except (jwt.InvalidTokenError, User.DoesNotExist):
        return Response({'valid': False, 'error': 'Invalid token.'}, status=401)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint for Consul and Traefik."""
    return Response({'status': 'healthy', 'service': 'auth-service'})


# ─── Admin-Only Endpoints ────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def list_users_view(request):
    """List all users. Admin only."""
    payload = _decode_token(request)
    if not payload:
        return Response({'error': 'Authentication required.'}, status=401)
    if payload.get('role') != 'admin':
        return Response({'error': 'Admin access required.'}, status=403)

    users = User.objects.all().order_by('-date_joined')
    return Response(UserSerializer(users, many=True).data)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def update_role_view(request, user_id):
    """Update a user's role. Admin only."""
    payload = _decode_token(request)
    if not payload:
        return Response({'error': 'Authentication required.'}, status=401)
    if payload.get('role') != 'admin':
        return Response({'error': 'Admin access required.'}, status=403)

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    serializer = RoleUpdateSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(UserSerializer(user).data)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def me_view(request):
    """Return the currently authenticated user's profile."""
    payload = _decode_token(request)
    if not payload:
        return Response({'error': 'Authentication required.'}, status=401)
    try:
        user = User.objects.get(id=payload['user_id'])
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)
