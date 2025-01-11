let id;
let estatus, nivel_cuenta, posicioTOP;
let auditor;

// ----------------------------------------------------------------------------------
// BOTON BUSCAR
// -----------------------------------------------------------------------------------
document.getElementById('input-buscar').addEventListener('click', async function() {
  const identificacion = document.getElementById("identificador").value;
  if (!identificacion) {
    document.getElementById("noEncontrado").style.display = "block";
    return;
  }
  
  document.getElementById("registros").style.display = "none";
  document.getElementById("error-adminNoManipulable").style.display = "none";
  document.getElementById("error-adminNoManipulable-partida").style.display = "none";

  try {
    const data = await fetchData('buscarUsuario', { identificacion, token });

    if (!data.existe) {
      document.getElementById("noEncontrado").style.display = "block";
      return;
    }

    document.getElementById("noEncontrado").style.display = "none";
    actualizarPerfil(data);
    await cargarAccionesUsuario(identificacion);
  } catch (err) {
    console.error(err);
    document.getElementById("errorBD").style.display = "block";
  }
});

// ----------------------------------------------------------------------------------
// MOSTRAR INFORMACION DEL USUARIO
// -----------------------------------------------------------------------------------
const actualizarPerfil = (data) => {
  const options = { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  id = data.id;
  estatus = data.estatus;
  nivel_cuenta = data.nivelUsuario;
  posicioTOP = data.posicionTOP;

  document.getElementById("boton-activar-inactivar").style.display = "block";
  if (data.nivelUsuario === "ADMIN" && data.auditorNivel !== "MANAGER" && data.adminID !== data.id) {
    document.getElementById("error-adminNoManipulable").style.display = "block";
    document.getElementById("boton-activar-inactivar").style.display = "none";
  }

  if (data.auditorNivel === "MANAGER") {
    document.getElementById("boton-toggleNivel").style.display = "block";
  }

  if (data.nivelUsuario === "MANAGER") {
    document.getElementById("boton-toggleNivel").style.display = "none";
    document.getElementById("boton-activar-inactivar").style.display = "none";
  }

  document.getElementById("posicionTop-usuario").innerHTML = estatus === "INACTIVO" 
  ? `Posición TOP: <br>${posicioTOP}<br>(No está en el top por cuenta inactivada.)` 
  : `Posición TOP: <br>${posicioTOP}`;

  document.getElementById("foto-usuario").src = "../" + data.foto_perfil;
  document.getElementById("nombre-usuario").textContent = data.nombre;
  document.getElementById("id-usuario").textContent = "ID: " + data.id;
  document.getElementById("email-usuario").innerHTML = "Email: <br>" + data.email;
  document.getElementById("telefono-usuario").innerHTML = "Teléfono: <br>" + data.telefono;
  document.getElementById("nacimiento-usuario").innerHTML = "Fecha nacimiento: <br>" + data.fecha_nacimiento;
  document.getElementById("registro-usuario").innerHTML = "Fecha registro: <br>" + new Date(data.fecha_registro).toLocaleString('en-US', options);
  document.getElementById("ultimaSesion-usuario").innerHTML = "Última sesión: <br>" + new Date(data.ultima_sesion).toLocaleString('en-US', options) + " (UTC)";
  document.getElementById("victorias-usuario").innerHTML = "Victorias: <br>" + data.victorias;
  document.getElementById("derrotas-usuario").innerHTML = "Derrotas: <br>" + data.derrotas;
  document.getElementById("partidas-usuario").innerHTML = "Partidas: <br>" + data.partidas;
  document.getElementById("puntos-usuario").innerHTML = "Puntuación récord: <br>" + data.puntuacion;
  document.getElementById("preguntaNro-usuario").innerHTML = "Preguntas récord: <br>" + data.pregunta;
  document.getElementById("tiempoRecord-usuario").innerHTML = "Tiempo récord: <br>" + data.tiempoRecord;
  document.getElementById("estatus-usuario").innerHTML = "Estado: <br>" + data.estatus;
  document.getElementById("nivel-usuario").innerHTML = "Nivel cuenta: <br>" + data.nivelUsuario;

  if (data.partida) {
    mostrarPartidaGuardada(data);
  } else {
    ocultarPartidaGuardada();
  }
};

// ----------------------------------------------------------------------------------
// MOSTRAR INFORMACION DE LA PARTIDA GUARDADA POR EL USUARIO
// -----------------------------------------------------------------------------------
const mostrarPartidaGuardada = async (data) => {
  document.getElementById("error-noTienePartida").style.display = "none";
  document.getElementById("partida-pregunta").style.display = "block";
  document.getElementById("partida-puntos").style.display = "block";
  document.getElementById("partida-preguntaNumero").style.display = "block";
  document.getElementById("partida-vidas").style.display = "block";
  document.getElementById("partida-tiempo").style.display = "block";
  document.getElementById("partida-cronometro").style.display = "block";
  document.getElementById("partida-preguntasLista").style.display = "block";
  document.getElementById("partida-comodines").style.display = "block";

  const solicitud = await fetchData('buscarPregunta', { id: data.partidaGuardada_preguntaID });

  const preguntaNombre = solicitud.pregunta;

  document.getElementById("boton-borrarPartida").style.display = "block";
  if (data.nivelUsuario === "ADMIN" && data.auditorNivel !== "MANAGER" && data.auditorID !== data.id) {
    document.getElementById("error-adminNoManipulable-partida").style.display = "block";
    document.getElementById("boton-borrarPartida").style.display = "none";
  }

  function reemplazarNumeros(array) {
    const mapeo = {
        1: "ConsultarIA",
        2: "Vida extra",
        3: "Eliminar 2",
        4: "Saltar pregunta"
    };

    if (array.length === 0) {
      return "Ninguno.";
    }

    const todosComodines = [1, 2, 3, 4];
    const contieneTodos = todosComodines.every(num => array.includes(num));

    if (contieneTodos) {
      return "Todos los comodines.";
    }

    const resultado = array.map(numero => mapeo[numero]).join("<br>");
    return resultado;
  }

  const preguntasGuardadas = data.partidaGuardada_preguntas
  .replace(/[\[\]]/g, '') // Eliminar corchetes
  .replace(/,/g, ' - '); // Reemplazar comas por ' - '

  document.getElementById("partida-pregunta").innerHTML = "Pregunta: (ID: " + data.partidaGuardada_preguntaID + ")<br>" + preguntaNombre;
  document.getElementById("partida-puntos").innerHTML = "Puntuación: <br>" + data.partidaGuardada_puntos;
  document.getElementById("partida-preguntaNumero").innerHTML = "Pregunta número: <br>" + data.partidaGuardada_preguntaNro;
  document.getElementById("partida-vidas").innerHTML = "Vidas: <br>" + data.partidaGuardada_vidas;
  document.getElementById("partida-tiempo").innerHTML = "Tiempo pregunta: <br>" + data.partidaGuardada_tiempo;
  document.getElementById("partida-cronometro").innerHTML = "Cronómetro: <br>" + data.partidaGuardada_cronometro;
  document.getElementById("partida-preguntasLista").innerHTML = "Preguntas almacenadas (ID): <br>" + preguntasGuardadas;
  document.getElementById("partida-comodines").innerHTML = "Comodines utilizados: <br>" + reemplazarNumeros(data.partidaGuardada_comodines);
};

// ----------------------------------------------------------------------------------
// OCULTAR INFORMACION DE LA PARTIDA GUARDA POR EL JUGADOR SI NO TIENE GUARDADA
// -----------------------------------------------------------------------------------
const ocultarPartidaGuardada = () => {
  document.getElementById("boton-borrarPartida").style.display = "none";
  document.getElementById("error-noTienePartida").style.display = "block";
  document.getElementById("partida-pregunta").style.display = "none";
  document.getElementById("partida-puntos").style.display = "none";
  document.getElementById("partida-preguntaNumero").style.display = "none";
  document.getElementById("partida-vidas").style.display = "none";
  document.getElementById("partida-tiempo").style.display = "none";
  document.getElementById("partida-cronometro").style.display = "none";
  document.getElementById("partida-preguntasLista").style.display = "none";
  document.getElementById("partida-comodines").style.display = "none";  
};

// ----------------------------------------------------------------------------------
// LISTADO DE ACCIONES DEL USUARIO
// -----------------------------------------------------------------------------------
const cargarAccionesUsuario = async (identificacion) => {
  const registrosContainer = document.getElementById("registros");

  document.getElementById("error-sinRegistros").style.display = "none";
  registrosContainer.style.display = "block";
  document.getElementById("boton-recargarAcciones").style.display = "flex";
  registrosContainer.innerHTML = "";

  if (!identificacion) {
    document.getElementById("error-sinRegistros").style.display = "block";
    return;
  }  

  const accionesUsuarioFetch = await fetchData('accionesDeUsuario', { identificacion });

  if (!accionesUsuarioFetch || accionesUsuarioFetch.length === 0) {
    document.getElementById("error-sinRegistros").style.display = "block";
    return;
  }

  const fragment = document.createDocumentFragment();

  accionesUsuarioFetch.reverse().forEach(accion => {
    const hr = document.createElement('hr');
    const accionDiv = document.createElement('div');
    accionDiv.innerHTML = `
      ID: ${accion.id_accion}<br>
      Descripción: ${accion.accion}<br>
      IP: ${accion.ip_usuario}<br>
      Fecha: ${new Date(accion.fecha_accion).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })} (UTC)<br>
    `;
    fragment.appendChild(hr);
    fragment.appendChild(accionDiv);
  });

  registrosContainer.appendChild(fragment);
};

// ----------------------------------------------------------------------------------
// BOTON RECARGAR ACCIONES DE USUARIO
// -----------------------------------------------------------------------------------
document.getElementById('boton-recargarAcciones').addEventListener('click', async function() {
  const identificacion = document.getElementById("identificador").value;
  await cargarAccionesUsuario(identificacion);
});

// ----------------------------------------------------------------------------------
// BOTON MODIFICAR NIVEL DEL USUARIO ADMIN/USUARIO
// -----------------------------------------------------------------------------------
document.getElementById('boton-toggleNivel').addEventListener('click', async function() {
  nivel_cuenta = (nivel_cuenta === "ADMIN") ? "USUARIO" : "ADMIN";

  await fetchData('modificarNivel', { identificacion: id, token, nivel: nivel_cuenta });
  document.getElementById("nivel-usuario").innerHTML = "Nivel cuenta: <br>" + nivel_cuenta;
});

// ----------------------------------------------------------------------------------
// BOTON MODIFICAR ESTATUS DEL USUARIO ACTIVO/INACTIVO
// -----------------------------------------------------------------------------------
document.getElementById('boton-activar-inactivar').addEventListener('click', async function() {
  estatus = (estatus === "INACTIVO") ? "ACTIVO" : "INACTIVO";
  
  document.getElementById("posicionTop-usuario").innerHTML = estatus === "INACTIVO" 
    ? `Posición TOP: <br>${posicioTOP}<br>(No está en el top por cuenta inactivada.)` 
    : `Posición TOP: <br>${posicioTOP}`;

  await fetchData('inactivarUsuario', { identificacion: id, token, estado: estatus });
  document.getElementById("estatus-usuario").innerHTML = "Estado: <br>" + estatus;
});

// ----------------------------------------------------------------------------------
// BOTON BORRAR PARTIDA GUARDADA DEL USUARIO
// -----------------------------------------------------------------------------------
document.getElementById('boton-borrarPartida').addEventListener('click', async function() {
  await fetchData('buscarPartida', { borrar: true, idUsuarioADMIN: id, token });

  ocultarPartidaGuardada();
});

// ----------------------------------------------------------------------------------
// BUSCAR INFORMACION SOBRE UNA PREGUNTA
// -----------------------------------------------------------------------------------
document.getElementById('buscarPregunta').addEventListener('click', async function() {
  const identificacion = document.getElementById("id-pregunta").value;
  if (!identificacion || isNaN(identificacion)) {
    document.getElementById("error-preguntaNoEncontrada").style.display = "block";
    return;
  }

  try {
    const pregunta = await fetchData('buscarPregunta', { id: identificacion});

    if (!pregunta.existe) {
      document.getElementById("error-preguntaNoEncontrada").style.display = "block";
      return;
    }

    document.getElementById("error-preguntaNoEncontrada").style.display = "none";
    document.getElementById("pregunta_nombre").innerHTML = `Pregunta: (ID: ${pregunta.id})<br>${pregunta.pregunta}`;
    document.getElementById("respuesta_correcta").innerHTML = "Respuesta correcta: <br>" + pregunta.respuesta_correcta;
    document.getElementById("respuestas_incorrectas").innerHTML = "Respuestas incorrectas: <br>" + pregunta.respuestas_incorrectas.join(', ');
    document.getElementById("categoria").innerHTML = "Categoría: <br>" + pregunta.categoria;
    document.getElementById("dificultad").innerHTML = "Dificultad: <br>" + pregunta.dificultad;
    document.getElementById("consultarIA").innerHTML = "ConsultarIA: <br>" + pregunta.consultarIA;

    await fetchData('crearAccion', {
      accion: `Buscó información sobre la pregunta: <br>${pregunta.pregunta} (ID: ${identificacion})<br>`,
      SQLAccion: "Se buscó información en la tabla 'preguntas'.",
      token
    });

  } catch (err) {
    console.error(err);
    document.getElementById("errorSolicitud").style.display = "block";
  }
});