document.addEventListener("DOMContentLoaded", () => {
  // Configuración inicial
  const initialDatetime = new Date(window.initialDatetimeStr)
  const timers = {}
  const intervals = {}
  const timerStates = {}

  // Variables para el contador de retraso
  let retrasoInterval = null
  let tiempoRetraso = 0
  let retrasoContabilizando = false

  // Actualizar reloj en vivo
  const liveClock = document.getElementById("live-clock")
  setInterval(() => {
    const now = new Date()
    liveClock.textContent = now.toLocaleTimeString()

    // Verificar si necesitamos iniciar el contador de retraso
    verificarInicioContadorRetraso()
  }, 1000)

  // Función para verificar si debemos iniciar el contador de retraso
  function verificarInicioContadorRetraso() {
    // Solo verificar si no estamos ya contabilizando y la jornada no está en progreso
    if (!retrasoContabilizando && timerStates["J"] !== "running") {
      const estadoHorario = verificarHorarioPermitido()

      // Si han pasado más de 5 minutos desde la hora de inicio y no se ha iniciado la jornada
      if (estadoHorario.estado === "tarde" && estadoHorario.minutosRetraso > 5) {
        // Iniciar contador de retraso si no está ya iniciado
        if (!retrasoInterval) {
          iniciarContadorRetraso()

          // Actualizar el estado para mostrar que se está contabilizando el retraso
          const statusElement = document.getElementById("J-status")
          statusElement.textContent = "⚠️ Contabilizando retraso"
          statusElement.style.color = "#ff6600"
          statusElement.classList.add("retraso")
        }
      }
    }
  }

  // Función para iniciar el contador de retraso
  function iniciarContadorRetraso() {
    console.log("Iniciando contador de retraso automático")
    retrasoContabilizando = true

    // Obtener el estado del horario para conocer los minutos de retraso iniciales
    const estadoHorario = verificarHorarioPermitido()

    // Inicializar el tiempo de retraso con los minutos actuales de retraso
    if (estadoHorario.estado === "tarde") {
      tiempoRetraso = Math.floor(estadoHorario.minutosRetraso * 60) // Convertir minutos a segundos
    } else {
      tiempoRetraso = 0
    }

    // Iniciar el intervalo para contar el tiempo de retraso
    retrasoInterval = setInterval(() => {
      tiempoRetraso++

      // Mostrar el tiempo de retraso en la consola para depuración
      console.log("Tiempo de retraso:", formatTime(tiempoRetraso))
    }, 1000)
  }

  // Función para detener el contador de retraso
  function detenerContadorRetraso() {
    if (retrasoInterval) {
      console.log("Deteniendo contador de retraso. Tiempo acumulado:", formatTime(tiempoRetraso))
      clearInterval(retrasoInterval)
      retrasoInterval = null

      // No reiniciamos tiempoRetraso para mantener el registro del tiempo acumulado
      retrasoContabilizando = false

      // Quitar la clase de retraso del estado
      const statusElement = document.getElementById("J-status")
      statusElement.classList.remove("retraso")
    }
  }

  // Inicializar todos los cronómetros
  document.querySelectorAll(".time-table tbody tr").forEach((row) => {
    const inicial = row.getAttribute("data-inicial")
    const timerInput = document.getElementById(`${inicial}-timer`)
    const statusElement = document.getElementById(`${inicial}-status`)

    // Inicializar estado del cronómetro
    timers[inicial] = 0
    timerStates[inicial] = "stopped"

    // Configurar botones de inicio y pausa
    const btnInicio = row.querySelector(".btn-inicio")
    const btnPausa = row.querySelector(".btn-pausa")

    btnInicio.addEventListener("click", () => {
      console.log("Botón inicio clickeado para:", inicial)

      // Verificar si necesita autorización (solo para JORNADA)
      if (inicial === "J") {
        const estadoHorario = verificarHorarioPermitido()
        console.log("Estado horario:", estadoHorario)

        if (estadoHorario.estado === "temprano") {
          // Demasiado temprano, no permitir inicio
          statusElement.textContent = estadoHorario.mensaje
          statusElement.style.color = "red"
          return
        } else if (estadoHorario.estado === "tarde") {
          // Requiere autorización del director
          const authContainer = row.querySelector(".auth-container")
          console.log("Auth container:", authContainer)

          if (authContainer) {
            authContainer.style.display = "block"

            // Limpiar mensaje de error y campo de contraseña
            const msgError = authContainer.querySelector(".msg-error")
            const passInput = authContainer.querySelector(".pass-director")
            if (msgError) msgError.textContent = ""
            if (passInput) {
              passInput.value = ""
              passInput.focus()
            }

            // Mostrar mensaje con los minutos de retraso (limitado a un máximo razonable)
            const minutosRetraso = Math.min(Math.floor(estadoHorario.minutosRetraso), 120)
            msgError.textContent = `Llegada tarde: ${minutosRetraso} minutos`
            msgError.style.color = "#ff6600"

            // Configurar evento de validación si no está configurado
            const btnValidar = authContainer.querySelector(".btn-validar")
            if (btnValidar && !btnValidar.hasAttribute("data-configured")) {
              btnValidar.setAttribute("data-configured", "true")

              btnValidar.addEventListener("click", () => {
                const passInput = authContainer.querySelector(".pass-director")
                const msgError = authContainer.querySelector(".msg-error")
                const password = passInput.value

                console.log("Validando contraseña:", password)

                validarDirectivo(password).then((valido) => {
                  console.log("Resultado validación:", valido)

                  if (valido) {
                    // Ocultar contenedor de autenticación
                    authContainer.style.display = "none"

                    // Detener el contador de retraso si está activo
                    detenerContadorRetraso()

                    // Iniciar cronómetro
                    startTimer(inicial, timerInput, statusElement)

                    // Habilitar botón de pausa
                    btnPausa.disabled = false

                    // Guardar evento de inicio
                    saveEvent(inicial, "inicio", formatTime(timers[inicial]))

                    //mostrar los minutos de retraso
                    document.getElementById("J-remaining").value = formatTime(minutosRetraso*60)

                    // Guardar el evento de retraso si hubo tiempo contabilizado
                    if (tiempoRetraso > 0) {
                      saveEvent(inicial, "retraso", formatTime(tiempoRetraso))
                    }
                  } else {
                    msgError.textContent = "Contraseña incorrecta"
                    msgError.style.color = "#f44336"

                    // Añadir animación de sacudida
                    authContainer.classList.add("shake")
                    setTimeout(() => {
                      authContainer.classList.remove("shake")
                    }, 600)

                    // Limpiar y enfocar el campo de contraseña
                    passInput.value = ""
                    passInput.focus()
                  }
                })
              })

              // Añadir evento para enviar al presionar Enter
              const passInput = authContainer.querySelector(".pass-director")
              if (passInput) {
                passInput.addEventListener("keypress", (event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    btnValidar.click()
                  }
                })
              }
            }

            return
          } else {
            console.error("No se encontró el contenedor de autenticación")
          }
        }
      }

      // Si no requiere autorización o no es JORNADA, iniciar normalmente
      if (timerStates[inicial] === "stopped") {
        startTimer(inicial, timerInput, statusElement)
        btnPausa.disabled = false
        saveEvent(inicial, "inicio", formatTime(timers[inicial]))
      } else if (timerStates[inicial] === "paused") {
        resumeTimer(inicial, timerInput, statusElement)
        btnPausa.disabled = false
        saveEvent(inicial, "inicio", formatTime(timers[inicial]))
      }
    })

    btnPausa.addEventListener("click", () => {
      handlePauseButton(inicial, timerInput, statusElement)
    })

    // Deshabilitar botón de pausa inicialmente
    btnPausa.disabled = true
  })

  // Función para manejar el botón de pausa
  function handlePauseButton(inicial, timerInput, statusElement) {
    if (timerStates[inicial] === "running") {
      pauseTimer(inicial, timerInput, statusElement)
      saveEvent(inicial, "pausa", formatTime(timers[inicial]))
    }
  }

  // Funciones del cronómetro
  function startTimer(inicial, timerInput, statusElement) {
    timers[inicial] = 0
    timerStates[inicial] = "running"
    statusElement.textContent = "En progreso"
    statusElement.style.color = "green"

    intervals[inicial] = setInterval(() => {
      timers[inicial]++
      timerInput.value = formatTime(timers[inicial])
    }, 1000)
  }

  function pauseTimer(inicial, timerInput, statusElement) {
    clearInterval(intervals[inicial])
    timerStates[inicial] = "paused"
    statusElement.textContent = "Pausado"
    statusElement.style.color = "orange"
  }

  function resumeTimer(inicial, timerInput, statusElement) {
    timerStates[inicial] = "running"
    statusElement.textContent = "En progreso"
    statusElement.style.color = "green"

    intervals[inicial] = setInterval(() => {
      timers[inicial]++
      timerInput.value = formatTime(timers[inicial])
    }, 1000)
  }

  // Función para guardar eventos en el servidor
  function saveEvent(inicial, evento, cronometro) {
    // Registrar la hora actual del cliente para depuración
    const clientTime = new Date().toLocaleString()
    console.log("Hora del cliente al guardar evento:", clientTime)

    fetch(window.appConfig.guardarEventoURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.appConfig.csrfToken,
      },
      body: JSON.stringify({
        inicial: inicial,
        evento: evento,
        tiempo_segundos: tiempoRetraso,
        cronometro: cronometro,
        hora_cliente: clientTime, // Enviar la hora del cliente para comparación
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Evento guardado:", data)
        // Mostrar la hora guardada en el servidor para verificación
        if (data.hora_guardada) {
          console.log("Hora guardada en el servidor:", data.hora_guardada)
        }
      })
      .catch((error) => {
        console.error("Error al guardar evento:", error)
      })
  }

  // Función para validar credenciales de director
  function validarDirectivo(contraseña) {
    return fetch("/validar_directivo/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.appConfig.csrfToken,
      },
      body: JSON.stringify({
        contraseña: contraseña,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        return data.valido
      })
      .catch((error) => {
        console.error("Error al validar directivo:", error)
        return false
      })
  }

  // Funciones de utilidad para manejo de tiempo
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":")
  }

  function getTimeInSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(Number)
    return hours * 3600 + minutes * 60 + seconds
  }

  // Actualizar tiempos restantes
  // function updateRemainingTime(inicial) {
  //   if (["J", "C", "B"].includes(inicial)) {
  //     const duracionPermitida = getDuracionPermitida(inicial)
  //     const tiempoTranscurrido = timers[inicial]

  //     if (tiempoTranscurrido > duracionPermitida) {
  //       remainingTimes[inicial] = 0
  //     } else {
  //       remainingTimes[inicial] = duracionPermitida - tiempoTranscurrido
  //     }

  //     updateRemainingTimes()
  //   }
  // }

  // function updateRemainingTimes() {
  //   // Actualizar campos individuales
  //   document.getElementById("J-remaining").value = formatTime(remainingTimes["J"])
  //   document.getElementById("C-remaining").value = formatTime(remainingTimes["C"])
  //   document.getElementById("B-remaining").value = formatTime(remainingTimes["B"])

  //   // Calcular y actualizar sumatoria
  //   const total = remainingTimes["J"] + remainingTimes["C"] + remainingTimes["B"]
  //   document.getElementById("total-remaining").value = formatTime(total)
  // }

  // function getDuracionPermitida(inicial) {
  //   // Obtener duración permitida de la tabla
  //   const row = document.querySelector(`tr[data-inicial="${inicial}"]`)
  //   const duracionText = row.querySelector("td:nth-child(3)").textContent
  //   return getTimeInSeconds(duracionText)
  // }

  // Función para verificar si el empleado está dentro del horario permitido
  function verificarHorarioPermitido() {
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
    if (diffMinutes < -1) {
      // Más de 10 minutos antes de la hora de entrada
      return {
        estado: "temprano",
        mensaje: "Es temprano para iniciar",
        minutosRetraso: 0,
      }
    } else if (diffMinutes < 0) {
      // Dentro de los 10 minutos antes de la hora de entrada
      return {
        estado: "normal",
        mensaje: "Horario permitido",
        minutosRetraso: 0,
      }
    } else if (diffMinutes > 5) {
      // Más de 5 minutos después de la hora de entrada
      return {
        estado: "tarde",
        mensaje: "Requiere autorización de director",
        minutosRetraso: diffMinutes,
      }
    } else {
      // Entre 0 y 5 minutos después de la hora de entrada
      return {
        estado: "normal",
        mensaje: "Horario permitido",
        minutosRetraso: 0,
      }
    }
  }
  function aplicarEstadoActividad(inicial, btnInicio, statusElement) {
    const estadoHorario = verificarHorarioPermitido(inicial); // Asumimos que acepta el tipo de actividad como parámetro
  
    if (estadoHorario.estado === "temprano") {
      statusElement.textContent = estadoHorario.mensaje;
      statusElement.style.color = "red";
      btnInicio.disabled = true;
    } else if (estadoHorario.estado === "tarde") {
      statusElement.textContent = estadoHorario.mensaje;
      statusElement.style.color = "orange";
      btnInicio.disabled = false;
  
      if (estadoHorario.minutosRetraso > 5 && inicial === "J") {
        // Solo aplica contador de retraso para jornada
        verificarInicioContadorRetraso();
      }
    } else {
      statusElement.textContent = "Listo para iniciar";
      statusElement.style.color = "blue";
      btnInicio.disabled = false;
    }
  }
  
  // Obtener referencias de cada actividad
  const actividades = [
    { inicial: "J", btn: document.querySelector('tr[data-inicial="J"] .btn-inicio'), status: document.getElementById("J-status") },
    { inicial: "C", btn: document.querySelector('tr[data-inicial="C"] .btn-inicio'), status: document.getElementById("C-status") },
    { inicial: "B", btn: document.querySelector('tr[data-inicial="B"] .btn-inicio'), status: document.getElementById("B-status") },
    { inicial: "CR", btn: document.querySelector('tr[data-inicial="CR"] .btn-inicio'), status: document.getElementById("CR-status") },
    { inicial: "P", btn: document.querySelector('tr[data-inicial="P"] .btn-inicio'), status: document.getElementById("P-status") },
  ];
  
  // Aplicar lógica a todas
  actividades.forEach(({ inicial, btn, status }) => {
    aplicarEstadoActividad(inicial, btn, status);
  });
  


})
