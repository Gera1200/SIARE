from django.db import models

# Definición del modelo Turno
class Turno(models.Model):
    id_turno = models.AutoField(primary_key=True)
    Tipo = models.CharField(max_length=100)
    horario_inicio=models.DateTimeField()
    horario_fin=models.DateTimeField()

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

# Definición del modelo Empleado
class Empleado(models.Model):
    Id_Unico = models.CharField(max_length=100, primary_key=True)
    Id_Combinado = models.CharField(max_length=20, unique=True, null=True)
    Nombre_Completo = models.CharField(max_length=100)
    Seudonimo = models.CharField(max_length=100)
    Contraseña = models.CharField(max_length=100)
    Posicion_fija = models.DecimalField(max_digits=38, decimal_places=0)
    Correo = models.CharField(max_length=100)
    
    # Relaciones con Nivel y Rol también deben ser ForeignKey
    id_turno = models.ForeignKey(Turno, on_delete=models.CASCADE, db_column='id_turno')
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