// Archivo de configuración global

window.cronometroApp = {

  // Estado de la aplicación
  estado: {
    jornadaIniciada: false,
    timers: {},
    intervals: {},
    timerStates: {},
    retrasoInterval: null,
    tiempoRetraso: 0,
    retrasoContabilizando: false,
    botonesInicioDesbloqueados: false,
    horaInicioJornada: null,
    tiemposFaltantes: {
      J: 0,
      C: 0,
      B: 0,
      total: 0,
    },
    tiemposExcedidos: {
      C: 0,
      B: 0,
      total: 0,
    },
    duracionesPermitidas: {
      J: 0,
      C: 60 * 60, // 1 hora en segundos por defecto
      B: 15 * 60, // 15 minutos en segundos por defecto
      CR: 0,
      P: 0,
    },
    inicioAutomaticoHabilitado: true,
    comidaBloqueadaPorRetraso: false,
    empleadoActual: null, // ID del empleado actual
  },

  // Funciones de utilidad
  utils: {
    formatTime: (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      return [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        secs.toString().padStart(2, "0"),
      ].join(":")
    },

    getTimeInSeconds: (timeString) => {
      const [hours, minutes, seconds] = timeString.split(":").map(Number)
      return hours * 3600 + minutes * 60 + seconds
    },

    // Obtener la duración permitida de la tabla
    getDuracionPermitida: (inicial) => {
      const row = document.querySelector(`tr[data-inicial="${inicial}"]`)
      if (row) {
        const duracionText = row.querySelector("td:nth-child(3)").textContent
        return window.cronometroApp.utils.getTimeInSeconds(duracionText)
      }
      return window.cronometroApp.estado.duracionesPermitidas[inicial] || 0
    },

    // Actualizar los tiempos faltantes en la tabla
    actualizarTiemposFaltantes: () => {
      const app = window.cronometroApp

      // Actualizar campos individuales
      document.getElementById("J-remaining").value = app.utils.formatTime(app.estado.tiemposFaltantes.J)
      document.getElementById("C-remaining").value = app.utils.formatTime(app.estado.tiemposFaltantes.C)
      document.getElementById("B-remaining").value = app.utils.formatTime(app.estado.tiemposFaltantes.B)

      // Calcular y actualizar sumatoria
      app.estado.tiemposFaltantes.total =
        app.estado.tiemposFaltantes.J + app.estado.tiemposFaltantes.C + app.estado.tiemposFaltantes.B
      document.getElementById("total-remaining").value = app.utils.formatTime(app.estado.tiemposFaltantes.total)

      // Aplicar estilos a los campos excedidos
      const cRemaining = document.getElementById("C-remaining")
      const bRemaining = document.getElementById("B-remaining")
      const jRemaining = document.getElementById("J-remaining")
      const totalRemaining = document.getElementById("total-remaining")

      if (app.estado.tiemposFaltantes.J > 0) {
        jRemaining.classList.add("excedido")
      } else {
        jRemaining.classList.remove("excedido")
      }

      if (app.estado.tiemposFaltantes.C > 0) {
        cRemaining.classList.add("excedido")
      } else {
        cRemaining.classList.remove("excedido")
      }

      if (app.estado.tiemposFaltantes.B > 0) {
        bRemaining.classList.add("excedido")
      } else {
        bRemaining.classList.remove("excedido")
      }

      if (app.estado.tiemposFaltantes.total > 0) {
        totalRemaining.classList.add("excedido")
      } else {
        totalRemaining.classList.remove("excedido")
      }
    },

    // Obtener el ID del empleado actual
    obtenerEmpleadoActual: () => {
      return window.empleadoActual || "no hay"
    },

    // Guardar estado en cookies específicas para el empleado actual
    guardarEstadoEnCookies: () => {

      const app = window.cronometroApp
      const empleadoId = app.utils.obtenerEmpleadoActual()

      console.log("cookie "+document.cookie.length);

      // Actualizar el ID del empleado en el estado
      app.estado.empleadoActual = empleadoId

      const estadoParaGuardar = {
        jornadaIniciada: app.estado.jornadaIniciada,
        timers: app.estado.timers,
        timerStates: app.estado.timerStates,
        tiempoRetraso: app.estado.tiempoRetraso,
        tiemposFaltantes: app.estado.tiemposFaltantes,
        tiemposExcedidos: app.estado.tiemposExcedidos,
        horaInicioJornada: app.estado.horaInicioJornada ? app.estado.horaInicioJornada.toISOString() : null,
        comidaBloqueadaPorRetraso: app.estado.comidaBloqueadaPorRetraso,
        fecha: new Date().toISOString().split("T")[0], // Guardar la fecha actual
      }

      // Usar el ID del empleado como parte del nombre de la cookie
      document.cookie = `cronometroEstado_${empleadoId}=${JSON.stringify(estadoParaGuardar)};path=/;max-age=86400`
      console.log(`Estado guardado en cookies para empleado ${empleadoId}:`, estadoParaGuardar)
    },

    // Cargar estado desde cookies específicas para el empleado actual
    cargarEstadoDesdeCookies: () => {
      const app = window.cronometroApp
      const empleadoId = app.utils.obtenerEmpleadoActual()
      const cookies = document.cookie.split(";")
      const cronometroCookie = cookies.find((cookie) => cookie.trim().startsWith(`cronometroEstado_${empleadoId}=`))

      if (cronometroCookie) {
        try {
          const estadoGuardado = JSON.parse(cronometroCookie.split("=")[1])
          console.log(`Estado cargado desde cookies para empleado ${empleadoId}:`, estadoGuardado)

          // Verificar si la cookie es del día actual
          const fechaActual = new Date().toISOString().split("T")[0]
          if (estadoGuardado.fecha !== fechaActual) {
            console.log("La cookie es de un día diferente, no se cargará")
            return false
          }

          // Restaurar estado
          app.estado.jornadaIniciada = estadoGuardado.jornadaIniciada
          app.estado.timers = estadoGuardado.timers
          app.estado.timerStates = estadoGuardado.timerStates
          app.estado.tiempoRetraso = estadoGuardado.tiempoRetraso
          app.estado.tiemposFaltantes = estadoGuardado.tiemposFaltantes
          app.estado.tiemposExcedidos = estadoGuardado.tiemposExcedidos
          app.estado.horaInicioJornada = estadoGuardado.horaInicioJornada
            ? new Date(estadoGuardado.horaInicioJornada)
            : null
          app.estado.comidaBloqueadaPorRetraso = estadoGuardado.comidaBloqueadaPorRetraso
          app.estado.empleadoActual = empleadoId

          // Restaurar UI
          app.restaurarInterfazDesdeEstado()

          return true
        } catch (error) {
          console.error(`Error al cargar estado desde cookies para empleado ${empleadoId}:`, error)
        }
      }
      return false
    },

    // Limpiar cookies del empleado actual
    limpiarCookies: () => {
      const empleadoId = window.cronometroApp.utils.obtenerEmpleadoActual()
      document.cookie = `cronometroEstado_${empleadoId}=;path=/;max-age=0`
      console.log(`Cookies limpiadas para empleado ${empleadoId}`)
    },
  },

  // Inicializar duraciones permitidas
  inicializarDuracionesPermitidas: () => {
    const app = window.cronometroApp

    document.querySelectorAll(".time-table tbody tr").forEach((row) => {
      const inicial = row.getAttribute("data-inicial")
      if (inicial) {
        app.estado.duracionesPermitidas[inicial] = app.utils.getDuracionPermitida(inicial)
      }
    })

    console.log("Duraciones permitidas:", app.estado.duracionesPermitidas)
  },

  // Restaurar interfaz desde estado guardado
  restaurarInterfazDesdeEstado: () => {
    const app = window.cronometroApp

    // Restaurar valores de cronómetros
    Object.keys(app.estado.timers).forEach((inicial) => {
      const timerInput = document.getElementById(`${inicial}-timer`)
      if (timerInput) {
        timerInput.value = app.utils.formatTime(app.estado.timers[inicial])
      }

      // Restaurar estado de botones
      const row = document.querySelector(`tr[data-inicial="${inicial}"]`)
      if (row) {
        const btnInicio = row.querySelector(".btn-inicio")
        const btnPausa = row.querySelector(".btn-pausa")
        const statusElement = document.getElementById(`${inicial}-status`)

        if (app.estado.timerStates[inicial] === "running") {
          btnPausa.disabled = false
          statusElement.textContent = "En progreso"
          statusElement.style.color = "green"

          // Reiniciar el intervalo
          app.estado.intervals[inicial] = setInterval(() => {
            app.estado.timers[inicial]++
            timerInput.value = app.utils.formatTime(app.estado.timers[inicial])
          }, 1000)
        } else if (app.estado.timerStates[inicial] === "paused") {
          btnPausa.disabled = true
          statusElement.textContent = "Pausado"
          statusElement.style.color = "orange"
        }

        // Desbloquear botones si la jornada está iniciada
        if (app.estado.jornadaIniciada && inicial !== "J" && inicial !== "C") {
          btnInicio.disabled = false
        }

        // Bloquear botón de comida si está bloqueado por retraso
        if (inicial === "C" && app.estado.comidaBloqueadaPorRetraso) {
          btnInicio.disabled = true
          statusElement.textContent = "Bloqueado por retraso excesivo"
          statusElement.style.color = "red"
        }
      }
    })

    // Actualizar tabla de tiempos faltantes
    app.utils.actualizarTiemposFaltantes()
  },
}

// Inicializar duraciones permitidas cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Establecer el ID del empleado actual desde la variable global
  window.empleadoActual = window.appConfig.empleadoId
  console.log("Empleado actual:", window.empleadoActual)

  // Asegurar que se asigne al estado de la app
  app.estado.empleadoActual = window.empleadoActual

  // Inicializar duraciones permitidas
  app.inicializarDuracionesPermitidas()

  // Intentar cargar el estado desde la base de datos
  app.cargarEstadoDesdeBaseDeDatos().then((cargadoDesdeDB) => {
    if (!cargadoDesdeDB) {
      // Si no se pudo cargar desde la base de datos, intentar desde cookies
      app.utils.cargarEstadoDesdeCookies()
    }

    // Guardar estado en cookies cada 5 segundos
    setInterval(() => {
      app.utils.guardarEstadoEnCookies()
    }, 5000)
  })
})
