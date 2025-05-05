from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required
from formulario.models import Empleado

# Create your views here.

@login_required(login_url="login")
def home_pag(request):
    return render(request, "inicio.html")



def agent(request):
    empleado_id = request.session.get('empleado_id')

    if not empleado_id:
        return redirect('login')  # Si no hay sesión, redirige al login

    try:
        empleado = Empleado.objects.get(Id_Unico=empleado_id)
    except Empleado.DoesNotExist:
        return redirect('login')  # Por seguridad

    return render(request, 'agente.html', {
        'empleado': empleado
    })

def agent_timer(request):
    
    return render(request,'cronometro.html')





def supervise(request):
    return render(request, 'supervisor.html')




def logout_view(request):
    logout(request)  # Elimina los datos de sesión del usuario
    return redirect('login')  # Redirige al login o a donde tú decidas

