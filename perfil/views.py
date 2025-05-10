from datetime import date, timedelta
import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from formulario.models import Empleado,Actividad, RegistroSistema,SesionTiempo, Directivo
from django.utils import timezone
from datetime import datetime, timedelta
from django.contrib.auth.hashers import check_password
from django.utils.timezone import localtime

# Create your views here.

#Plantilla inicial del agente para el menu y el footer
@login_required(login_url="login")
def home_pag(request):
    return render(request, "inicio.html")



#perfil de agente
@login_required(login_url='login')
def agent(request):
    try:
        # Usamos directamente el username del usuario autenticado
        empleado = Empleado.objects.get(Id_Combinado=request.user.username)
        return render(request, 'agente.html', {'empleado': empleado})
    except Empleado.DoesNotExist:
        # Si el empleado no existe, cerramos sesión por seguridad
        from django.contrib.auth import logout
        logout(request)
        return redirect('login')


#Cronometro del agente
def agent_timer(request):
    empleado = Empleado.objects.get(Id_Combinado=request.user.username)
    turno = empleado.turno_especial or empleado.id_turno
    hora_inicio_turno = turno.horario_inicio
   
    
    
    actividades = Actividad.objects.all()
    
    
    duraciones = []  # Lista para almacenar todas las duraciones
    for actividad in actividades:
        duraciones.append(actividad.duracion_actividad)
        
        
    registros = RegistroSistema.objects.all()
    ahora = timezone.localtime()

    return render(request, 'cronometro.html', {
        'actividades': actividades,
        'registros': registros,
        'ahora': ahora.strftime('%Y-%m-%dT%H:%M:%S'),
        'hora_inicio_turno': hora_inicio_turno,
        'duracion_actividad': duraciones,
    })


@login_required(login_url="login")
def guardar_evento(request):
    print("DEBUG Username:", request.user.username)

    if request.method == "POST":
        data = json.loads(request.body)
        actividad = data.get("inicial")
        evento = data.get("evento")
        cronometro_str = data.get("cronometro")
        hora_cliente = data.get("hora_cliente", "No proporcionada")
        retraso=data.get("tiempo_segundos")
        
        # Obtener la hora actual del servidor
        hora_actual = timezone.localtime()
        print(f"DEBUG Hora del servidor: {hora_actual}")
        print(f"DEBUG Hora del cliente: {hora_cliente}")
        
        # Convertir el cronómetro (hh:mm:ss) a segundos
        h, m, s = map(int, cronometro_str.split(":"))
        cronometro = timedelta(hours=h, minutes=m, seconds=s)

        # Obtener el empleado con Id_Combinado
        try:
            empleado = Empleado.objects.get(Id_Combinado=request.user.username)
            actividad_obj = Actividad.objects.get(inicial=actividad)

            # Crear una nueva sesión de tiempo con la fecha actual explícita
            sesion_tiempo = SesionTiempo(
                Id_Unico=empleado,
                inicial=actividad_obj,
                cronometro=cronometro,
                fecha=hora_actual.date(),  # Establecer explícitamente la fecha actual
                
            )
            
            # Si es un evento de retraso, marcar como excedido
            if evento == "retraso":
                sesion_tiempo.excedido = ((retraso/60)-5)
                
            sesion_tiempo.save()

            # Mensaje personalizado según el tipo de evento
            mensaje = f"Tiempo {evento} registrado"
            if evento == "retraso":
                # Convertir el tiempo a minutos para el mensaje
                minutos_retraso = int((cronometro.total_seconds() / 60) + 0.5)  # Redondear
                mensaje = f"Retraso de {minutos_retraso} minutos registrado"

            # Guardar el registro del evento en el sistema con la marca de tiempo actual explícita
            registro = RegistroSistema(
                sesion=sesion_tiempo,
                evento=evento,
                ip=request.META.get('REMOTE_ADDR'),
                mensaje=mensaje,
                marca_tiempo=hora_actual,  # Establecer explícitamente la marca de tiempo actual
                
            )
            registro.save()

            # Verificar que la hora se guardó correctamente
            registro_guardado = RegistroSistema.objects.get(id=registro.id)
            hora_guardada = timezone.localtime(registro_guardado.marca_tiempo)
            print(f"DEBUG Hora guardada en BD: {hora_guardada}")

            # Incluir la hora actual en la respuesta para verificación
            return JsonResponse({
                "message": "Evento guardado correctamente",
                "hora_guardada": hora_actual.strftime("%Y-%m-%d %H:%M:%S"),
                "hora_cliente": hora_cliente,
                "tipo_evento": evento
            })

        except Empleado.DoesNotExist:
            return JsonResponse({"message": "Empleado no encontrado"}, status=400)

        except Exception as e:
            return JsonResponse({"message": str(e)}, status=500)
         


#validar directivo en cronometro
def validar_directivo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            contraseña = data.get('contraseña')

            # Buscar algún directivo con esa contraseña (debes ajustar esto)
            for directivo in Directivo.objects.all():
                if contraseña==directivo.contraseña_acceso:
                    return JsonResponse({'valido': True})

            return JsonResponse({'valido': False})

        except Exception as e:
            return JsonResponse({'valido': False, 'error': str(e)})

    return JsonResponse({'valido': False, 'error': 'Método no permitido'})
    


def supervise(request):
    return render(request, 'supervisor.html')




def logout_view(request):
    logout(request)  # Elimina los datos de sesión del usuario
    return redirect('login')  # Redirige al login o a donde tú decidas

