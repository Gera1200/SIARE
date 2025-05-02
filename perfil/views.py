from django.shortcuts import render
from django.contrib.auth import logout
from django.shortcuts import redirect

# Create your views here.

def home_pag(request):
    
    return render(request, "inicio.html")


def agent(request):
    return render(request, 'agente.html')

def supervise(request):
    return render(request, 'supervisor.html')




def logout_view(request):
    logout(request)  # Elimina los datos de sesión del usuario
    return redirect('login')  # Redirige al login o a donde tú decidas

