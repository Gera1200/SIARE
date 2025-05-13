// Funcionalidad para mantener el cronómetro funcionando en segundo plano y guardar estado al cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
  const app = window.cronometroApp

  // Variables para el seguimiento en segundo plano
  let ultimaActividadTimestamp = Date.now()
  let enSegundoPlano = false

  // 1. Manejar el botón de cierre de sesión
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion")
  console.log("Botón de cierre de sesión encontrado:", btnCerrarSesion)

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", async (e) => {
      e.preventDefault() // Prevenir la navegación inmediata
      console.log("Botón de cierre de sesión clickeado")

      // Obtener la URL de cierre de sesión desde la variable global
      const logoutUrl = window.logoutURL || "/logout/"
      console.log("URL de logout:", logoutUrl)

      // Si la jornada está iniciada, guardar estado
      if (app && app.estado && app.estado.jornadaIniciada) {
        try {
          // Mostrar mensaje de espera
          const navText = btnCerrarSesion.querySelector(".nav-text")
          const originalText = navText ? navText.textContent : "Cerrar Sesión" // Declare originalText here

          if (navText) {
            navText.textContent = "Guardando..."
          }

          btnCerrarSesion.style.pointerEvents = "none"

          // Guardar estado
          await guardarEstadoPromesa()

          console.log("Estado guardado correctamente antes de cerrar sesión")

          // Redirigir a la página de logout
          window.location.href = logoutUrl
        } catch (error) {
          console.error("Error al guardar estado:", error)

          // Restaurar texto original y permitir clic de nuevo
          const navText = btnCerrarSesion.querySelector(".nav-text")
          if (navText) {
            navText.textContent = originalText
          }

          btnCerrarSesion.style.pointerEvents = "auto"

          // Preguntar si desea continuar sin guardar
          if (
            confirm("Hubo un error al guardar el estado. ¿Desea continuar con el cierre de sesión de todas formas?")
          ) {
            window.location.href = logoutUrl
          }
        }
      } else {
        // Si no hay jornada iniciada, simplemente cerrar sesión
        console.log("No hay jornada iniciada, redirigiendo a:", logoutUrl)
        window.location.href = logoutUrl
      }
    })
  } else {
    console.error("No se encontró el botón de cierre de sesión")
  }

  // 2. Función para convertir guardarEstadoEnBaseDeDatos en una promesa
  function guardarEstadoPromesa() {
    return new Promise((resolve, reject) => {
      try {
        // Guardar la hora exacta actual
        app.estado.ultimaActividadTimestamp = Date.now()

        // Llamar a la función de guardado
        app.guardarEstadoEnBaseDeDatos()

        // Esperar un momento para asegurar que se complete el guardado
        setTimeout(() => {
          resolve()
        }, 1000)
      } catch (error) {
        reject(error)
      }
    })
  }

  // 3. Detectar cuando la página está en segundo plano
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // La página está en segundo plano
      enSegundoPlano = true
      ultimaActividadTimestamp = Date.now()

      // Guardar el estado actual
      if (app && app.estado && app.estado.jornadaIniciada) {
        app.estado.ultimaActividadTimestamp = ultimaActividadTimestamp
        app.guardarEstadoEnBaseDeDatos()
        console.log("Página en segundo plano. Estado guardado:", new Date().toLocaleTimeString())
      }
    } else {
      // La página vuelve a estar activa
      if (enSegundoPlano && app && app.estado && app.estado.jornadaIniciada) {
        const ahora = Date.now()
        const tiempoTranscurridoMs = ahora - ultimaActividadTimestamp
        const tiempoTranscurridoSeg = Math.floor(tiempoTranscurridoMs / 1000)

        console.log(`Página activa de nuevo. Tiempo transcurrido: ${tiempoTranscurridoSeg} segundos`)

        // Actualizar los cronómetros que estaban en ejecución
        Object.keys(app.estado.timerStates).forEach((inicial) => {
          if (app.estado.timerStates[inicial] === "running") {
            app.estado.timers[inicial] += tiempoTranscurridoSeg

            // Actualizar la visualización del cronómetro
            const timerInput = document.getElementById(`${inicial}-timer`)
            if (timerInput) {
              timerInput.value = app.utils.formatTime(app.estado.timers[inicial])
            }

            console.log(`Actualizado cronómetro ${inicial}: +${tiempoTranscurridoSeg} segundos`)

            // Verificar si se está excediendo del tiempo permitido para comida o break
            if (
              (inicial === "C" || inicial === "B") &&
              app.estado.timers[inicial] > app.estado.duracionesPermitidas[inicial]
            ) {
              const tiempoExcedido = app.estado.timers[inicial] - app.estado.duracionesPermitidas[inicial]

              // Actualizar la tabla de tiempos faltantes
              app.estado.tiemposFaltantes[inicial] = tiempoExcedido
              app.utils.actualizarTiemposFaltantes()

              // Actualizar el estado visual
              const statusElement = document.getElementById(`${inicial}-status`)
              if (statusElement) {
                statusElement.textContent = `Excediendo: ${app.utils.formatTime(tiempoExcedido)}`
                statusElement.style.color = "#ff6600"
              }
            }
          }
        })

        // Guardar el estado actualizado
        app.guardarEstadoEnBaseDeDatos()
      }

      enSegundoPlano = false
    }
  })

  // 4. Modificar la función cargarEstadoDesdeBaseDeDatos para usar ultimaActividadTimestamp
  if (app && app.cargarEstadoDesdeBaseDeDatos) {
    const originalCargarEstado = app.cargarEstadoDesdeBaseDeDatos

    app.cargarEstadoDesdeBaseDeDatos = function () {
      return originalCargarEstado.call(this).then((resultado) => {
        if (resultado && app.estado.ultimaActividadTimestamp) {
          const ahora = Date.now()
          const tiempoTranscurridoMs = ahora - app.estado.ultimaActividadTimestamp
          const tiempoTranscurridoSeg = Math.floor(tiempoTranscurridoMs / 1000)

          console.log(`Sesión reiniciada. Tiempo transcurrido desde último guardado: ${tiempoTranscurridoSeg} segundos`)

          // Solo actualizar si ha pasado un tiempo significativo (más de 5 segundos)
          if (tiempoTranscurridoSeg > 5) {
            // Actualizar los cronómetros que estaban en ejecución
            Object.keys(app.estado.timerStates).forEach((inicial) => {
              if (app.estado.timerStates[inicial] === "running") {
                app.estado.timers[inicial] += tiempoTranscurridoSeg

                // Actualizar la visualización del cronómetro
                const timerInput = document.getElementById(`${inicial}-timer`)
                if (timerInput) {
                  timerInput.value = app.utils.formatTime(app.estado.timers[inicial])
                }

                console.log(`Actualizado cronómetro ${inicial}: +${tiempoTranscurridoSeg} segundos`)

                // Verificar excesos para comida o break
                if (
                  (inicial === "C" || inicial === "B") &&
                  app.estado.timers[inicial] > app.estado.duracionesPermitidas[inicial]
                ) {
                  const tiempoExcedido = app.estado.timers[inicial] - app.estado.duracionesPermitidas[inicial]

                  // Actualizar la tabla de tiempos faltantes
                  app.estado.tiemposFaltantes[inicial] = tiempoExcedido
                  app.utils.actualizarTiemposFaltantes()

                  // Actualizar el estado visual
                  const statusElement = document.getElementById(`${inicial}-status`)
                  if (statusElement) {
                    statusElement.textContent = `Excediendo: ${app.utils.formatTime(tiempoExcedido)}`
                    statusElement.style.color = "#ff6600"
                  }
                }
              }
            })
          }
        }

        return resultado
      })
    }
  } else {
    console.error("No se encontró la función cargarEstadoDesdeBaseDeDatos en el objeto app")
  }

  // 5. Modificar guardarEstadoEnBaseDeDatos para incluir ultimaActividadTimestamp
  if (app && app.guardarEstadoEnBaseDeDatos) {
    const originalGuardarEstado = app.guardarEstadoEnBaseDeDatos

    app.guardarEstadoEnBaseDeDatos = function () {
      // Guardar la hora actual
      app.estado.ultimaActividadTimestamp = Date.now()

      // Llamar a la función original
      return originalGuardarEstado.call(this)
    }
  } else {
    console.error("No se encontró la función guardarEstadoEnBaseDeDatos en el objeto app")
  }

  console.log("Sistema de seguimiento en segundo plano inicializado")
})
