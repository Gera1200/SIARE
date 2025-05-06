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
        return; // Ya está corriendo
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
    const timeString = formatTime(timers[normalizedActivity].time);
    document.querySelector(`#${normalizedActivity}-timer`).value = timeString;
    
    registrarEvento(activity, "Pausa", timeString);
}

function registrarEvento(actividad, evento, tiempo) {
    const requestData = {
        inicial: actividad,
        evento: evento,
        cronometro: tiempo
    };
    
    console.log("Datos a enviar:", requestData); // Debug crucial
    
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
    .then(data => console.log("Éxito:", data))
    .catch(error => console.error("Error detallado:", error)); // Mejor mensaje de error
}

document.querySelectorAll(".btn-inicio").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").children[0].innerText.trim();
        startTimer(actividad);
        registrarEvento(actividad, "Inicio", "00:00:00");
    });
});

document.querySelectorAll(".btn-pausa").forEach(btn => {
    btn.addEventListener("click", () => {
        const actividad = btn.closest("tr").children[0].innerText.trim();
        stopTimer(actividad);
    });
});