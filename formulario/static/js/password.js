
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

