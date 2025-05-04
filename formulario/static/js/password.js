
        document.addEventListener('DOMContentLoaded', function() {
            const togglePassword = document.querySelector('.toggle-password');
            const passwordInput = document.querySelector('#password');

            // Muestra el icono cuando se ingresa texto
            passwordInput.addEventListener('input', function() {
                if (passwordInput.value.length > 0) {
                    togglePassword.style.display = 'block'; // Muestra el icono
                } else {
                    togglePassword.style.display = 'none'; // Oculta el icono
                }
            });

            // Cambia el tipo de la contraseña entre texto y contraseña
            togglePassword.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
            });
        });



    document.addEventListener('DOMContentLoaded', function () {
        const rolSelect = document.getElementById('rol');
        const contraseña2Group = document.getElementById('contraseña2-group');

        rolSelect.addEventListener('change', function () {
            if (rolSelect.value === '4') {
                contraseña2Group.style.display = 'block';
            } else {
                contraseña2Group.style.display = 'none';
            }
        });
    });

    
    document.addEventListener('DOMContentLoaded', function () {
        const rolSelect = document.getElementById('rol');
        const grupoHorarioEspecial = document.getElementById('grupo-horario-especial');
        const horarioEspecialCheckbox = document.getElementById('horario-especial');
        const horaInicioGroup = document.getElementById('group-hora-inicio');
        const horaFinGroup = document.getElementById('group-hora-fin');
        const turnosop=document.getElementById('group-turn');
         const turnoSelect = document.getElementById("turno");
    
        // Mostrar checkbox si el rol es Agente (id 1)
        rolSelect.addEventListener('change', function () {
            if (rolSelect.value === '1') {
                grupoHorarioEspecial.style.display = 'block';
            } else {
                grupoHorarioEspecial.style.display = 'none';
                horaInicioGroup.style.display = 'none';
                horaFinGroup.style.display = 'none';
                horarioEspecialCheckbox.checked = false;
            }
        });
    
        // Mostrar/ocultar campos de hora al seleccionar el checkbox
        horarioEspecialCheckbox.addEventListener('change', function () {
            if (horarioEspecialCheckbox.checked) {
                horaInicioGroup.style.display = 'block';
                horaFinGroup.style.display = 'block';
                turnosop.style.display = 'none';
                turnoSelect.removeAttribute('required'); // No es obligatorio
            } else {
                horaInicioGroup.style.display = 'none';
                horaFinGroup.style.display = 'none';
                turnosop.style.display = 'block';
            }
        });
    });

