"""
URL configuration for Siare project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from formulario import views as formulario_views
from perfil import views as perfil_views

urlpatterns = [

    #Vistas para formulario
    path('', formulario_views.login_view, name='inicio'),
    path('accounts/login/', formulario_views.login_view, name='login'),
    path('Registro/', formulario_views.register_view, name="Registro"),
    
    #vistas para agente
    path('agente/',perfil_views.agent, name="agente"),
    path('supervisor/',perfil_views.supervise, name="supervisor"),
    path("cronometro/", perfil_views.agent_timer, name="cronometro"),
    path("guardar_evento/", perfil_views.guardar_evento, name="guardar_evento"),
    path('logout/',perfil_views.logout_view, name="logout"),
    
    #vista validacion de contraseña agente/cronometro
    path('validar_directivo/', perfil_views.validar_directivo, name="validar_directivo")
    
]
