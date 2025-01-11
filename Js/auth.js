// ----------------------------------------------------------------------------------
// ENVIAR SOLICITUDES AL SERVIDOR
// -----------------------------------------------------------------------------------
async function fetchData(action, body) {
  const response = await fetch('/quetantosabes/index.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body })
  });

  if (!response.ok) {
    console.error('Error en la respuesta de la red: ' + response.statusText);
  }

  const textResponse = await response.text();
  if(!textResponse) return;

  let result;
  try {
    result = JSON.parse(textResponse);
  } catch (error) {
    result = console.log(textResponse)
  }
  
  return result;
}

// ----------------------------------------------------------------------------------
// BOTON INICIAR SESION O REGISTRARSE
// -----------------------------------------------------------------------------------
function alternarFormulario() {
  const formIniciarSesion = document.getElementById('formularioIniciarSesion');
  const formRegistrar = document.getElementById('formularioRegistro');

  // Alterna la visibilidad del inicio de sesión o registro
  if (formRegistrar.style.display === 'none') {
    formRegistrar.style.display = 'block';
    formIniciarSesion.style.display = 'none';
  } else {
    formIniciarSesion.style.display = 'block';
    formRegistrar.style.display = 'none';
  }
}

// ----------------------------------------------------------------------------------
// BOTON DE VER CONTRASEÑAS EN FORMULARIOS
// -----------------------------------------------------------------------------------
function configurarBotonesToggleContrasena() {
  document.querySelectorAll('.toggle-contrasena').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.previousElementSibling;
      const tipo = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', tipo);

      // Cambiar el SVG según el tipo de input
      const svg = button.querySelector('svg');
      svg.innerHTML = tipo === 'text' ? `
        <path d="m10.79 12.912-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a3.5 3.5 0 0 0-4.474-4.474z"/>
        <path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z"/>
      ` : `
        <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
        <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
      `;
    });
  });
}

// ----------------------------------------------------------------------------------
// VALIDAR Y ENVIAR INICIO DE SESION
// -----------------------------------------------------------------------------------
async function iniciarSesion(event) {
  event.preventDefault();
  const email = document.getElementById('emailSesion').value;  
  const contrasena = document.getElementById('contrasenaSesion').value;

  // Obtener elementos de error
  const emailError = document.getElementById('emailLoginError');
  const contrasenaError = document.getElementById('contrasenaLoginError');
  const errorElements = document.querySelectorAll('.error');

  // Ocultar todos los mensajes de error al inicio
  errorElements.forEach(error => error.style.display = 'none'); 

  let formularioValido = true;

  // Validar correo
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.style.display = 'block'; 
      formularioValido = false;
  }  

  // Validar contraseña
  if (!contrasena || contrasena.length < 8) {
      contrasenaError.style.display = 'block';
      formularioValido = false;
  }

  // Si hay errores en la validación de campos, no se procede a la verificación del servidor
  if (!formularioValido) {
      return;
  }

  // Hacemos una solicitud POST al servidor para verificar el correo y la contraseña
  try {
      const data = await fetchData('login', { email, contrasena });

      if (data.cuentaExistente) {
          if (!data.datos) {
              emailError.style.display = 'none';
              contrasenaError.style.display = 'block';
              formularioValido = false;
          }
      } else {
          emailError.style.display = 'block';
          contrasenaError.style.display = 'none';
          formularioValido = false;
      }
  } catch (error) {
      console.error('Error:', error);
      document.querySelector('.error-solicitud').style.display = 'block'; // Muestra un mensaje de error si la solicitud falla
      formularioValido = false;
  }

  if (formularioValido) {
      window.location.replace('game.html'); // Redirigir a la página del juego
  }
}

// ----------------------------------------------------------------------------------
// VALIDAR Y ENVIAR REGISTRO
// -----------------------------------------------------------------------------------
async function registrarUsuario(event) {
  event.preventDefault();
  const usuario = document.getElementById('usuario').value;
  const fechaNacimiento = document.getElementById('fecha_nacimiento').value;
  const telefono = document.getElementById('telefono').value;
  const email = document.getElementById('email').value;
  const contrasena = document.getElementById('contrasena').value;
  const contrasenaConfirmacion = document.getElementById('contrasenaConfirmacion').value;

  // Obtener elementos de error
  const errores = {
      usuario: document.getElementById('usuarioError'),
      telefono: document.getElementById('telefonoError'),
      fecha_nacimiento: document.getElementById('fecha_nacimientoError'),
      email: document.getElementById('emailError'),
      contrasena: document.getElementById('contrasenaError'),
      contrasenaConfirmacion: document.getElementById('contrasenaConfirmError'),
      emailDuplicado: document.getElementById("emailDupliError"),
      telefonoDuplicado: document.getElementById("telefonoDupliError")
  };

  // Ocultar todos los mensajes de error al inicio
  Object.values(errores).forEach(error => error.style.display = 'none'); 
  let formularioValido = true;

  // Validar nombre
  if (!usuario || usuario.length < 2 || usuario.length > 50 || !/^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s]+$/.test(usuario)) {
      errores.usuario.style.display = 'block';
      formularioValido = false;
  }

  // Validar edad
  const yearNacimiento = fechaNacimiento.split("-");
  const fechaActual = new Date();
  const year = fechaActual.getFullYear();

  if (year - yearNacimiento[0] < 13) {
      errores.fecha_nacimiento.style.display = 'block'; 
      formularioValido = false;
  }

  // Validar teléfono
  if (!telefono || isNaN(telefono) || telefono.length < 7 || telefono.length > 11) {
      errores.telefono.style.display = 'block'; 
      formularioValido = false;
  }

  // Validar correo
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errores.email.style.display = 'block'; 
      formularioValido = false;
  }

  // Validar contraseña
  if (!contrasena || contrasena.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(contrasena)) {
      errores.contrasena.style.display = 'block';
      formularioValido = false;
  }

  // Validar confirmación de contraseña
  if (contrasena !== contrasenaConfirmacion) {
      errores.contrasenaConfirmacion.style.display = 'block'; 
      formularioValido = false;
  }

  // Si hay errores en la validación de campos, no se procede a la verificación del servidor
  if (!formularioValido) {
      return;
  }  

  // Hacemos una solicitud POST al servidor para verificar el correo y teléfono
  try {
      const data = await fetchData('verificar-email-telefono', { email, telefono });

      if (data.registrado) {
          if (data.tipo === 'correo') {
              errores.emailDuplicado.style.display = 'block';
              errores.telefonoDuplicado.style.display = 'none'; // Ocultamos el mensaje de teléfono
          } else {
              errores.telefonoDuplicado.style.display = 'block';
              errores.emailDuplicado.style.display = 'none'; // Ocultamos el mensaje de correo
          }
          formularioValido = false;
      }
  } catch (error) {
      console.error('Error:', error);
      document.querySelector('.error-solicitud-registro').style.display = 'block'; // Muestra un mensaje de error si la solicitud falla
      formularioValido = false;
  }

  // Si no hay errores, se puede enviar el formulario
  if (formularioValido) {
      try {
          await fetchData('registro', {
              usuario,
              telefono,
              codigoTelefonico: document.getElementById('codigoTelfonicoSeleccionado').value,
              fecha_nacimiento: fechaNacimiento,
              email,
              contrasena,
              genero: document.querySelector('input[name="genero"]:checked').value,
          });
          window.location.replace('game.html'); // Redirigir a la página del juego
        } catch (error) {
            console.error('Error al registrar el usuario:', error);
            document.querySelector('.error-solicitud-registro').style.display = 'block'; // Muestra un mensaje de error si la solicitud falla
        }
    }
}

// ----------------------------------------------------------------------------------
// INICIAR SESION CON COOKIES
// -----------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  function getCookie(nombre) {
    const valor = `; ${document.cookie}`;
    const partes = valor.split(`; ${nombre}=`);
    if (partes.length === 2) return partes.pop().split(';').shift();
    return null; // Devuelve null si la cookie no se encuentra
  }  

  let token = getCookie("token");

  if (token) {
    try {
      const datosUser  = await fetchData('token-sesion', { userToken: token });

      if (!datosUser .cookieSesion) return;

      // Ejecución de la función logeado
      logeado(
        datosUser.id,
        datosUser.nombre,
        datosUser.email,
        datosUser.telefono,
        datosUser.foto_perfil,
        datosUser.fecha_nacimiento,
        datosUser.estatus,
        datosUser.nivelUsuario,
        token
      );
    } catch (error) {
      console.error('Error:', error);
    }
  } else {
    if (window.location.pathname.startsWith('/quetantosabes/pages/perfil')) {
      window.location.replace(url + '/quetantosabes/pages/inicio.html#target');
    }
  }
});

// ----------------------------------------------------------------------------------
// FUNCION DE CUANDO EL USUARIO INICIE SESION POR COOKIES
// -----------------------------------------------------------------------------------
async function logeado(ID, NOMBRE, EMAIL, TELEFONO, FOTO, NACIMIENTO, ESTATUS, NIVEL, TOKEN) {
  if (window.location.pathname !== '/quetantosabes/pages/bloqueado.html') {
    if (ESTATUS === "INACTIVO") {
      await fetchData('crearAccion', {
        accion: "Intento entrar estando bloqueado",
        SQLAccion: "No hubo acción en la base de datos.",
        token: TOKEN
      });
      return window.location.replace(url + '/quetantosabes/pages/bloqueado.html');
    }
  }

  if (ESTATUS !== "INACTIVO") {
    if (window.location.pathname === '/quetantosabes/pages/bloqueado.html') {
      return window.location.replace(url + '/quetantosabes/pages/inicio.html');
    }
  }

  // Actualizar perfil
  if (window.location.pathname === '/quetantosabes/pages/perfil.html') {
    document.getElementById('nombre-usuario').textContent = NOMBRE;
    document.getElementById('email-usuario').textContent = EMAIL;
    document.getElementById('foto-usuario').src = "../" + FOTO;
    document.getElementById('telefono-usuario').textContent = TELEFONO;
    document.getElementById('nacimiento-usuario').textContent = NACIMIENTO;
    document.getElementById('id-usuario').textContent = "ID: " + ID;
  }

  // Modificación general (header)
  setTimeout(() => {
    const headerCuenta = document.getElementById('boton-menu-header');
    const headerCuentaNoLog = document.getElementById('botonIniciarSesion');

    if (NIVEL === "ADMIN" || NIVEL === "MANAGER") {
      document.getElementById("menuAdmin").style.display = "block"
    }

    if (headerCuenta.style.display !== 'block' || headerCuentaNoLog.style.display !== 'none') {
      headerCuenta.style.display = 'block';
      headerCuentaNoLog.style.display = 'none';
    }

    // Actualizar la foto de perfil y los datos del usuario
    document.getElementById('foto-usuario-header').src = "../" + FOTO;
    document.getElementById('foto-usuario-headerPerfil').src = "../" + FOTO;
    document.getElementById('nombre-usuario-header').textContent = NOMBRE;
    document.getElementById('email-usuario-header').textContent = EMAIL;
    document.getElementById('inicio-perfil').textContent = "PERFIL";
    document.getElementById('inicio-perfil').href = "perfil.html";
  }, 120);

  if (window.location.pathname === '/quetantosabes/pages/admin.html') {
    if (NIVEL === "USUARIO") {
      return window.location.replace(url + '/quetantosabes/pages/inicio.html');
    }
  }

  // Redirigir a la página de perfil si está en la página de inicio
  if (window.location.pathname.startsWith('/quetantosabes/pages/inicio')) {
    return window.location.replace(url + '/quetantosabes/pages/perfil.html');
  }
}

// ----------------------------------------------------------------------------------
// FUNCION CERRAR SESION
// -----------------------------------------------------------------------------------
async function cerrarSesion() {
  try {
    await fetchData('crearAccion', {
      accion: "Cerró sesión",
      SQLAccion: "Se eliminó la cookie del header para eliminar el inicio de sesión automático",
      token: token
    });

    // Eliminar la cookie de sesión
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    location.reload(); // Recargar la página
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
}

// ----------------------------------------------------------------------------------
// INICIALIZAR EVENTOS
// -----------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  configurarBotonesToggleContrasena();

  // Asignar eventos a los formularios
  const formIniciarSesion = document.getElementById('formularioIniciarSesion');
  const formRegistro = document.getElementById('formularioRegistro');

  if (formIniciarSesion) {
    formIniciarSesion.addEventListener('submit', iniciarSesion);
  }

  if (formRegistro) {
    formRegistro.addEventListener('submit', registrarUsuario);
  }

  // Alternar entre iniciar sesión y registrarse
  if(window.location.pathname === url+"/quetantosabes/inicio.html")
  toggleButton.addEventListener('click', alternarFormulario);
});