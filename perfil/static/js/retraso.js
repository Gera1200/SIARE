// Funciones relacionadas con el manejo de retrasos
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Función para verificar si debemos iniciar el contador de retraso
  app.verificarInicioContadorRetraso = () => {
    // Solo verificar si no estamos ya contabilizando y la jornada no está en progreso

    if (window.estadoRetrasoRegistrado) {
      console.log("Ya existe retraso registrado, no se vuelve a iniciar el contador.")
      return
    }
    
    if (!app.estado.retrasoContabilizando && app.estado.timerStates["J"] !== "running") {
      const estadoHorario = app.verificarHorarioPermitido()

      // Si han pasado más de 5 minutos desde la hora de inicio y no se ha iniciado la jornada
      if (estadoHorario.estado === "tarde" && estadoHorario.minutosRetraso > 5) {
        // Iniciar contador de retraso si no está ya iniciado
        if (!app.estado.retrasoInterval) {
          app.iniciarContadorRetraso()

          // Actualizar el estado para mostrar que se está contabilizando el retraso
          const statusElement = document.getElementById("J-status")
          statusElement.textContent = "⚠️ Contabilizando retraso"
          statusElement.style.color = "#ff6600"
          statusElement.classList.add("retraso")

          // Si el retraso es mayor a 60 minutos, bloquear la opción de comida
          if (estadoHorario.minutosRetraso >= 60) {
            app.estado.comidaBloqueadaPorRetraso = true
            const statusC = document.getElementById("C-status")
            statusC.textContent = "Bloqueado por retraso excesivo"
            statusC.style.color = "red"
          }
        }
      }
    }
  }

  // Función para iniciar el contador de retraso
  app.iniciarContadorRetraso = () => {
    console.log("Iniciando contador de retraso automático")
    app.estado.retrasoContabilizando = true

    // Obtener el estado del horario para conocer los minutos de retraso iniciales
    const estadoHorario = app.verificarHorarioPermitido()

    // Inicializar el tiempo de retraso con los minutos actuales de retraso MENOS los 5 minutos de tolerancia
    if (estadoHorario.estado === "tarde") {
      // Restar 5 minutos de tolerancia al tiempo de retraso
      const minutosRetrasoReales = Math.max(0, estadoHorario.minutosRetraso - 5)
      app.estado.tiempoRetraso = Math.floor(minutosRetrasoReales * 60) // Convertir minutos a segundos

      // Si el retraso es mayor a 60 minutos, bloquear la opción de comida
      if (estadoHorario.minutosRetraso >= 60) {
        app.estado.comidaBloqueadaPorRetraso = true
        const statusC = document.getElementById("C-status")
        statusC.textContent = "Bloqueado por retraso excesivo"
        statusC.style.color = "red"
      }
    } else {
      app.estado.tiempoRetraso = 0
    }

    // Actualizar los tiempos faltantes - SOLO para J, ya no afecta a C
    app.estado.tiemposFaltantes.J = app.estado.tiempoRetraso

    // Actualizar la tabla de tiempos faltantes
    app.utils.actualizarTiemposFaltantes()

    // Mostrar mensaje informativo
    const minutosRetraso = Math.floor(app.estado.tiempoRetraso / 60)
    console.log(`Retraso de ${minutosRetraso - 5} minutos (después de tolerancia).`)

    // Iniciar el intervalo para contar el tiempo de retraso
    app.estado.retrasoInterval = setInterval(() => {
      app.estado.tiempoRetraso++

      // Actualizar los tiempos faltantes - SOLO para J, ya no afecta a C
      app.estado.tiemposFaltantes.J = app.estado.tiempoRetraso

      // Actualizar la tabla de tiempos faltantes
      app.utils.actualizarTiemposFaltantes()

      // Mostrar el tiempo de retraso en la consola para depuración
      console.log("Tiempo de retraso:", app.utils.formatTime(app.estado.tiempoRetraso))
    }, 1000)
  }

  // Función para detener el contador de retraso
  app.detenerContadorRetraso = () => {
    if (app.estado.retrasoInterval) {
      console.log("Deteniendo contador de retraso. Tiempo acumulado:", app.utils.formatTime(app.estado.tiempoRetraso))
      clearInterval(app.estado.retrasoInterval)
      app.estado.retrasoInterval = null

      // No reiniciamos tiempoRetraso para mantener el registro del tiempo acumulado
      app.estado.retrasoContabilizando = false

      // Quitar la clase de retraso del estado
      const statusElement = document.getElementById("J-status")
      statusElement.classList.remove("retraso")
    }
  }

  // Verificar retraso cada minuto
  setInterval(() => {
    app.verificarInicioContadorRetraso()
  }, 60000)
})
