from datetime import timedelta
from django.db import models

# Definición del modelo Turno
class Turno(models.Model):
    id_turno = models.AutoField(primary_key=True)
    Tipo = models.CharField(max_length=100)
    horario_inicio=models.TimeField()
    horario_fin=models.TimeField()

    class Meta:
        db_table = "TURNO"
        managed = True

# Definición del modelo Nivel
class Nivel(models.Model):
    id_nivel = models.AutoField(primary_key=True)
    descrp_nivel = models.CharField(max_length=100)

    class Meta:
        db_table = "NIVEL"
        managed = True

# Definición del modelo Rol
class Rol(models.Model):
    id_rol = models.AutoField(primary_key=True)
    descrp_rol = models.CharField(max_length=100)
    
    class Meta:
        db_table = "ROL"
        managed = True
           
#Defincion del modelo de actividades en una jornada
class Actividad(models.Model):
    inicial=models.CharField(max_length=3,primary_key=True)
    descrp_actividad=models.CharField(max_length=20)
    duracion_actividad=models.TimeField()
    
    class Meta:
        db_table = "ACTIVIDAD"
        managed = True
     
# Definición del modelo Empleado
class Empleado(models.Model):
    Id_Unico = models.CharField(max_length=100, primary_key=True)
    Id_Combinado = models.CharField(max_length=20, unique=True, null=True)
    Nombre_Completo = models.CharField(max_length=100)
    Seudonimo = models.CharField(max_length=100)
    Contraseña = models.CharField(max_length=100)
    Posicion_fija = models.IntegerField()
    Correo = models.CharField(max_length=100)
    
    # Turno general obligatorio
    id_turno = models.ForeignKey(Turno, on_delete=models.CASCADE, db_column='id_turno',null=True,blank=True)

    # Turno especial opcional
    turno_especial = models.ForeignKey(
        Turno,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turno_especial'
    )

    # Relaciones con Nivel y Rol
    id_nivel = models.ForeignKey(Nivel, on_delete=models.CASCADE, db_column='id_nivel')
    id_rol = models.ForeignKey(Rol, on_delete=models.CASCADE, db_column='id_rol')

    class Meta:
        db_table = "EMPLEADO"
        managed = True


#Defincion del modelo para el directivo
class Directivo(models.Model):
    id_directivo=models.AutoField(primary_key=True)
    contraseña_acceso=models.CharField (max_length=50)
    #llave foranea
    Id_unico=models.ForeignKey(Empleado,max_length=100, on_delete=models.CASCADE,db_column="Id_unico")
    
    class Meta:
        db_table = "DIRECTIVO"
        managed = True
        
        
class SesionTiempo(models.Model):
    Id_Unico = models.ForeignKey(Empleado, on_delete=models.CASCADE, db_column="Id_Unico")
    inicial = models.ForeignKey(Actividad, on_delete=models.CASCADE,db_column="inicial")
    fecha = models.DateField(auto_now_add=True)
    cronometro = models.DurationField(default=timedelta)  # Tiempo acumulado
    excedido = models.BooleanField(default=False)
    
    
    class Meta:
        db_table = "SESION_TIEMPO"
        managed = True

    def __str__(self):
        return f"{self.Id_Unico} - {self.inicial} - {self.fecha}"
    
    
class RegistroSistema(models.Model):
    sesion = models.ForeignKey(SesionTiempo, on_delete=models.CASCADE, related_name="registros")
    evento = models.CharField(max_length=50)  # "Inició", "Pausó", "Tiempo excedido", etc.
    marca_tiempo = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    mensaje = models.TextField(blank=True)  # texto adicional como "Tiempo excedido..."

    class Meta:
        db_table = "REGISTRO_SISTEMA"
        managed = True
        
    def __str__(self):
        return f"{self.evento} - {self.marca_tiempo.strftime('%H:%M:%S')}"