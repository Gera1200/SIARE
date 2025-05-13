// Funciones relacionadas con la comunicación con el servidor
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Función para guardar eventos en el servidor
  app.saveEvent = (inicial, evento, cronometro) => {
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
        cronometro: cronometro,
        tiempo_segundos: app.estado.tiempoRetraso,
        tiempo_excedido: inicial === "C" || inicial === "B" ? app.estado.tiemposFaltantes[inicial] : 0,
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
  app.validarDirectivo = (contraseña) =>
    fetch("/validar_directivo/", {
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

  // Nueva función para guardar el estado del cronómetro en la base de datos
  app.guardarEstadoEnBaseDeDatos = () => {
    // Solo guardar si hay un empleado actual y la jornada está iniciada
    if (!app.estado.empleadoActual || !app.estado.jornadaIniciada) {
      return
    }

    // Preparar los datos para enviar
    const datosParaGuardar = {
      empleado_id: app.estado.empleadoActual,
      timers: {
        J: app.utils.formatTime(app.estado.timers["J"] || 0),
        C: app.utils.formatTime(app.estado.timers["C"] || 0),
        B: app.utils.formatTime(app.estado.timers["B"] || 0),
        CR: app.utils.formatTime(app.estado.timers["CR"] || 0),
        P: app.utils.formatTime(app.estado.timers["P"] || 0),
      },
      timer_states: app.estado.timerStates,
      tiempo_retraso: app.utils.formatTime(app.estado.tiempoRetraso),
      tiempos_faltantes: {
        J: app.utils.formatTime(app.estado.tiemposFaltantes.J),
        C: app.utils.formatTime(app.estado.tiemposFaltantes.C),
        B: app.utils.formatTime(app.estado.tiemposFaltantes.B),
      },
      comida_bloqueada: app.estado.comidaBloqueadaPorRetraso,
      fecha: new Date().toISOString().split("T")[0],
    }

    // Enviar los datos al servidor
    fetch(window.appConfig.guardarEstadoURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": window.appConfig.csrfToken,
      },
      body: JSON.stringify(datosParaGuardar),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Estado guardado en base de datos:", data)
      })
      .catch((error) => {
        console.error("Error al guardar estado en base de datos:", error)
      })
  }

  // Nueva función para cargar el estado del cronómetro desde la base de datos
app.cargarEstadoDesdeBaseDeDatos = () => {
  // Solo cargar si hay un empleado actual
  if (!app.estado.empleadoActual) {
    return Promise.resolve(false)
  }

  return fetch(
    `${window.appConfig.cargarEstadoURL}?empleado_id=${app.estado.empleadoActual}&fecha=${new Date().toISOString().split("T")[0]}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.estado) {
        console.log("Estado cargado desde base de datos:", data.estado)

        // Convertir los tiempos de formato string a segundos
        const estado = data.estado

        // Restaurar timers
        Object.keys(estado.timers).forEach((inicial) => {
          app.estado.timers[inicial] = app.utils.getTimeInSeconds(estado.timers[inicial])
        })

        // Restaurar estados de timers
        app.estado.timerStates = estado.timer_states

        // Restaurar tiempo de retraso
        app.estado.tiempoRetraso = app.utils.getTimeInSeconds(estado.tiempo_retraso)

        // Restaurar tiempos faltantes
        Object.keys(estado.tiempos_faltantes).forEach((inicial) => {
          app.estado.tiemposFaltantes[inicial] = app.utils.getTimeInSeconds(estado.tiempos_faltantes[inicial])
        })

        // Restaurar otros estados
        app.estado.comidaBloqueadaPorRetraso = estado.comida_bloqueada
        app.estado.jornadaIniciada = true

        // Calcular el tiempo transcurrido desde el último guardado
        if (estado.timestamp_guardado) {
          const timestampGuardado = Number(estado.timestamp_guardado)
          const timestampActual = Date.now()
          const tiempoTranscurridoMs = timestampActual - timestampGuardado
          const tiempoTranscurridoSeg = Math.floor(tiempoTranscurridoMs / 1000)

          console.log(`Tiempo transcurrido desde el último guardado: ${tiempoTranscurridoSeg} segundos`)

          // Actualizar los cronómetros que estaban en ejecución
          Object.keys(app.estado.timerStates).forEach((inicial) => {
            if (app.estado.timerStates[inicial] === "running") {
              app.estado.timers[inicial] += tiempoTranscurridoSeg
              console.log(`Actualizado cronómetro ${inicial}: +${tiempoTranscurridoSeg} segundos`)
            }
          })
        }

        // Restaurar la interfaz
        app.restaurarInterfazDesdeEstado()

        return true
      }
      return false
    })
    .catch((error) => {
      console.error("Error al cargar estado desde base de datos:", error)
      return false
    })
}

// Nueva función para guardar el estado del cronómetro en la base de datos
app.guardarEstadoEnBaseDeDatos = () => {
  // Solo guardar si hay un empleado actual y la jornada está iniciada
  if (!app.estado.empleadoActual || !app.estado.jornadaIniciada) {
    return
  }

  // Obtener la hora exacta actual
  const timestampGuardado = app.estado.ultimaActividadTimestamp || Date.now()

  // Preparar los datos para enviar
  const datosParaGuardar = {
    empleado_id: app.estado.empleadoActual,
    timers: {
      J: app.utils.formatTime(app.estado.timers["J"] || 0),
      C: app.utils.formatTime(app.estado.timers["C"] || 0),
      B: app.utils.formatTime(app.estado.timers["B"] || 0),
      CR: app.utils.formatTime(app.estado.timers["CR"] || 0),
      P: app.utils.formatTime(app.estado.timers["P"] || 0),
    },
    timer_states: app.estado.timerStates,
    tiempo_retraso: app.utils.formatTime(app.estado.tiempoRetraso),
    tiempos_faltantes: {
      J: app.utils.formatTime(app.estado.tiemposFaltantes.J),
      C: app.utils.formatTime(app.estado.tiemposFaltantes.C),
      B: app.utils.formatTime(app.estado.tiemposFaltantes.B),
    },
    comida_bloqueada: app.estado.comidaBloqueadaPorRetraso,
    fecha: new Date().toISOString().split("T")[0],
    timestamp_guardado: timestampGuardado, // Añadir el timestamp
  }

  console.log("Guardando estado con timestamp:", new Date(timestampGuardado).toLocaleString())

  // Enviar los datos al servidor
  fetch(window.appConfig.guardarEstadoURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": window.appConfig.csrfToken,
    },
    body: JSON.stringify(datosParaGuardar),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Estado guardado en base de datos:", data)
    })
    .catch((error) => {
      console.error("Error al guardar estado en base de datos:", error)
    })
}

  // Iniciar guardado periódico en la base de datos
  setInterval(() => {
    app.guardarEstadoEnBaseDeDatos()
  }, 30000) // Guardar cada 30 segundos
})
