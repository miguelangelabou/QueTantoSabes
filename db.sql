-- Archivo: index.php
-- Descripción: Tablas del proyecto de trivia.

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



-- Archivo: index.php
-- Descripción: Consultas SQL utilizadas en el proyecto de trivia.

-- 1. Verificar estadísticas del jugador
SELECT * FROM estadisticas_jugadores_tbl WHERE id_jugador = ?;

-- 2. Insertar estadísticas del jugador (si no existen)
-- Sin tiempo de partida
INSERT INTO estadisticas_jugadores_tbl (id_jugador, puntuacion_alta, pregunta_nro) VALUES (?, ?, ?);

-- Con tiempo de partida
INSERT INTO estadisticas_jugadores_tbl (id_jugador, puntuacion_alta, pregunta_nro, mejorTiempo) VALUES (?, ?, ?, ?);

-- 3. Actualizar estadísticas del jugador
-- Sin tiempo de partida
UPDATE estadisticas_jugadores_tbl SET puntuacion_alta = ?, pregunta_nro = ? WHERE id_jugador = ?;

-- Con tiempo de partida
UPDATE estadisticas_jugadores_tbl SET puntuacion_alta = ?, pregunta_nro = ?, mejorTiempo = ? WHERE id_jugador = ?;

-- 4. Registrar acción del usuario
INSERT INTO acciones_usuario_tbl (usuario_id, accion, ip_usuario, SQLaccion) VALUES (?, ?, ?, ?);

-- 5. Almacenar preguntas
INSERT INTO preguntas_trivia_tbl (id, pregunta, respuesta_correcta, respuestas_incorrectas, categoria, dificultad, consultarIA) VALUES (?, ?, ?, ?, ?, ?, ?);

-- 6. Registrar un nuevo usuario
INSERT INTO usuarios_tbl (nombre_completo, telefono, fecha_nacimiento, email, contrasena, foto_perfil, nivel, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- 7. Insertar estadísticas iniciales para un jugador
INSERT INTO estadisticas_jugadores_tbl (id_jugador) VALUES (?);

-- 8. Verificar si el email o teléfono ya están registrados
SELECT * FROM usuarios_tbl WHERE email = ? OR telefono = ?;

-- 9. Obtener usuario por email
SELECT * FROM usuarios_tbl WHERE email = ?;

-- 10. Actualizar la última sesión del usuario
UPDATE usuarios_tbl SET ultima_sesion = CURRENT_TIMESTAMP WHERE email = ?;

-- 11. Buscar usuario por ID, email o teléfono
SELECT * FROM usuarios_tbl WHERE id = ? OR email = ? OR telefono = ?;

-- 12. Obtener estadísticas del jugador
SELECT * FROM estadisticas_jugadores_tbl WHERE id_jugador = ?;

-- 13. Eliminar partida guardada
DELETE FROM partida_guardada_tbl WHERE id_jugador = ?;

-- 14. Buscar partida guardada
SELECT * FROM partida_guardada_tbl WHERE id_jugador = ?;

-- 15. Actualizar partida guardada
UPDATE partida_guardada_tbl SET puntos = ?, pregunta_id = ?, pregunta_nro = ?, tiempo = ?, vidas = ?, preguntas = ?, tiempoPartida = ?, comodines = ? WHERE id_jugador = ?;

-- 16. Insertar nueva partida guardada
INSERT INTO partida_guardada_tbl (id_jugador, puntos, pregunta_id, pregunta_nro, tiempo, vidas, preguntas, tiempoPartida, comodines) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);

-- 17. Buscar pregunta por ID
SELECT * FROM preguntas_trivia_tbl WHERE id = ?;

-- 18. Obtener pregunta aleatoria
SELECT * FROM preguntas_trivia_tbl WHERE dificultad = ? AND id NOT IN (?) ORDER BY RAND() LIMIT 1;

-- 19. Actualizar el estado de un usuario
UPDATE usuarios_tbl SET estatus = CASE WHEN estatus = 'ACTIVO' THEN 'INACTIVO' WHEN estatus = 'INACTIVO' THEN 'ACTIVO' END WHERE id = ?;

-- 20. Modificar el nivel de un usuario
UPDATE usuarios_tbl SET nivel = CASE WHEN nivel = 'ADMIN' THEN 'USUARIO' WHEN nivel = 'USUARIO' THEN 'ADMIN' ELSE nivel END WHERE id = ?;