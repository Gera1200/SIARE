// Funciones relacionadas con la verificación de horarios
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Función para verificar si el empleado está dentro del horario permitido
  app.verificarHorarioPermitido = () => {
    const horaInicio = window.configHoras.horaInicioPermitida
    if (!horaInicio) {
      return {
        estado: "normal",
        mensaje: "Horario no configurado",
        minutosRetraso: 0,
      }
    }

    // Obtener la fecha y hora actual
    const now = new Date()

    // Crear una nueva fecha con la hora de inicio del turno para hoy
    const [horaStr, minutoStr] = horaInicio.split(":")
    const hora = Number.parseInt(horaStr, 10)
    const minuto = Number.parseInt(minutoStr, 10)

    // Crear fecha con la hora de inicio para hoy
    const horaInicioDate = new Date(now)
    horaInicioDate.setHours(hora, minuto, 0, 0)

    // Si la hora de inicio es en la madrugada (ej: 2:25 AM) y la hora actual es en la tarde,
    // probablemente estamos comparando con la hora de inicio del día siguiente
    if (hora < 12 && now.getHours() >= 12 && now - horaInicioDate > 43200000) {
      // 12 horas en ms
      // Ajustar para comparar con la hora de inicio del día siguiente
      horaInicioDate.setDate(horaInicioDate.getDate() + 1)
    }

    // Para depuración
    console.log("Hora actual:", now.toLocaleTimeString())
    console.log("Hora inicio turno:", horaInicioDate.toLocaleTimeString())
    console.log("Hora inicio turno (formato):", horaInicio)

    // Calcular diferencia en minutos
    const diffMs = now - horaInicioDate
    const diffMinutes = diffMs / (1000 * 60)

    console.log("Diferencia en minutos:", diffMinutes)

    // Retornar estado según la diferencia
    if (diffMinutes < 0) {
      // El empleado llegó ANTES de las 6:00 AM → NO puede registrar
      return {
        estado: "temprano",
        mensaje: "No puede registrar antes de las "+ horaInicioDate.toLocaleTimeString(),
        minutosRetraso: 0,
      };
    } else if (diffMinutes <= 5) {
      // Entre 6:00 AM y 6:05 AM → PERMITIDO (sin restricciones)
      return {
        estado: "normal",
        mensaje: "Horario permitido",
        minutosRetraso: 0,
      };
    } else {
      // Pasó más de 5 minutos (después de 6:05 AM) → REQUIERE AUTORIZACIÓN
      return {
        estado: "tarde",
        mensaje: `Retraso de ${diffMinutes} minutos. Requiere autorización`,
        minutosRetraso: diffMinutes,
      };
    }
  }

  // Verificar si se debe iniciar automáticamente la jornada
  app.verificarInicioAutomatico = () => {
    if (!app.estado.jornadaIniciada && app.estado.inicioAutomaticoHabilitado) {
      const estadoHorario = app.verificarHorarioPermitido()

      // Si está dentro del rango de 0 a 5 minutos después de la hora de inicio
      if (estadoHorario.estado === "normal" && estadoHorario.minutosRetraso >= 0) {
        console.log("Iniciando jornada automáticamente")

        // Obtener elementos necesarios
        const jornadaRow = document.querySelector('tr[data-inicial="J"]')
        const timerInput = document.getElementById("J-timer")
        const statusElement = document.getElementById("J-status")
        const btnPausa = jornadaRow.querySelector(".btn-pausa")

        // Iniciar cronómetro
        app.startTimer("J", timerInput, statusElement)

        // Habilitar botón de pausa
        btnPausa.disabled = false

        // Guardar evento de inicio
        app.saveEvent("J", "inicio", app.utils.formatTime(app.estado.timers["J"]))

        // Desbloquear los demás botones de inicio (excepto comida que tiene regla especial)
        app.desbloquearBotonesInicio(true)

        // Marcar que la jornada ha sido iniciada
        app.estado.jornadaIniciada = true
        app.estado.botonesInicioDesbloqueados = true
        app.estado.horaInicioJornada = new Date()

        // Actualizar estado
        statusElement.textContent = "Iniciado automáticamente"
        statusElement.style.color = "green"
      }
    }
  }

  // Actualizar reloj en vivo
  const liveClock = document.getElementById("live-clock")
  setInterval(() => {
    const now = new Date()
    liveClock.textContent = now.toLocaleTimeString()

    // Verificar inicio automático
    app.verificarInicioAutomatico()

    // Verificar habilitación del botón de comida (después de 30 minutos de jornada)
    app.verificarHabilitacionComida()
  }, 1000)

  // Función para verificar si se debe habilitar el botón de comida
  app.verificarHabilitacionComida = () => {
    if (app.estado.jornadaIniciada && app.estado.horaInicioJornada && !app.estado.comidaBloqueadaPorRetraso) {
      const now = new Date()
      const diffMs = now - app.estado.horaInicioJornada
      const diffMinutes = diffMs / (1000 * 60)

      // Habilitar botón de comida después de 30 minutos de jornada
      if (diffMinutes >= 30 && app.estado.timerStates["C"] === "stopped") {
        const btnInicioC = document.querySelector('tr[data-inicial="C"] .btn-inicio')
        const statusC = document.getElementById("C-status")

        if (btnInicioC.disabled) {
          btnInicioC.disabled = false
          statusC.textContent = "Listo para iniciar"
          statusC.style.color = "blue"
        }
      }
    }
  }
})
