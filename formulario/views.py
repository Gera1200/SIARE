from urllib import request
from django.shortcuts import render

# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .models import Directivo, Turno,Nivel,Rol,Empleado
from .forms import EmpleadoForm,DirectivoForm
from django.contrib import messages


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        try:
            empleado = Empleado.objects.get(Id_Combinado=username)

            if empleado.Contraseña == password:
                request.session['empleado_id'] = empleado.Id_Unico
                
                id_acortado = empleado.Id_Combinado[:2]

                # Redirigir según las iniciales del Id_Combinado
                if id_acortado == "A-":
                    return redirect('agente')
                elif id_acortado == "SO":
                    return redirect('supervisor')
                elif id_acortado == "SJ":
                    return redirect('supervisor_juridico')
                elif id_acortado == "DI":
                    return redirect('directivo')
                elif id_acortado == "PA":
                    return redirect('admin')
                else:
                    return redirect('login')  # Valor no reconocido

            else:
                messages.error(request, 'Usuario o contraseña incorrectos.')
        except Empleado.DoesNotExist:
            messages.error(request, 'Usuario no encontrado.')
    
    return render(request, 'login.html')

       

ROL_ACRONIMOS = {
    1: "A-",   # Agente
    2: "SO-",  # Supervisor Operativo
    3: "SJ-",  # Supervisor Jurídico
    4: "DI-",  # Directivo
    5: "PAS-"  # Admin del Sistema
}

def register_view(request):
    turnos = Turno.objects.all()
    niveles = Nivel.objects.all()
    roles = Rol.objects.all()

    if request.method == 'POST':
        empleado_form = EmpleadoForm(request.POST)
        directivo_form = DirectivoForm(request.POST)

        if empleado_form.is_valid():
            empleado = empleado_form.save(commit=False)

            # Obtener el acrónimo según el rol
            rol_id = empleado_form.cleaned_data['id_rol'].id_rol
            acronimo = ROL_ACRONIMOS.get(rol_id, "XX")  # XX si no lo encuentra

            # Generar Id_Unico
            ultimo_id = empleado_form.cleaned_data['Id_Unico']
            empleado.Id_Unico = ultimo_id  

            # Generar Id_Combinado (si deseas algún formato específico)
            empleado.Id_Combinado = f"{acronimo}{ultimo_id}"

            # Guardar el empleado
            empleado.save()

            # Si el rol es Directivo, guardar también en la tabla Directivo
            if 'contraseña2' in request.POST and empleado.id_rol.id_rol == 4:
                if directivo_form.is_valid():
                    directivo = directivo_form.save(commit=False)
                    directivo.Id_unico = empleado
                    directivo.save()

            # Mensaje de éxito
            messages.success(request, f"Usuario '{empleado.Id_Unico}' registrado correctamente.")
            return redirect('login')
        else:
            # Mensaje de error si el formulario del empleado no es válido
            messages.error(request, "Error al registrar el usuario. Verifica los datos ingresados.")
    else:
        empleado_form = EmpleadoForm()
        directivo_form = DirectivoForm()

    return render(request, 'registro.html', {
        'turnos': turnos,
        'niveles': niveles,
        'roles': roles,
        'empleado_form': empleado_form,
        'directivo_form': directivo_form
    })




