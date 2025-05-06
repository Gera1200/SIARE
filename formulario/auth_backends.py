from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User
from .models import Empleado

class EmpleadoBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None):
        try:
            empleado = Empleado.objects.get(Id_Combinado=username)
            if empleado.Contraseña == password:
                user, created = User.objects.get_or_create(username=empleado.Id_Combinado)
                if created:
                    user.set_unusable_password()  # No se usará el auth de Django directamente
                    user.save()
                return user
        except Empleado.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
