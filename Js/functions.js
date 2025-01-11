url = "http://localhost";

// ----------------------------------------------------------------------------------
// REDIRIGIR CUANDO ESTE EN EL INDEX
// ----------------------------------------------------------------------------------
if (window.location.pathname === '/quetantosabes') {
  setTimeout(() => {
    window.location.replace('quetantosabes/pages/inicio.html');
  }, 3000);
}

// ----------------------------------------------------------------------------------
// ABRIR MENU DESPLEGABLE (PERFIL)
// ----------------------------------------------------------------------------------
function botonPerfil() {
  let perfil = document.getElementById('perfil');
  perfil.style.display = (perfil.style.display === 'none' || perfil.style.display === '') ? 'block' : 'none';
}

// ----------------------------------------------------------------------------------
// PARRAFO DE BIENVENIDA EN EL INICIO
// ----------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  if (window.location.pathname === '/quetantosabes/pages/inicio.html') {
    const textoBienvenida = `¡Bienvenido, aventurero! Hoy te invitamos a descubrir los secretos y maravillas de la hermosa Venezuela a través de "¿Qué tanto sabes?", un juego de trivia que pondrá a prueba tus conocimientos y te hará sonreír. Explora nuestras ricas tradiciones y curiosidades, y no olvides invitar a tus amigos a unirse a la diversión.

    Recuerda que si alguna pregunta te deja en blanco, siempre puedes decir que es "un misterio de la arepa", porque, al fin y al cabo, las arepas son un tesoro lleno de sorpresas. Así que, ¿estás listo para comenzar esta emocionante aventura?
    ¡Vamos a jugar y aprender juntos!`;

    let index = 0;
    const escribirTexto = () => {
      const elementoTexto = document.getElementById('parrafo-bienvenida');
      if (index < textoBienvenida.length) {
        elementoTexto.textContent += textoBienvenida.charAt(index);
        index++;
        setTimeout(escribirTexto, 20);
      }
    };
    escribirTexto();
  }

  // ----------------------------------------------------------------------------------
  // PANTALLA DE CARGA
  // ----------------------------------------------------------------------------------
  const pantalla_carga = document.getElementById("pantalla-carga")
  if (pantalla_carga && document.getElementById("contenido").style.display !== 'block') {
    setTimeout(() => {
      document.getElementById("contenido").style.display = "block";
      pantalla_carga.style.display = "none";
    }, 100);
  }

  // ----------------------------------------------------------------------------------
  // SCROLL EN EL PATH #target HACIA EL FORMULARIO
  // ----------------------------------------------------------------------------------
  if (window.location.hash === '#target') {
    const seccionLogin = document.getElementById('target');
    if (seccionLogin) {
      setTimeout(() => {
        seccionLogin.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1000);
    }
  }

  // ----------------------------------------------------------------------------------
  // DESPLAZAMIENTO HACIA ARRIBA CON EL LOGO
  // ----------------------------------------------------------------------------------
  if (window.location.pathname !== '/quetantosabes') {
    const scrollToTopButton = document.getElementById("scrollToTop");

    if (scrollToTopButton) {
      scrollToTopButton.onclick = (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
  }

  // ----------------------------------------------------------------------------------
  // CERRAR MENU DESPLEGABLE (PERFIL)
  // ----------------------------------------------------------------------------------

  window.addEventListener('scroll', () => {
    let perfil = document.getElementById('perfil');
    if(perfil) {
      perfil.style.display = 'none';
    }
  });

  // ----------------------------------------------------------------------------------
  // OBTENER COOKIE
  // ----------------------------------------------------------------------------------
  function getCookie(nombre) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nombre}=`);
    if (partes.length === 2) return partes.pop().split(';').shift();
    return null; // Devuelve null si la cookie no se encuentra
  }

  // Función para mostrar estadísticas en la carta del perfil en el header
  token = getCookie("token");

  if (token) {
    try {
      const datos = await fetchData('estadisticasJugador', { token });

      setTimeout(() => {
        document.getElementById("victorias-usuario-header").innerHTML = "Victorias: <br>" + datos.victorias;
        document.getElementById("derrotas-usuario-header").innerHTML = "Derrotas: <br>" + datos.derrotas;  
      }, 120)

    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  } else {
    const rutasProtegidas = [
      '/quetantosabes/pages/perfil',
      '/quetantosabes/pages/game',
      '/quetantosabes/pages/admin'
    ];

    if (rutasProtegidas.some(ruta => window.location.pathname.startsWith(ruta))) {
      // Redirigir si no hay token
      window.location.replace(url + '/quetantosabes/pages/inicio.html#target');
    }
  }
});