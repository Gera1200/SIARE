# Create your views here.
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from .models import Directivo, Turno,Nivel,Rol,Empleado
from .forms import EmpleadoForm,DirectivoForm
from django.contrib import messages

#acronimos para hacer la insercion en la base de datos de id-combinado
ROL_ACRONIMOS = {
    1: "A-",   # Agente
    2: "SO-",  # Supervisor Operativo
    3: "SJ-",  # Supervisor Jurídico
    4: "DI-",  # Directivo
    5: "PAS-"  # Admin del Sistema
}

# Vista para registrar a los empleados
# Vista para registrar a los empleados
def register_view(request):
    # Obtener datos para el formulario
    turnos = Turno.objects.filter()[:7]
    niveles = Nivel.objects.all()
    roles = Rol.objects.all()

    if request.method == 'POST':
        empleado_form = EmpleadoForm(request.POST)
        directivo_form = DirectivoForm(request.POST)

        if empleado_form.is_valid():
            empleado = empleado_form.save(commit=False)

            # Convertir campos a mayúsculas
            empleado.Nombre_Completo = empleado.Nombre_Completo.upper()
            empleado.Seudonimo = empleado.Seudonimo.upper()
            empleado.Id_Unico=empleado.Id_Unico.upper()

            # Obtener acrónimo según el rol
            rol_id = empleado_form.cleaned_data['id_rol'].id_rol
            acronimo = ROL_ACRONIMOS.get(rol_id, "XX")

            # Generar ID único y combinado
            ultimo_id = empleado_form.cleaned_data['Id_Unico']
            empleado.Id_Unico = ultimo_id
            empleado.Id_Combinado = f"{acronimo}{ultimo_id}"

            # Si el empleado es Agente y tiene horario especial
            if 'horario_especial' in request.POST and empleado.id_rol.id_rol == 1:
                hora_inicio = request.POST.get('hora-inicio')
                hora_fin = request.POST.get('hora-fin')
                if hora_inicio and hora_fin:
                    turno_especial = Turno.objects.create(
                        Tipo="Especial",
                        horario_inicio=hora_inicio,
                        horario_fin=hora_fin
                    )
                    empleado.turno_especial = turno_especial
            else:
                # Validación manual si NO es agente con horario especial
                if not empleado_form.cleaned_data.get('id_turno'):
                    messages.error(request, "Debe seleccionar un turno general.")
                    return render(request, 'registro.html', {
                        'turnos': turnos,
                        'niveles': niveles,
                        'roles': roles,
                        'empleado_form': empleado_form,
                        'directivo_form': directivo_form
                    })

            # Guardar el empleado
            empleado.save()

            # Si es directivo, guardar en tabla Directivo
            if 'contraseña2' in request.POST and empleado.id_rol.id_rol == 4:
                if directivo_form.is_valid():
                    directivo = directivo_form.save(commit=False)
                    directivo.Id_unico = empleado
                    directivo.save()

            # Mensaje de éxito
            messages.success(request, f"Usuario '{empleado.Id_Combinado}' registrado correctamente. ¡Recuerda este ID único, ya que lo necesitarás para acceder al sistema!")
            return redirect('login')
        else:
            messages.error(request, "Error al registrar el usuario. Verifica los datos ingresados.")
            print(empleado_form.errors)

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



#vista para iniciar sesion
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

