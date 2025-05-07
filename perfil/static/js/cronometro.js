const { guardarEventoURL, csrfToken } = window.appConfig;

let timers = {};

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startTimer(activity) {
    const normalizedActivity = activity.replace('/', '-');
    
    if (timers[normalizedActivity] && timers[normalizedActivity].interval) {
        return;
    }

    if (!timers[normalizedActivity]) {
        timers[normalizedActivity] = { time: 0, interval: null };
    }

    timers[normalizedActivity].interval = setInterval(() => {
        timers[normalizedActivity].time += 1;
        const timeString = formatTime(timers[normalizedActivity].time);
        document.querySelector(`#${normalizedActivity}-timer`).value = timeString;
    }, 1000);
}

function stopTimer(activity) {
    const normalizedActivity = activity.replace('/', '-');
    
    if (!timers[normalizedActivity]) return;

    clearInterval(timers[normalizedActivity].interval);
    timers[normalizedActivity].interval = null;  // <--- IMPORTANTE

    const timeString = formatTime(timers[normalizedActivity].time);
    document.querySelector(`#${normalizedActivity}-timer`).value = timeString;
    
    registrarEvento(activity, "Pausa", timeString);
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
        updateStatus(actividad, `Error: ${error.message}`);
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

// Event listeners corregidos
document.querySelectorAll(".btn-inicio").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").dataset.inicial;
        const normalized = actividad.replace('/', '-');
        const tiempo = timers[normalized] ? formatTime(timers[normalized].time) : "00:00:00";
        console.log("Iniciando actividad:", actividad);
        startTimer(actividad);
        registrarEvento(actividad, "Inicio", tiempo);
    });
});


document.querySelectorAll(".btn-pausa").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").dataset.inicial; // Usar data-inicial
        console.log("Pausando actividad:", actividad);
        stopTimer(actividad);
    });
});