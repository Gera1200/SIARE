# Generated by Django 5.0.7 on 2025-05-11 04:55

import datetime
import django.db.models.deletion
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Actividad',
            fields=[
                ('inicial', models.CharField(max_length=3, primary_key=True, serialize=False)),
                ('descrp_actividad', models.CharField(max_length=20)),
                ('duracion_actividad', models.TimeField()),
            ],
            options={
                'db_table': 'ACTIVIDAD',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Empleado',
            fields=[
                ('Id_Unico', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('Id_Combinado', models.CharField(max_length=20, null=True, unique=True)),
                ('Nombre_Completo', models.CharField(max_length=100)),
                ('Seudonimo', models.CharField(max_length=100)),
                ('Contraseña', models.CharField(max_length=100)),
                ('Posicion_fija', models.IntegerField()),
                ('Correo', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'EMPLEADO',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Nivel',
            fields=[
                ('id_nivel', models.AutoField(primary_key=True, serialize=False)),
                ('descrp_nivel', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'NIVEL',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Rol',
            fields=[
                ('id_rol', models.AutoField(primary_key=True, serialize=False)),
                ('descrp_rol', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'ROL',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Turno',
            fields=[
                ('id_turno', models.AutoField(primary_key=True, serialize=False)),
                ('Tipo', models.CharField(max_length=100)),
                ('horario_inicio', models.TimeField()),
                ('horario_fin', models.TimeField()),
            ],
            options={
                'db_table': 'TURNO',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='Directivo',
            fields=[
                ('id_directivo', models.AutoField(primary_key=True, serialize=False)),
                ('contraseña_acceso', models.CharField(max_length=50)),
                ('Id_unico', models.ForeignKey(db_column='Id_unico', max_length=100, on_delete=django.db.models.deletion.CASCADE, to='formulario.empleado')),
            ],
            options={
                'db_table': 'DIRECTIVO',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='EstadoCronometro',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('empleado_id', models.CharField(max_length=100)),
                ('fecha', models.DateField()),
                ('datos', models.TextField()),
                ('ultima_actualizacion', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'ESTADO_CRONOMETRO',
                'managed': True,
                'unique_together': {('empleado_id', 'fecha')},
            },
        ),
        migrations.AddField(
            model_name='empleado',
            name='id_nivel',
            field=models.ForeignKey(db_column='id_nivel', on_delete=django.db.models.deletion.CASCADE, to='formulario.nivel'),
        ),
        migrations.AddField(
            model_name='empleado',
            name='id_rol',
            field=models.ForeignKey(db_column='id_rol', on_delete=django.db.models.deletion.CASCADE, to='formulario.rol'),
        ),
        migrations.CreateModel(
            name='SesionTiempo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha', models.DateField(default=django.utils.timezone.now)),
                ('cronometro', models.DurationField(default=datetime.timedelta)),
                ('excedido', models.IntegerField(blank=True, null=True)),
                ('Id_Unico', models.ForeignKey(db_column='Id_Unico', on_delete=django.db.models.deletion.CASCADE, to='formulario.empleado')),
                ('inicial', models.ForeignKey(db_column='inicial', on_delete=django.db.models.deletion.CASCADE, to='formulario.actividad')),
            ],
            options={
                'db_table': 'SESION_TIEMPO',
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='RegistroSistema',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('evento', models.CharField(max_length=50)),
                ('marca_tiempo', models.DateTimeField(default=django.utils.timezone.localtime)),
                ('ip', models.GenericIPAddressField(blank=True, null=True)),
                ('mensaje', models.TextField(blank=True)),
                ('sesion', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='registros', to='formulario.sesiontiempo')),
            ],
            options={
                'db_table': 'REGISTRO_SISTEMA',
                'managed': True,
            },
        ),
        migrations.AddField(
            model_name='empleado',
            name='id_turno',
            field=models.ForeignKey(blank=True, db_column='id_turno', null=True, on_delete=django.db.models.deletion.CASCADE, to='formulario.turno'),
        ),
        migrations.AddField(
            model_name='empleado',
            name='turno_especial',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='turno_especial', to='formulario.turno'),
        ),
    ]
