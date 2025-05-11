// Funciones principales del cronómetro
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Inicializar todos los cronómetros
  document.querySelectorAll(".time-table tbody tr").forEach((row) => {
    const inicial = row.getAttribute("data-inicial")
    const timerInput = document.getElementById(`${inicial}-timer`)
    const statusElement = document.getElementById(`${inicial}-status`)

    // Inicializar estado del cronómetro si no está ya inicializado
    if (!app.estado.timers[inicial]) {
      app.estado.timers[inicial] = 0
    }
    if (!app.estado.timerStates[inicial]) {
      app.estado.timerStates[inicial] = "stopped"
    }

    // Configurar botones de inicio y pausa
    const btnInicio = row.querySelector(".btn-inicio")
    const btnPausa = row.querySelector(".btn-pausa")

    // Deshabilitar todos los botones de inicio excepto JORNADA inicialmente
    // (a menos que ya estén configurados desde las cookies)
    if (inicial !== "J" && !app.estado.jornadaIniciada) {
      btnInicio.disabled = true
    }

    btnInicio.addEventListener("click", () => {
      console.log("Botón inicio clickeado para:", inicial)

      // Verificar si necesita autorización (solo para JORNADA)
      if (inicial === "J") {
        const estadoHorario = app.verificarHorarioPermitido()
        console.log("Estado horario:", estadoHorario)

        if (estadoHorario.estado === "temprano") {
          // Demasiado temprano, no permitir inicio
          statusElement.textContent = estadoHorario.mensaje
          statusElement.style.color = "red"
          return
        } else {
          // Siempre requerir autorización del director para JORNADA
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

            // Mostrar mensaje con los minutos de retraso si corresponde
            if (estadoHorario.estado === "tarde") {
              const minutosRetraso = Math.min(Math.floor(estadoHorario.minutosRetraso), 120)
              msgError.textContent = `Llegada tarde: ${minutosRetraso} minutos`
              msgError.style.color = "#ff6600"

              // Si el retraso es mayor a 60 minutos, bloquear la opción de comida
              if (minutosRetraso >= 60) {
                app.estado.comidaBloqueadaPorRetraso = true
              }
            }

            // Configurar evento de validación si no está configurado
            const btnValidar = authContainer.querySelector(".btn-validar")
            if (btnValidar && !btnValidar.hasAttribute("data-configured")) {
              btnValidar.setAttribute("data-configured", "true")

              btnValidar.addEventListener("click", () => {
                const passInput = authContainer.querySelector(".pass-director")
                const msgError = authContainer.querySelector(".msg-error")
                const password = passInput.value

                console.log("Validando contraseña:", password)

                app.validarDirectivo(password).then((valido) => {
                  console.log("Resultado validación:", valido)

                  if (valido) {
                    // Ocultar contenedor de autenticación
                    authContainer.style.display = "none"

                    // Detener el contador de retraso si está activo
                    app.detenerContadorRetraso()

                    // Iniciar cronómetro
                    app.startTimer(inicial, timerInput, statusElement)

                    // Habilitar botón de pausa
                    btnPausa.disabled = false

                    // Guardar evento de inicio
                    app.saveEvent(inicial, "inicio", app.utils.formatTime(app.estado.timers[inicial]))

                    // Guardar el evento de retraso si hubo tiempo contabilizado
                    if (app.estado.tiempoRetraso > 0) {
                      app.saveEvent(inicial, "retraso", app.utils.formatTime(app.estado.tiempoRetraso))
                    }

                    // Desbloquear los demás botones de inicio (excepto comida que tiene regla especial)
                    app.desbloquearBotonesInicio(true)

                    // Marcar que la jornada ha sido iniciada
                    app.estado.jornadaIniciada = true
                    app.estado.botonesInicioDesbloqueados = true
                    app.estado.horaInicioJornada = new Date()

                    // Guardar estado en cookies
                    app.utils.guardarEstadoEnCookies()
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
      } else if (inicial === "C") {
        // Verificar si la jornada está iniciada
        if (!app.estado.jornadaIniciada) {
          statusElement.textContent = "Debe iniciar la jornada primero"
          statusElement.style.color = "red"
          return
        }

        // Verificar si la comida está bloqueada por retraso excesivo
        if (app.estado.comidaBloqueadaPorRetraso) {
          statusElement.textContent = "Bloqueado por retraso excesivo"
          statusElement.style.color = "red"
          return
        }

        // Verificar si han pasado 30 minutos desde el inicio de la jornada
        if (app.estado.horaInicioJornada) {
          const now = new Date()
          const diffMs = now - app.estado.horaInicioJornada
          const diffMinutes = diffMs / (1000 * 60)

          if (diffMinutes < 30) {
            statusElement.textContent = `Espere ${Math.ceil(30 - diffMinutes)} min más`
            statusElement.style.color = "orange"
            return
          }
        }
      } else {
        // Para los demás botones, verificar que la jornada esté iniciada
        if (!app.estado.jornadaIniciada) {
          statusElement.textContent = "Debe iniciar la jornada primero"
          statusElement.style.color = "red"
          return
        }
      }

      // Si no requiere autorización o no es JORNADA, iniciar normalmente
      if (app.estado.timerStates[inicial] === "stopped") {
        app.startTimer(inicial, timerInput, statusElement)
        btnPausa.disabled = false
        app.saveEvent(inicial, "inicio", app.utils.formatTime(app.estado.timers[inicial]))
        app.utils.guardarEstadoEnCookies()
      } else if (app.estado.timerStates[inicial] === "paused") {
        app.resumeTimer(inicial, timerInput, statusElement)
        btnPausa.disabled = false
        app.saveEvent(inicial, "inicio", app.utils.formatTime(app.estado.timers[inicial]))
        app.utils.guardarEstadoEnCookies()
      }
    })

    btnPausa.addEventListener("click", () => {
      // Para el botón de pausa de comida, verificar si han pasado 59 minutos
      if (inicial === "C" && app.estado.timers[inicial] < 59 * 60) {
        // Requiere autorización del director
        const authContainer = row.querySelector(".auth-container")

        if (authContainer) {
          authContainer.style.display = "block"

          // Limpiar mensaje de error y campo de contraseña
          const msgError = authContainer.querySelector(".msg-error")
          const passInput = authContainer.querySelector(".pass-director")
          if (msgError) {
            msgError.textContent = "Se requiere autorización para pausar antes de 59 minutos"
            msgError.style.color = "#ff6600"
          }
          if (passInput) {
            passInput.value = ""
            passInput.focus()
          }

          // Configurar evento de validación si no está configurado
          const btnValidar = authContainer.querySelector(".btn-validar")
          if (btnValidar && !btnValidar.hasAttribute("data-configured-pause")) {
            btnValidar.setAttribute("data-configured-pause", "true")

            btnValidar.addEventListener("click", () => {
              const passInput = authContainer.querySelector(".pass-director")
              const msgError = authContainer.querySelector(".msg-error")
              const password = passInput.value

              console.log("Validando contraseña para pausa anticipada:", password)

              app.validarDirectivo(password).then((valido) => {
                console.log("Resultado validación:", valido)

                if (valido) {
                  // Ocultar contenedor de autenticación
                  authContainer.style.display = "none"

                  // Pausar el cronómetro
                  app.handlePauseButton(inicial, timerInput, statusElement)
                  app.utils.guardarEstadoEnCookies()
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
        }
      } else {
        app.handlePauseButton(inicial, timerInput, statusElement)
        app.utils.guardarEstadoEnCookies()
      }
    })

    // Deshabilitar botón de pausa inicialmente
    btnPausa.disabled = true
  })

  // Función para desbloquear los botones de inicio
  app.desbloquearBotonesInicio = (exceptComida = false) => {
    document.querySelectorAll(".time-table tbody tr").forEach((row) => {
      const inicial = row.getAttribute("data-inicial")
      if (inicial !== "J" && !(exceptComida && inicial === "C")) {
        // No desbloquear comida si está bloqueada por retraso
        if (inicial === "C" && app.estado.comidaBloqueadaPorRetraso) {
          return
        }

        const btnInicio = row.querySelector(".btn-inicio")
        btnInicio.disabled = false

        // Actualizar el estado
        const statusElement = document.getElementById(`${inicial}-status`)
        statusElement.textContent = "Listo para iniciar"
        statusElement.style.color = "blue"
      }
    })
  }

  // Función para manejar el botón de pausa
  app.handlePauseButton = (inicial, timerInput, statusElement) => {
    if (app.estado.timerStates[inicial] === "running") {
      // Para la jornada, no reiniciamos el cronómetro al pausar
      if (inicial === "J") {
        app.pauseTimerSinReiniciar(inicial, timerInput, statusElement)
      } else {
        app.pauseTimer(inicial, timerInput, statusElement)
      }

      app.saveEvent(inicial, "pausa", app.utils.formatTime(app.estado.timers[inicial]))

      // Verificar si se excedió del tiempo permitido
      const tiempoPermitido = app.estado.duracionesPermitidas[inicial]
      const tiempoTranscurrido = app.estado.timers[inicial]

      if (tiempoTranscurrido > tiempoPermitido) {
        const tiempoExcedido = tiempoTranscurrido - tiempoPermitido

        // Registrar exceso en comida o break
        if (inicial === "C" || inicial === "B") {
          app.estado.tiemposExcedidos[inicial] = tiempoExcedido
          app.estado.tiemposExcedidos.total = app.estado.tiemposExcedidos.C + app.estado.tiemposExcedidos.B

          // Actualizar la tabla de tiempos faltantes
          app.estado.tiemposFaltantes[inicial] = tiempoExcedido
          app.utils.actualizarTiemposFaltantes()

          console.log(`Exceso de ${inicial}: ${app.utils.formatTime(tiempoExcedido)}`)

          // Mostrar mensaje de exceso
          statusElement.textContent = `Pausado (Exceso: ${app.utils.formatTime(tiempoExcedido)})`
          statusElement.style.color = "#ff6600"

          // Guardar evento de exceso
          app.saveEvent(inicial, "exceso", app.utils.formatTime(tiempoExcedido))
        }
      }
    }
  }

  // Funciones del cronómetro
  app.startTimer = (inicial, timerInput, statusElement) => {
    // Para la jornada, no reiniciamos el cronómetro si ya tiene un valor
    if (inicial === "J" && app.estado.timers[inicial] > 0) {
      app.resumeTimer(inicial, timerInput, statusElement)
      return
    }

    app.estado.timers[inicial] = 0
    app.estado.timerStates[inicial] = "running"
    statusElement.textContent = "En progreso"
    statusElement.style.color = "green"

    app.estado.intervals[inicial] = setInterval(() => {
      app.estado.timers[inicial]++
      timerInput.value = app.utils.formatTime(app.estado.timers[inicial])

      // Para comida, habilitar botón de pausa después de 59 minutos
      if (inicial === "C" && app.estado.timers[inicial] === 59 * 60) {
        const btnPausa = document.querySelector('tr[data-inicial="C"] .btn-pausa')
        if (btnPausa.disabled) {
          console.log("Habilitando botón de pausa de comida después de 59 minutos")
          btnPausa.disabled = false
        }
      }

      // Verificar si se está excediendo del tiempo permitido
      const tiempoPermitido = app.estado.duracionesPermitidas[inicial]

      if (app.estado.timers[inicial] > tiempoPermitido && (inicial === "C" || inicial === "B")) {
        const tiempoExcedido = app.estado.timers[inicial] - tiempoPermitido

        // Actualizar el estado para mostrar que se está excediendo
        statusElement.textContent = `Excediendo: ${app.utils.formatTime(tiempoExcedido)}`
        statusElement.style.color = "#ff6600"

        // Actualizar la tabla de tiempos faltantes en tiempo real
        app.estado.tiemposFaltantes[inicial] = tiempoExcedido
        app.utils.actualizarTiemposFaltantes()
      }

      // Guardar estado en cookies cada 10 segundos
      if (app.estado.timers[inicial] % 10 === 0) {
        app.utils.guardarEstadoEnCookies()
      }
    }, 1000)
  }

  app.pauseTimer = (inicial, timerInput, statusElement) => {
    clearInterval(app.estado.intervals[inicial])
    app.estado.timerStates[inicial] = "paused"

    // Si no se ha excedido, mostrar mensaje normal
    if (
      app.estado.timers[inicial] <= app.estado.duracionesPermitidas[inicial] ||
      (inicial !== "C" && inicial !== "B")
    ) {
      statusElement.textContent = "Pausado"
      statusElement.style.color = "orange"
    }
  }

  // Nueva función para pausar sin reiniciar (para la jornada)
  app.pauseTimerSinReiniciar = (inicial, timerInput, statusElement) => {
    clearInterval(app.estado.intervals[inicial])
    app.estado.timerStates[inicial] = "paused"
    statusElement.textContent = "Pausado (continúa contando)"
    statusElement.style.color = "orange"

    // Para la jornada, seguimos contando en segundo plano
    app.estado.intervals[inicial] = setInterval(() => {
      app.estado.timers[inicial]++
      timerInput.value = app.utils.formatTime(app.estado.timers[inicial])

      // Guardar estado en cookies cada 10 segundos
      if (app.estado.timers[inicial] % 10 === 0) {
        app.utils.guardarEstadoEnCookies()
      }
    }, 1000)
  }

  app.resumeTimer = (inicial, timerInput, statusElement) => {
    // Si es jornada y ya está contando en segundo plano, solo cambiar el estado visual
    if (inicial === "J" && app.estado.intervals[inicial]) {
      app.estado.timerStates[inicial] = "running"
      statusElement.textContent = "En progreso"
      statusElement.style.color = "green"
      return
    }

    app.estado.timerStates[inicial] = "running"

    // Si no se ha excedido, mostrar mensaje normal
    if (
      app.estado.timers[inicial] <= app.estado.duracionesPermitidas[inicial] ||
      (inicial !== "C" && inicial !== "B")
    ) {
      statusElement.textContent = "En progreso"
      statusElement.style.color = "green"
    } else {
      // Si se ha excedido, mostrar mensaje de exceso
      const tiempoExcedido = app.estado.timers[inicial] - app.estado.duracionesPermitidas[inicial]
      statusElement.textContent = `Excediendo: ${app.utils.formatTime(tiempoExcedido)}`
      statusElement.style.color = "#ff6600"
    }

    app.estado.intervals[inicial] = setInterval(() => {
      app.estado.timers[inicial]++
      timerInput.value = app.utils.formatTime(app.estado.timers[inicial])

      // Verificar si se está excediendo del tiempo permitido
      const tiempoPermitido = app.estado.duracionesPermitidas[inicial]

      if (app.estado.timers[inicial] > tiempoPermitido && (inicial === "C" || inicial === "B")) {
        const tiempoExcedido = app.estado.timers[inicial] - tiempoPermitido

        // Actualizar el estado para mostrar que se está excediendo
        statusElement.textContent = `Excediendo: ${app.utils.formatTime(tiempoExcedido)}`
        statusElement.style.color = "#ff6600"

        // Actualizar la tabla de tiempos faltantes en tiempo real
        app.estado.tiemposFaltantes[inicial] = tiempoExcedido
        app.utils.actualizarTiemposFaltantes()
      }

      // Guardar estado en cookies cada 10 segundos
      if (app.estado.timers[inicial] % 10 === 0) {
        app.utils.guardarEstadoEnCookies()
      }
    }, 1000)
  }

  // Actualizar estado inicial de la jornada
  const jornadaRow = document.querySelector('tr[data-inicial="J"]')
  const statusElement = document.getElementById("J-status")
  const btnInicio = jornadaRow.querySelector(".btn-inicio")

  // Solo verificar el horario si no se ha cargado desde cookies
  if (!app.estado.jornadaIniciada) {
    const estadoHorario = app.verificarHorarioPermitido()

    if (estadoHorario.estado === "temprano") {
      statusElement.textContent = estadoHorario.mensaje
      statusElement.style.color = "red"
      btnInicio.disabled = true
    } else if (estadoHorario.estado === "tarde") {
      statusElement.textContent = estadoHorario.mensaje
      statusElement.style.color = "orange"
      btnInicio.disabled = false

      // Verificar si ya pasaron 5 minutos desde la hora de inicio
      if (estadoHorario.minutosRetraso > 5) {
        // Iniciar contador de retraso automáticamente
        app.verificarInicioContadorRetraso()
      }

      // Si el retraso es mayor a 60 minutos, bloquear la opción de comida
      if (estadoHorario.minutosRetraso >= 60) {
        app.estado.comidaBloqueadaPorRetraso = true
        const statusC = document.getElementById("C-status")
        statusC.textContent = "Bloqueado por retraso excesivo"
        statusC.style.color = "red"
      }
    } else {
      statusElement.textContent = "Listo para iniciar"
      statusElement.style.color = "blue"
      btnInicio.disabled = false

      // Verificar inicio automático
      app.verificarInicioAutomatico()
    }
  }

  // Verificar horario cada minuto
  setInterval(() => {
    if (!app.estado.jornadaIniciada) {
      const estadoHorario = app.verificarHorarioPermitido()

      if (estadoHorario.estado === "temprano") {
        statusElement.textContent = estadoHorario.mensaje
        statusElement.style.color = "red"
        btnInicio.disabled = true
      } else if (estadoHorario.estado === "tarde") {
        statusElement.textContent = estadoHorario.mensaje
        statusElement.style.color = "orange"
        btnInicio.disabled = false

        // Si el retraso es mayor a 60 minutos, bloquear la opción de comida
        if (estadoHorario.minutosRetraso >= 60 && !app.estado.comidaBloqueadaPorRetraso) {
          app.estado.comidaBloqueadaPorRetraso = true
          const statusC = document.getElementById("C-status")
          statusC.textContent = "Bloqueado por retraso excesivo"
          statusC.style.color = "red"
        }
      } else {
        statusElement.textContent = "Listo para iniciar"
        statusElement.style.color = "blue"
        btnInicio.disabled = false
      }
    }
  }, 60000)

  // Botón para limpiar cookies (para pruebas)
  const btnLimpiarCookies = document.getElementById("btn-limpiar-cookies")
  if (btnLimpiarCookies) {
    btnLimpiarCookies.addEventListener("click", () => {
      app.utils.limpiarCookies()
      location.reload()
    })
  }
})
