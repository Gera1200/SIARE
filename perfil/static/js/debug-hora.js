// Archivo para depurar problemas con el cálculo de hora
// Incluir este script en la página para ver información detallada en la consola

document.addEventListener("DOMContentLoaded", () => {
    console.log("=== DEPURACIÓN DE HORA ===")
  
    // Mostrar la hora actual del navegador
    const now = new Date()
    console.log("Hora actual del navegador:", now.toLocaleString())
  
    // Mostrar la hora inicial proporcionada por el servidor
    console.log("Hora inicial del servidor:", window.initialDatetimeStr)
    const initialDate = new Date(window.initialDatetimeStr)
    console.log("Hora inicial parseada:", initialDate.toLocaleString())
  
    // Mostrar la hora de inicio del turno
    const horaInicio = window.configHoras.horaInicioPermitida
    console.log("Hora de inicio del turno:", horaInicio)
  
    // Crear una fecha con la hora de inicio para hoy
    const [horaStr, minutoStr] = horaInicio.split(":")
    const hora = Number.parseInt(horaStr, 10)
    const minuto = Number.parseInt(minutoStr, 10)
  
    const horaInicioDate = new Date(now)
    horaInicioDate.setHours(hora, minuto, 0, 0)
    console.log("Fecha y hora de inicio del turno:", horaInicioDate.toLocaleString())
  
    // Calcular diferencia en minutos
    const diffMs = now - horaInicioDate
    const diffMinutes = diffMs / (1000 * 60)
    console.log("Diferencia en milisegundos:", diffMs)
    console.log("Diferencia en minutos:", diffMinutes)
  
    // Determinar el estado según la diferencia
    let estado = ""
    if (diffMinutes < -10) {
      estado = "temprano (más de 10 minutos antes)"
    } else if (diffMinutes < 0) {
      estado = "normal (dentro de los 10 minutos antes)"
    } else if (diffMinutes > 5) {
      estado = "tarde (más de 5 minutos después)"
    } else {
      estado = "normal (entre 0 y 5 minutos después)"
    }
    console.log("Estado del horario:", estado)
  
    // Verificar la zona horaria
    console.log("Zona horaria del navegador:", Intl.DateTimeFormat().resolvedOptions().timeZone)
    console.log("Offset de zona horaria (minutos):", now.getTimezoneOffset())
  
    // Añadir un elemento en la página para mostrar esta información
    const debugInfo = document.createElement("div")
    debugInfo.style.position = "fixed"
    debugInfo.style.bottom = "10px"
    debugInfo.style.right = "10px"
    debugInfo.style.backgroundColor = "rgba(0,0,0,0.7)"
    debugInfo.style.color = "white"
    debugInfo.style.padding = "10px"
    debugInfo.style.borderRadius = "5px"
    debugInfo.style.fontSize = "12px"
    debugInfo.style.maxWidth = "300px"
    debugInfo.style.zIndex = "9999"
  
    debugInfo.innerHTML = `
      <h3>Depuración de Hora</h3>
      <p>Hora actual: ${now.toLocaleString()}</p>
      <p>Hora inicio turno: ${horaInicioDate.toLocaleTimeString()}</p>
      <p>Diferencia: ${Math.round(diffMinutes)} minutos</p>
      <p>Estado: ${estado}</p>
      <button id="close-debug">Cerrar</button>
    `
  
    document.body.appendChild(debugInfo)
  
    // Botón para cerrar el panel de depuración
    document.getElementById("close-debug").addEventListener("click", () => {
      debugInfo.remove()
    })
  })
  