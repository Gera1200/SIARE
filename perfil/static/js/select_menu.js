document.addEventListener('DOMContentLoaded', function() {
    // Obtener el dropdown
    const dropdown = document.querySelector('.custom-dropdown');
    const dropdownHeader = dropdown.querySelector('.dropdown-header');
    const dropdownContent = dropdown.querySelector('.dropdown-content');
    const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
    
    // Mostrar/ocultar el dropdown al hacer clic en el header
    dropdownHeader.addEventListener('click', function(e) {
        e.preventDefault();
        dropdownContent.classList.toggle('show');
    });
    
    // Cerrar el dropdown cuando se hace clic fuera de él
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });
    
    // Manejar la selección de elementos
    dropdownItems.forEach(item => {
        item.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            // Llamar a la función original
            navegarHorario(value);
            // Cerrar el dropdown
            dropdownContent.classList.remove('show');
        });
    });
    
    // Función original (mantenida para compatibilidad)
    function navegarHorario(value) {
        if (value) {
            window.location.href = value;
        }
    }
});