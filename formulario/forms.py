from django import forms
from .models import Empleado, Turno, Nivel, Rol, Directivo

class EmpleadoForm(forms.ModelForm):
    class Meta:
        model = Empleado
        fields = [
            'Nombre_Completo', 
            'Seudonimo', 
            'Id_Unico', 
            'Contraseña', 
            'Posicion_fija', 
            'Correo', 
            'id_turno', 
            'id_nivel', 
            'id_rol'
        ]

        widgets = {
            'Nombre_Completo': forms.TextInput(attrs={'class': 'form-control', 'required': True}),
            'Seudonimo': forms.TextInput(attrs={'class': 'form-control', 'required': True}),
            'Id_Unico': forms.TextInput(attrs={'class': 'form-control', 'required': True}),
            'Contraseña': forms.PasswordInput(attrs={'class': 'form-control', 'required': True}),
            'Posicion_fija': forms.NumberInput(attrs={'class': 'form-control', 'min': '1', 'required': True}),
            'Correo': forms.EmailInput(attrs={'class': 'form-control'}),
            'id_turno': forms.Select(attrs={'class': 'form-control', 'required': True}),
            'id_nivel': forms.Select(attrs={'class': 'form-control', 'required': True}),
            'id_rol': forms.Select(attrs={'class': 'form-control', 'required': True}),
        }

class DirectivoForm(forms.ModelForm):
    class Meta:
        model = Directivo
        fields = ['Id_unico', 'contraseña_acceso']

        widgets = {
            'Id_unico': forms.Select(attrs={'class': 'form-control', 'required': True}),
            'contraseña_acceso': forms.PasswordInput(attrs={'class': 'form-control', 'required': True}),
        }
