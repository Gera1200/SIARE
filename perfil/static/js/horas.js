const clockElement = document.getElementById("live-clock");

let currentTime = new Date(window.initialDatetimeStr);  // Usamos la variable global

const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function updateClock() {
    const diaSemana = dias[currentTime.getDay()];
    const dia = String(currentTime.getDate()).padStart(2, '0');
    const mes = meses[currentTime.getMonth()];
    const año = currentTime.getFullYear();

    const horas = String(currentTime.getHours()).padStart(2, '0');
    const minutos = String(currentTime.getMinutes()).padStart(2, '0');
    const segundos = String(currentTime.getSeconds()).padStart(2, '0');

    clockElement.textContent = `${diaSemana} ${dia} de ${mes} de ${año} - ${horas}:${minutos}:${segundos}`;
    currentTime.setSeconds(currentTime.getSeconds() + 1);
}

updateClock();
setInterval(updateClock, 1000);



