document.addEventListener('DOMContentLoaded', async () => {
  try {
    const datos = await fetchData('estadisticasJugador', { token });

    await fetchData('crearAccion', {
      accion: "Entró al perfil",
      SQLAccion: "Se buscó toda la información relevante sobre el usuario en la base de datos.",
      token
    });

    // Actualizar el contenido del perfil
    actualizarEstadisticasPerfil(datos);
  } catch (error) {
    console.error('Error al cargar datos:', error);
  }
});
// ----------------------------------------------------------------------------------
// Función para actualizar el contenido del perfil
// ----------------------------------------------------------------------------------
const actualizarEstadisticasPerfil = (datos) => {
  const elementos = {
    victorias: document.getElementById("victorias"),
    derrotas: document.getElementById("derrotas"),
    partidas: document.getElementById("partidas"),
    puntuacion: document.getElementById("puntuacion"),
    tiempoRecord: document.getElementById("tiempoRecord"),
    preguntasRecord: document.getElementById("preguntasRecord"),
    posicionTop: document.getElementById("posicionTop"),
    listaTop: document.getElementById("listaTop")
  };

  if(datos.tiempoRecord === "No estás en el top.") {
    var p = document.createElement('p')
    p.textContent = datos.tiempoRecord;
    elementos.tiempoRecord.parentNode.replaceChild(p, elementos.tiempoRecord);    
  }

  if(datos.posicionTop === "No estás en el top.") {
    var p = document.createElement('p')
    p.textContent = datos.posicionTop;
    elementos.posicionTop.parentNode.replaceChild(p, elementos.posicionTop);    
  }  

  elementos.victorias.textContent = datos.victorias;
  elementos.derrotas.textContent = datos.derrotas;
  elementos.partidas.textContent = datos.partidas;
  elementos.puntuacion.textContent = datos.puntuacion;
  elementos.tiempoRecord.textContent = datos.tiempoRecord;
  elementos.preguntasRecord.textContent = datos.preguntaRecord;
  elementos.posicionTop.textContent = datos.posicionTop;
  elementos.listaTop.textContent = '';

  if (datos.top10) {
    datos.top10.forEach(({ usuario, tiempo, id }) => {
      const itemLista = document.createElement("div");
      itemLista.textContent = `${usuario} - ${tiempo} seg`;
      itemLista.setAttribute("data-id", id);
      elementos.listaTop.appendChild(itemLista);

      // Crear el tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = 'ID: '+id;
      tooltip.style.display = "none";
      document.body.appendChild(tooltip);

      // Mostrar el tooltip al pasar el mouse
      itemLista.addEventListener("mouseover", (event) => {
        itemLista.style.color = 'var(--color_decorativo)';
        tooltip.style.display = "block";
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY - 10}px`;
      });

      // Ocultar el tooltip al salir del mouse
      itemLista.addEventListener("mouseout", () => {
        itemLista.style.color = 'BLACK';
        tooltip.style.display = "none";
      });
    });
  } else {
    elementos.listaTop.textContent = "Nadie se encuentra en el TOP.";
  }  
};