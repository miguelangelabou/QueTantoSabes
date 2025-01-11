CREATE TABLE usuarios_tbl (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_completo VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  foto_perfil VARCHAR(255) NOT NULL,
  fecha_nacimiento VARCHAR(20) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_sesion DATETIME DEFAULT NULL,
  nivel ENUM('ADMIN', 'USUARIO', 'MANAGER') NOT NULL DEFAULT 'USUARIO',
  estatus ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO'
);

CREATE TABLE partida_guardada_tbl (
  id_jugador INT NOT NULL,
  puntos INT NOT NULL,
  pregunta_id INT NOT NULL,
  pregunta_nro INT NOT NULL,
  vidas INT NOT NULL,
  tiempo INT NOT NULL,
  tiempoPartida FLOAT NOT NULL,
  preguntas TEXT NOT NULL,
  comodines VARCHAR(20) NOT NULL DEFAULT "[]",
  PRIMARY KEY (id_jugador),  
  FOREIGN KEY (id_jugador) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE (id_jugador) 
);

CREATE TABLE estadisticas_jugadores_tbl (
  id_jugador INT NOT NULL,
  partidas INT NOT NULL DEFAULT 0,
  victorias INT NOT NULL DEFAULT 0,
  derrotas INT NOT NULL DEFAULT 0,
  puntuacion_alta INT NOT NULL DEFAULT 0,
  pregunta_nro INT NOT NULL DEFAULT 0,
  mejorTiempo FLOAT DEFAULT NULL,
  PRIMARY KEY (id_jugador),  
  FOREIGN KEY (id_jugador) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE acciones_usuario_tbl (
  usuario_id INT NOT NULL,
  id_accion INT AUTO_INCREMENT PRIMARY KEY,
  accion VARCHAR(255) NOT NULL,
  ip_usuario VARCHAR(45) NOT NULL,
  fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  SQLaccion VARCHAR(255) NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE preguntas_trivia_tbl (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pregunta TEXT NOT NULL,
  respuesta_correcta TEXT NOT NULL,
  respuestas_incorrectas TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  dificultad VARCHAR(20) NOT NULL,
  consultarIA TEXT
);