from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials'}, status=401)
    refresh = RefreshToken.for_user(user)
    # attach server boot id so tokens become invalid after server restart
    try:
        refresh['boot'] = settings.BOOT_ID
    except Exception:
        pass
    access_token = str(refresh.access_token)
    resp = Response({'user': {'username': user.username, 'is_staff': user.is_staff}})
    # set tokens as HttpOnly cookies
    # Use SameSite=Lax and secure flag according to settings for production
    samesite_flag = 'Lax'
    secure_flag = settings.SESSION_COOKIE_SECURE
    resp.set_cookie('refresh', str(refresh), httponly=True, secure=secure_flag, samesite=samesite_flag)
    resp.set_cookie('access', access_token, httponly=True, secure=secure_flag, samesite=samesite_flag)
    return resp


@api_view(['POST'])
def logout_view(request):
    resp = Response({'detail': 'logged out'})
    resp.delete_cookie('access')
    resp.delete_cookie('refresh')
    return resp


@api_view(['GET'])
def me_view(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({'detail': 'not authenticated'}, status=401)
    return Response({'user': {'username': user.username, 'is_staff': user.is_staff}})


@api_view(['POST'])
def refresh_view(request):
    # read refresh from cookie and rotate
    raw = request.COOKIES.get('refresh')
    if not raw:
        return Response({'detail': 'no refresh token'}, status=401)
    try:
        refresh = RefreshToken(raw)
        # validate boot id to detect server restart
        token_boot = refresh.payload.get('boot')
        if hasattr(settings, 'BOOT_ID') and token_boot != settings.BOOT_ID:
            return Response({'detail': 'server restarted, token invalid'}, status=401)
        new_access = str(refresh.access_token)
        resp = Response({'detail': 'refreshed'})
        # follow same cookie flags as login
        samesite_flag = 'Lax'
        secure_flag = settings.SESSION_COOKIE_SECURE
        resp.set_cookie('access', new_access, httponly=True, secure=secure_flag, samesite=samesite_flag)
        return resp
    except Exception:
        return Response({'detail': 'invalid refresh'}, status=401)
