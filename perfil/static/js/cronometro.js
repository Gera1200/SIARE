const { guardarEventoURL, csrfToken } = window.appConfig;

let timers = {};
let activeActivity = null;
let lateTimer = null; // Contador de retraso
let earlyTimer = null; // Contador para inicio temprano

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer(activity) {
    const normalizedActivity = activity.replace('/', '-');
    
    // Si ya hay un timer activo para esta actividad, no hacer nada
    if (timers[normalizedActivity] && timers[normalizedActivity].interval) {
        return;
    }

    // Si hay otra actividad activa, detenerla primero
    if (activeActivity && activeActivity !== normalizedActivity) {
        stopTimer(activeActivity.replace('-', '/'));
    }
    
    activeActivity = normalizedActivity;

    // Inicializar el timer si no existe
    if (!timers[normalizedActivity]) {
        timers[normalizedActivity] = { time: 0, interval: null };
    }

    // Iniciar el intervalo
    timers[normalizedActivity].interval = setInterval(() => {
        timers[normalizedActivity].time += 1;
        const timeString = formatTime(timers[normalizedActivity].time);
        document.querySelector(`#${normalizedActivity}-timer`).value = timeString;
    }, 1000);
    
    // Registrar el evento de inicio
    registrarEvento(activity, "Inicio", formatTime(timers[normalizedActivity].time));
    updateStatus(activity, "Iniciado");
}

function stopTimer(activity) {
    const normalizedActivity = activity.replace('/', '-');
    
    if (!timers[normalizedActivity] || !timers[normalizedActivity].interval) return;

    clearInterval(timers[normalizedActivity].interval);
    timers[normalizedActivity].interval = null;
    
    if (activeActivity === normalizedActivity) {
        activeActivity = null;
    }

    const timeString = formatTime(timers[normalizedActivity].time);
    document.querySelector(`#${normalizedActivity}-timer`).value = timeString;
    
    registrarEvento(activity, "Pausa", timeString);
    updateStatus(activity, "Pausado");
}

// Función para iniciar el contador de retraso o inicio temprano
function startDeviationTimer(isLate) {
    const timerObj = isLate ? lateTimer : earlyTimer;
    const timerName = isLate ? "lateTimer" : "earlyTimer";
    
    if (timerObj && timerObj.interval) {
        return; // Ya está corriendo
    }
    
    if (!window[timerName]) {
        window[timerName] = { time: 0, interval: null };
    }
    
    window[timerName].interval = setInterval(() => {
        window[timerName].time += 1;
        const timeString = formatTime(window[timerName].time);
        // Mostrar el tiempo de desviación en la tabla de tiempos faltantes
        const timeElement = document.getElementById('J-remaining');
        if (timeElement) {
            timeElement.value = timeString;
            timeElement.classList.add(isLate ? 'late-time' : 'early-time');
        }
    }, 1000);
    
    console.log(`Contador de ${isLate ? 'retraso' : 'inicio temprano'} iniciado`);
}

// Función para detener el contador de desviación
function stopDeviationTimer(isLate) {
    const timerObj = isLate ? lateTimer : earlyTimer;
    const timerName = isLate ? "lateTimer" : "earlyTimer";
    
    if (!window[timerName] || !window[timerName].interval) return;
    
    clearInterval(window[timerName].interval);
    window[timerName].interval = null;
    
    console.log(`Contador de ${isLate ? 'retraso' : 'inicio temprano'} detenido`);
}

function registrarEvento(actividad, evento, tiempo) {
    // Convertir "C/R" a "CR" para coincidir con la BD
    const actividadBD = actividad === 'C/R' ? 'CR' : actividad;
    
    const requestData = {
        inicial: actividadBD,
        evento: evento,
        cronometro: tiempo
    };
    
    console.log("Datos a enviar:", requestData);
    
    fetch(guardarEventoURL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        console.log("Éxito:", data);
        updateStatus(actividad, "Guardado correctamente");
    })
    .catch(error => {
        console.error("Error detallado:", error);
        updateStatus(actividad, `Error: ${error.message || 'Desconocido'}`);
    });
}

function updateStatus(actividad, mensaje) {
    const normalizedActivity = actividad.replace('/', '-');
    const statusElement = document.querySelector(`#${normalizedActivity}-status`);
    if (statusElement) {
        statusElement.textContent = mensaje;
        setTimeout(() => {
            statusElement.textContent = "";
        }, 3000);
    }
}

// Función para validar la contraseña del directivo usando la API existente
function validarContraseñaDirectivo(password) {
    return fetch('/validar_directivo/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ password: password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error en la validación');
        }
        return response.json();
    })
    .then(data => {
        if (data.valid) {
            return true;
        } else {
            throw new Error(data.message || 'Contraseña incorrecta');
        }
    });
}

// Event listeners para botones de inicio
document.querySelectorAll(".btn-inicio").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").dataset.inicial;
        
        if (actividad === "J") {
            const now = new Date();
            const [h, m, s] = window.configHoras.horaInicioPermitida.split(":");
            const horaPermitida = new Date();
            horaPermitida.setHours(parseInt(h), parseInt(m), parseInt(s));
            
            // Hora límite para llegada tardía (hora permitida + 5 minutos)
            const horaLimiteTarde = new Date(horaPermitida.getTime() + 5 * 60000);
            
            // Hora límite para llegada temprana (hora permitida - 5 minutos)
            const horaLimiteTemprana = new Date(horaPermitida.getTime() - 5 * 60000);
            
            console.log("Hora actual:", now.toLocaleTimeString());
            console.log("Hora permitida:", horaPermitida.toLocaleTimeString());
            console.log("Límite temprano:", horaLimiteTemprana.toLocaleTimeString());
            console.log("Límite tardío:", horaLimiteTarde.toLocaleTimeString());
            
            // Verificar si es demasiado temprano o demasiado tarde
            const esTemprano = now < horaLimiteTemprana;
            const esTarde = now > horaLimiteTarde;
            
            if (esTemprano || esTarde) {
                // Iniciar contador de desviación apropiado
                if (esTarde) {
                    startDeviationTimer(true); // Es tarde
                    updateStatus(actividad, "Llegada tardía - Se requiere autorización");
                } else {
                    startDeviationTimer(false); // Es temprano
                    updateStatus(actividad, "Llegada temprana - Se requiere autorización");
                }
                
                // Mostrar campo de contraseña
                const authDiv = btn.closest("td").querySelector(".auth-container");
                if (authDiv) {
                    authDiv.style.display = "block";
                }
                return; // detener la ejecución normal
            }
        }

        startTimer(actividad);
    });
});

// Event listeners para botones de pausa
document.querySelectorAll(".btn-pausa").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").dataset.inicial;
        console.log("Pausando actividad:", actividad);
        stopTimer(actividad);
        
        // Si se pausa la jornada, también detener los contadores de desviación si están activos
        if (actividad === "J") {
            if (lateTimer && lateTimer.interval) {
                stopDeviationTimer(true);
            }
            if (earlyTimer && earlyTimer.interval) {
                stopDeviationTimer(false);
            }
        }
    });
});

// Event listeners para botones de validación de contraseña
document.querySelectorAll(".btn-validar").forEach(btn => {
    btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const actividad = row.dataset.inicial;
        const passwordInput = row.querySelector(".pass-director");
        const errorMsg = row.querySelector(".msg-error");
        const authContainer = row.querySelector(".auth-container");
        
        if (!passwordInput || !passwordInput.value) {
            if (errorMsg) errorMsg.textContent = "Ingrese la contraseña";
            return;
        }
        
        // Usar la función de validación del servidor
        validarContraseñaDirectivo(passwordInput.value)
            .then(() => {
                // Ocultar el contenedor de autenticación
                if (authContainer) authContainer.style.display = "none";
                // Limpiar el campo de contraseña
                if (passwordInput) passwordInput.value = "";
                
                // Determinar qué tipo de desviación ocurrió
                const now = new Date();
                const [h, m, s] = window.configHoras.horaInicioPermitida.split(":");
                const horaPermitida = new Date();
                horaPermitida.setHours(parseInt(h), parseInt(m), parseInt(s));
                const esTarde = now > horaPermitida;
                
                // Detener el contador de desviación apropiado
                if (esTarde) {
                    if (lateTimer && lateTimer.interval) {
                        const lateTimeString = formatTime(lateTimer.time);
                        registrarEvento(actividad, "Retraso", lateTimeString);
                        stopDeviationTimer(true);
                    }
                } else {
                    if (earlyTimer && earlyTimer.interval) {
                        const earlyTimeString = formatTime(earlyTimer.time);
                        registrarEvento(actividad, "Inicio Temprano", earlyTimeString);
                        stopDeviationTimer(false);
                    }
                }
                
                // Iniciar el timer de la actividad
                startTimer(actividad);
            })
            .catch(error => {
                if (errorMsg) errorMsg.textContent = error.message || "Error de validación";
            });
    });
});

// Inicializar reloj en vivo
function updateLiveClock() {
    const clockElement = document.getElementById('live-clock');
    if (clockElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        clockElement.textContent = timeString;
    }
}

// Actualizar el reloj cada segundo
setInterval(updateLiveClock, 1000);
updateLiveClock(); // Actualizar inmediatamente al cargar

// Calcular y mostrar tiempos restantes
function updateRemainingTimes() {
    // Obtener los tiempos permitidos de la tabla
    const rows = document.querySelectorAll('.time-table tbody tr');
    let totalRemaining = 0;
    
    rows.forEach(row => {
        const inicial = row.dataset.inicial;
        if (['C', 'B'].includes(inicial)) { // Excluimos J porque se maneja diferente cuando hay desviación
            const tiempoPermitidoCell = row.querySelector('td:nth-child(3)');
            if (tiempoPermitidoCell) {
                const tiempoPermitido = tiempoPermitidoCell.textContent;
                const [horas, minutos, segundos] = tiempoPermitido.split(':').map(Number);
                const tiempoPermitidoSegundos = horas * 3600 + minutos * 60 + segundos;
                
                const tiempoUsado = timers[inicial] ? timers[inicial].time : 0;
                const tiempoRestante = Math.max(0, tiempoPermitidoSegundos - tiempoUsado);
                
                document.getElementById(`${inicial}-remaining`).value = formatTime(tiempoRestante);
                
                totalRemaining += tiempoRestante;
            }
        }
    });
    
    // Para J, si no hay desviación, calculamos normalmente
    if ((!lateTimer || !lateTimer.interval) && (!earlyTimer || !earlyTimer.interval)) {
        const jRow = document.querySelector('tr[data-inicial="J"]');
        if (jRow) {
            const tiempoPermitidoCell = jRow.querySelector('td:nth-child(3)');
            if (tiempoPermitidoCell) {
                const tiempoPermitido = tiempoPermitidoCell.textContent;
                const [horas, minutos, segundos] = tiempoPermitido.split(':').map(Number);
                const tiempoPermitidoSegundos = horas * 3600 + minutos * 60 + segundos;
                
                const tiempoUsado = timers['J'] ? timers['J'].time : 0;
                const tiempoRestante = Math.max(0, tiempoPermitidoSegundos - tiempoUsado);
                
                document.getElementById('J-remaining').value = formatTime(tiempoRestante);
                
                totalRemaining += tiempoRestante;
            }
        }
    }
    
    document.getElementById('total-remaining').value = formatTime(totalRemaining);
}

// Actualizar tiempos restantes cada segundo
setInterval(updateRemainingTimes, 1000);
updateRemainingTimes(); // Actualizar inmediatamente al cargar