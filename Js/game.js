
document.addEventListener('DOMContentLoaded', async () => {
  let numerosUsados = [];
  let comodinesUsados = [];
  let preguntaNro;
  let intervalo; 
  let respuestaCorrecta; 
  let puntos = 0;
  let pregunta;
  let preguntaId;
  let vidas = 3;
  let contadorTiempo;
  let tiempoPartida;
  let opcionBorrar1, opcionBorrar2;
  let perdio = false;
  let inicioCronometro;
  let consultarIA;

  const corazones = [
    document.getElementById('corazon1'),
    document.getElementById('corazon2'),
    document.getElementById('corazon3'),
    document.getElementById('corazon4')
  ];  
  const corazonIntacto = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="24px" height="24px">
  <path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z">
  </path>
  </svg>
  `;

  const corazonRoto = 
  `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" stroke-linecap="round" stroke-linejoin="round" width="24px" height="24px" stroke-width="2">
  <path d="M3 3l18 18"></path>
  <path d="M19.5 12.572l-1.5 1.428m-2 2l-4 4l-7.5 -7.428a5 5 0 0 1 -1.288 -5.068a4.976 4.976 0 0 1 1.788 -2.504m3 -1c1.56 0 3.05 .727 4 2a5 5 0 1 1 7.5 6.572"></path>
  </svg>
  `;

  // ----------------------------------------------------------------------------------
  // FUNCION DE GUARDAR PARTIDA
  // -----------------------------------------------------------------------------------  
  async function guardarPartida() {
    await fetchData('guardarPartida', {
      token,
      preguntaNro,
      preguntaId: preguntaId,
      vidas,
      puntos,
      numerosUsados,
      tiempo: contadorTiempo,
      tiempoPartida,
      comodines: comodinesUsados
    });
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE INCIAR CONTADOR DE PARTIDA
  // -----------------------------------------------------------------------------------
  function iniciarCronometro() {
    inicioCronometro = new Date().toISOString();
    return inicioCronometro
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE FINALIZAR Y CALCULAR TIEMPO DE PARTIDA
  // -----------------------------------------------------------------------------------
  function finalizarCronometro() {
    const resultadoCronometro = new Date().toISOString();
    const cronometro = new Date(resultadoCronometro) - new Date(inicioCronometro);
    tiempoPartida = cronometro / 1000;
    return tiempoPartida;
  }

  // ----------------------------------------------------------------------------------
  // FUNCION PARA CREAR CONFETI AL GANAR
  // -----------------------------------------------------------------------------------  
  const contenedor = document.getElementById('contenedor-confeti');

  function crearConffeti() {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.backgroundColor = colorRandom();
    contenedor.appendChild(confetti);
    confetti.addEventListener('animationend', () => {
      confetti.remove();
    });
  }

  function colorRandom() {
    const random = Math.floor(Math.random() * 16777215).toString(16);
    return `#${random.padStart(6, '0')}`;
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE GANAR
  // -----------------------------------------------------------------------------------  
  async function win() {
    await fetchData('ganoPerdioNueva', {
      token,
      derrota: false,
      partidaNueva: false,
      tiempo: tiempoPartida,
      puntos,
      preguntasNro: preguntaNro
    });

    await fetchData('buscarPartida', { token, borrar: true });

    document.getElementById("partida").style.paddingTop = "200px";
    document.getElementById("partida").style.paddingBottom = "200px";
    document.getElementById("partidaGuardada").style.display = "none";
    document.getElementById("cargarPartida").style.display = "none";
    document.getElementById('contenedor-confeti').style.display = "block";
    
    let confettiInterval = setInterval(crearConffeti, 100);
    clearInterval(intervalo);
    
    const botones = document.querySelectorAll('.boton');
    const comodines = document.querySelectorAll('.comodin');

    botones.forEach(boton => {
      boton.style.display = "none";
    });
    
    comodines.forEach(comodin => {
      comodin.style.display = "none";
    });    
    
    document.getElementById("game-win").style.display = "block";
    const winElement = document.querySelector('.game-win');
    winElement.style.opacity = 1;

    setTimeout(() => {
      clearInterval(confettiInterval);
      document.getElementById('consultarIA').textContent = '';
      document.getElementById('consultarIA').style.display = 'none';
      document.getElementById('contenedor-confeti').style.display = "none";
      document.getElementById("game-win").style.display = "none";
      document.getElementById('contenedor-menu').style.display = "flex";
      document.getElementById('partida').style.display = "none";
      document.getElementById("partida").style.paddingTop = "140px";
      document.getElementById("partida").style.paddingBottom = "140px"; 
      mejorPartida();
    }, 5000);
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE GAME OVER (SE TERMINO LA PARTIDA)
  // -----------------------------------------------------------------------------------  
  async function gameOver(respuestaCorrecta) {
    perdio = true;
    const botones = document.querySelectorAll('.boton');
    const comodines = document.querySelectorAll('.comodin');    

    botones.forEach(boton => {
      boton.style.display = "none";
    });
    
    comodines.forEach(comodin => {
      comodin.style.display = "none";
    });
    
    document.getElementById('cargarPartida').style.display = "none";
    document.getElementById('partidaGuardada').style.display = "none";
    document.getElementById(respuestaCorrecta).style.color = "GREEN";
    document.getElementById(respuestaCorrecta).style.fontWeight = "700";
    document.getElementById("partida").style.paddingTop = "140px";
    document.getElementById("partida").style.paddingBottom = "140px";
    
    clearInterval(intervalo);
    document.getElementById("game-over").style.display = "block";
    finalizarCronometro();

    try {
      await fetchData('buscarPartida', { token, borrar: true });
      await fetchData('ganoPerdioNueva', {
        token,
        derrota: true,
        partidaNueva: false,
        tiempo: tiempoPartida,
        puntos,
        preguntasNro: preguntaNro
      });
    } catch (error) {
      console.error('Error fetch buscar partida:', error);
    }

    setTimeout(() => {
      document.getElementById('consultarIA').textContent = '';
      document.getElementById('consultarIA').style.display = 'none';
      document.getElementById("game-over").style.display = "none";
      document.getElementById('contenedor-menu').style.display = "flex";
      document.getElementById('partida').style.display = "none";
      document.getElementById(respuestaCorrecta).style.color = "black";
      document.getElementById(respuestaCorrecta).style.fontWeight = "400";
      perdio = false;
      mejorPartida();
    }, 5000);
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE CARGAR PREGUNTA DE PREGUNTAS.JSON
  // -----------------------------------------------------------------------------------  
  async function cargarPreguntas(id_pregunta, tiempoPregunta) {
    const botones = document.querySelectorAll('.boton');
    botones.forEach(boton => boton.style.display = "block");

    // Asegurarse de que numerosUsados sea un array
    if (!Array.isArray(numerosUsados)) {
      numerosUsados = JSON.parse(numerosUsados);
    }

    // Limpiar el temporizador anterior si existe
    if (intervalo) {
      clearInterval(intervalo);
    }

    function opcionRandom() {
      const array = ["opcion1", "opcion2", "opcion3", "opcion4"];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    preguntaNro++;

    const posicion = ["opcion1", "opcion2", "opcion3", "opcion4"];//opcionRandom();
    const data = await fetchData('preguntaRandom', { id: id_pregunta, preguntaNro, numerosUsados });
    console.log('Respuesta de fetchData:', data);

    pregunta = data;
    numerosUsados = data.numerosUsados;
    contadorTiempo = tiempoPregunta === null ? 60 : tiempoPregunta;
    consultarIA = pregunta.consultarIA;
    preguntaId = pregunta.id;
    correcta = posicion[0];
    opcionBorrar1 = posicion[1];
    opcionBorrar2 = posicion[2];
    respuestaCorrecta = posicion[0];

    // Limpiar la interfaz de usuario
    document.getElementById('consultarIA').textContent = '';
    document.getElementById('consultarIA').style.display = 'none';
    document.getElementById("titulo-preguntaNRO").textContent = `Pregunta #${preguntaNro}`;  
    document.getElementById("pregunta").textContent = pregunta.pregunta;
    document.getElementById(posicion[0]).textContent = pregunta.respuesta_correcta;
    document.getElementById(posicion[1]).textContent = pregunta.respuestas_incorrectas[0];
    document.getElementById(posicion[2]).textContent = pregunta.respuestas_incorrectas[1];
    document.getElementById(posicion[3]).textContent = pregunta.respuestas_incorrectas[2];
    document.getElementById("categoria").textContent = `Categoria: ${pregunta.categoria}`;
    document.getElementById("puntos").textContent = `PUNTOS: ${puntos}  |`;
    document.getElementById("nivel").textContent = `  DIFICULTAD: ${pregunta.dificultad}  |  ID: ${pregunta.id}`;
    document.getElementById("tiempo").textContent = "Tiempo: " + contadorTiempo + " segundos";


    // Iniciar el temporizador
    function actualizarTiempo() {
      if (contadorTiempo <= 0) {
        clearInterval(intervalo);
        document.getElementById("tiempo").textContent = "Tiempo: 0 seg";
        vidaMenos();
        if (vidas <= 0) {
          gameOver(respuestaCorrecta);
        } else {
          cargarPreguntas(null, null);
        }
      } else {
        document.getElementById("tiempo").textContent = `Tiempo: ${contadorTiempo--} segundos`;
      }
    }

    actualizarTiempo();

    // Inicia el intervalo para que se ejecute cada 1000 ms
    intervalo = setInterval(actualizarTiempo, 1000);
  }
  
  // ----------------------------------------------------------------------------------
  // FUNCION DE MANEJAR BOTONES DE SELECCION PARA PREGUNTA
  // -----------------------------------------------------------------------------------
  function manejarBotones() {
    const botones = document.querySelectorAll('.boton');
  
    botones.forEach(boton => {
      boton.removeEventListener('click', manejarRespuesta);
      boton.addEventListener('click', manejarRespuesta);
    });
  }

  // ----------------------------------------------------------------------------------
  // FUNCION PARA MANEJAR LA RESPUESTA A LA FUNCION DE BOTONES ANTERIOR
  // -----------------------------------------------------------------------------------
  async function manejarRespuesta(event) {
    event.preventDefault();

    const valor = event.target.getAttribute('data-value');
        
    if (respuestaCorrecta === valor) {
      const barra_progreso = document.getElementById('barra-progreso');
      const porcentajeProgreso = (preguntaNro / 15) * 100;
      barra_progreso.value = porcentajeProgreso;

      puntos++;
      if (preguntaNro >= 15) {
        finalizarCronometro();
        document.getElementById("puntos").textContent = `PUNTOS: ${puntos}  |`;        
        return win();
      }

      await cargarPreguntas(null, null); // Llama a cargarPreguntas nuevamente
    } else {
      vidaMenos();
    }
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE RESTAR VIDA AL EQUIVOCARSE DE PREGUNTA
  // -----------------------------------------------------------------------------------
  function vidaMenos() {
    vidas--;

    // Actualizar los corazones visualmente
    for (let i = 0; i < corazones.length; i++) {
      if (i < vidas) {
        corazones[i].style.display = "block"; // Mostrar corazón
        corazones[i].innerHTML = corazonIntacto
      } else {
        corazones[i].innerHTML = corazonRoto
      }
    }

    if (vidas <= 0) {
      return gameOver(respuestaCorrecta);
    }    
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE RESTAR VIDA AL EQUIVOCARSE DE PREGUNTA
  // -----------------------------------------------------------------------------------
  function vidaMas() {
    vidas++;

    // Actualizar los corazones visualmente
    for (let i = 0; i < corazones.length; i++) {
      if (corazones[i].innerHTML === corazonRoto) {
        corazones[i].innerHTML = corazonIntacto;
        break;
      }
    }
  }

  // ----------------------------------------------------------------------------------
  // FUNCION DE INICIAR JUEGO CON cargarPreguntas() y manejarBotones()
  // -----------------------------------------------------------------------------------
  async function iniciarJuego(idPregunta, tiempoPregunta) {
    iniciarCronometro(); 
    await cargarPreguntas(idPregunta, tiempoPregunta);
    manejarBotones();
  }

  // ----------------------------------------------------------------------------------
  // CUANDO EL USUARIO LE DE CLICK A "NUEVA PARTIDA"
  // ----------------------------------------------------------------------------------- 
  document.getElementById('nuevaPartida').addEventListener("click", async () => {
    // BORRAR LA PARTIDA ANTERIOR DE LA BASE DE DATOS
    if(getComputedStyle(document.getElementById('cargarPartida')).display === 'block') {
      await fetchData('buscarPartida', { token, borrar: true });
    }

    await fetchData('ganoPerdioNueva', { token, partidaNueva: true });

    await fetchData('crearAccion', {
      accion: "Inicio una nueva partida",
      SQLAccion: "Se verificó si el usuario tenía una partida almacenada y si es así se eliminó.",
      token
    });

    // Reiniciar variables
    numerosUsados = [];
    preguntaNro = 0;
    puntos = 0;
    vidas = 3;

    document.getElementById('contenedor-menu').style.display = "none";
    document.getElementById('partida').style.display = "flex";

    for (let i = 0; i < corazones.length; i++) {
      if(i !== 3) {
        corazones[i].style.display = 'block';
      }

      corazones[i].innerHTML = corazonIntacto;
    }

    // Mostrar comodines
    const botones_comodines = document.querySelectorAll('.comodin');
    
    botones_comodines.forEach(comodin => {
      comodin.style.display = "block";
    });

    const comodines = {
      comodinConsultarIA: document.getElementById("comodinConsultarIA"),
      comodinEliminar2: document.getElementById("comodinEliminar2"),
      comodinVidaExtra: document.getElementById("comodinVidaExtra"),
      comodinSaltarPregunta: document.getElementById("comodinSaltarPregunta")
    }

    Object.values(comodines).forEach(comodin => {
      comodin.style.display = "block";
    });

    document.getElementById('barra-progreso').value = 0;
    document.getElementById('corazon4').style.display = "none";
    document.getElementById("comodines-utilizados").style.display = "none";

    iniciarJuego(null, null).catch(error => {
      console.error('Error al iniciar el juego:', error);
    });
  });

  // ----------------------------------------------------------------------------------
  // CUANDO EL USUARIO LE DE CLICK A "CARGAR PARTIDA"
  // -----------------------------------------------------------------------------------
  async function cargarPartida() {
    try {
      const datos = await fetchData('buscarPartida', { token, borrar: false })
      if (!datos.noPartida) return;

      // Mostrar informacion sobre la partida
      document.getElementById('cargarPartida').style.display = "block";
      document.getElementById('partidaGuardada').style.display = "block";       

      // Cargar datos de la partida
      numerosUsados = datos.numerosUsados;
      preguntaNro = datos.preguntaNro - 1;
      puntos = datos.puntos;
      vidas = datos.vidas; 

      // Actualizar la interfaz de usuario
      document.getElementById('vidasPartidaGuardada').innerHTML = "Vidas: <br>" + vidas;
      document.getElementById('tiempoPartidaGuardada').innerHTML = "Tiempo pregunta: <br>" + datos.tiempo + " seg";
      document.getElementById('preguntaPartidaGuardada').innerHTML = "Pregunta: <br>#" + datos.preguntaNro;
      document.getElementById('puntosPartidaGuardada').innerHTML = "Puntuación: <br>" + puntos;
      document.getElementById('tiempoTotalPartidaGuardada').innerHTML = "Tiempo partida: <br>" + datos.tiempoPartida + " seg";

      return datos;
    } catch (error) {
      console.error('Error cargar partida:', error);
    }
  }

  await cargarPartida().then((respuesta) => {
    document.getElementById('cargarPartida').addEventListener("click", async (event) => {
      await fetchData('crearAccion', {
      accion: "Cargo una partida guardada.",
      SQLAccion: "Se buscó en la base de datos la información de la partida que el usuario había guardado.",
      token
    });

      // Mostrar comodines usados
      respuesta.comodinesUsados.forEach((numeroComodin) => {
        if (numeroComodin === 1) {
          document.getElementById("comodinConsultarIA").style.display = "none";
        } else if (numeroComodin === 2) {
          document.getElementById("comodinEliminar2").style.display = "none";
        } else if (numeroComodin === 3) {
          document.getElementById("comodinVidaExtra").style.display = "none";

          corazones[3].style.display = 'block'

          corazones[3].innerHTML = vidas === 4 ? corazonIntacto : corazonRoto;

        // Actualizar los corazones visualmente
        for (let i = 0; i < corazones.length; i++) {
          if (i < vidas) {
            corazones[i].style.display = "block"; // Mostrar corazón
            corazones[i].innerHTML = corazonIntacto
          } else {
            corazones[i].innerHTML = corazonRoto
          }
        }

        } else if (numeroComodin === 4) {
          document.getElementById("comodinSaltarPregunta").style.display = "none";
        }
      });

      if (respuesta.comodinesUsados.length === 4) {
        document.getElementById("comodines-utilizados").style.display = "block";
      }

      // Actualizar los corazones visualmente
      for (let i = 0; i < corazones.length; i++) {
        if (i < vidas) {
          corazones[i].style.display = "block"; // Mostrar corazón
          corazones[i].innerHTML = corazonIntacto
        } else {
          corazones[i].innerHTML = corazonRoto
        }
      }      

      document.getElementById('contenedor-menu').style.display = "none";
      document.getElementById('partida').style.display = "flex";
      iniciarJuego(respuesta.preguntaId, respuesta.tiempo).catch(error => {
        console.error('Error al iniciar el juego:', error);
      });
    })
  });

  // ----------------------------------------------------------------------------------
  // CARGAR DATOS DE LA MEJOR PARTIDA
  // -----------------------------------------------------------------------------------
  async function mejorPartida() {
    try {
      const response = await fetchData('estadisticasJugador', { token });

      document.getElementById("puntosMejorPartida").innerHTML = "Puntuación: <br>" + response.puntuacion;
      document.getElementById("tiempoPartidaMejorPartida").innerHTML = "Tiempo partida: <br>" + response.tiempoRecord;
      document.getElementById("preguntaMejorPartida").innerHTML = "Pregunta: <br>#" + response.preguntaRecord;
      document.getElementById("topMejorPartida").innerHTML = "Posición TOP: <br>" + response.posicionTop;

    } catch (err) {
      console.error(err);
    }    
  }

  // Ejecutar la función para cargar la mejor partida al inicio
  mejorPartida();

  // ----------------------------------------------------------------------------------
  // COMODINES
  // -----------------------------------------------------------------------------------    
  const comodinConsultarIA = document.getElementById("comodinConsultarIA");
  const comodinEliminar2 = document.getElementById("comodinEliminar2");
  const comodinVidaExtra = document.getElementById("comodinVidaExtra");
  const comodinSaltarPregunta = document.getElementById("comodinSaltarPregunta");
  
  comodinConsultarIA.addEventListener('click', async function() {
    comodinConsultarIA.style.display = "none";
    comodinesUsados.push(1);

    console.log(consultarIA)
    document.getElementById('consultarIA').style.display = 'block';
    document.getElementById('consultarIA').textContent = consultarIA;

    if (comodinesUsados.length === 4) {
      document.getElementById("comodines-utilizados").style.display = "block";
    }  
    await fetchData('crearAccion', {
      accion: "Utilizó el comodín de 'consultar IA'",
      SQLAccion: "No hubo solicitud en la base de datos",
      token
    });
  });
  
  comodinEliminar2.addEventListener('click', async function() {
    comodinEliminar2.style.display = "none";
    comodinesUsados.push(2);
    
    document.getElementById("boton_" + opcionBorrar1).style.display = "none";
    document.getElementById("boton_" + opcionBorrar2).style.display = "none";
        
    if (comodinesUsados.length === 4) {
      document.getElementById("comodines-utilizados").style.display = "block";
    }  
    await fetchData('crearAccion', {
      accion: "Utilizó el comodín de 'Eliminar 2 opciones'",
      SQLAccion: "No hubo solicitud en la base de datos",
      token
    });
  });
  
  comodinVidaExtra.addEventListener('click', async function() {
    comodinVidaExtra.style.display = "none";
    comodinesUsados.push(3);
    
    document.getElementById("corazon4").style.display = "block";
    vidaMas()
        
    if (comodinesUsados.length === 4) {
      document.getElementById("comodines-utilizados").style.display = "block";
    }  
    await fetchData('crearAccion', {
      accion: "Utilizó el comodín de 'vida extra' teniendo ahora: " + vidas + " vidas.",
      SQLAccion: "No hubo solicitud en la base de datos",
      token
    });
  });
  
  comodinSaltarPregunta.addEventListener('click', async function() {
    comodinSaltarPregunta.style.display = "none";
    comodinesUsados.push(4);
    if (comodinesUsados.length === 4) {
      document.getElementById("comodines-utilizados").style.display = "block";
    }  
    await cargarPreguntas(null, null);
    await fetchData('crearAccion', {
      accion: "Utilizó el comodín de 'Saltar pregunta'",
      SQLAccion: "No hubo solicitud en la base de datos",
      token
    });
  }); 
  
  // ----------------------------------------------------------------------------------
  // CUANDO EL USUARIO SE RETIRE DEL JUEGO SE ALMACENE LA PARTIDA AUTOMATICAMENTE
  // -----------------------------------------------------------------------------------  
  window.onbeforeunload = function() {
    if (document.getElementById('partida').style.display === "flex" && !perdio) {
      finalizarCronometro();
      guardarPartida(); // Espera a que se guarde la partida
    }
  };
});