from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access')
        if not raw_token:
            return None
        validated_token = self.get_validated_token(raw_token)
        # reject tokens issued before the server boot id
        try:
            token_boot = validated_token.payload.get('boot')
            if hasattr(settings, 'BOOT_ID') and token_boot != settings.BOOT_ID:
                return None
        except Exception:
            pass
        return self.get_user(validated_token), validated_token
