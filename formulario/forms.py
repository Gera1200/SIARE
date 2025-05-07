from django import forms
from .models import Empleado, Directivo

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
            'turno_especial',
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
            'id_turno': forms.Select(attrs={'required': False}),
            'turno_especial': forms.Select(attrs={'class': 'form-control'}),  # Opcional
            'id_nivel': forms.Select(attrs={'class': 'form-control', 'required': True}),
            'id_rol': forms.Select(attrs={'class': 'form-control', 'required': True}),
        }

    def __init__(self, *args, **kwargs):
        super(EmpleadoForm, self).__init__(*args, **kwargs)
        self.fields['turno_especial'].required = False
        self.fields['turno_especial'].label = 'Turno Especial (opcional)'

class DirectivoForm(forms.ModelForm):
    class Meta:
        model = Directivo
        fields = ['contraseña_acceso']
        widgets = {
            'contraseña_acceso': forms.PasswordInput(attrs={'class': 'form-control', 'required': True}),
        }

    
