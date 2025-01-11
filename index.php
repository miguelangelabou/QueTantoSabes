<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require 'vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\Key;

define('TOKEN_SECRET', 'ScoobydoPaPa');
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'proyecto_db');

$conn = conectarBaseDeDatos(DB_HOST, DB_USER, DB_PASS, DB_NAME);

function conectarBaseDeDatos($host, $user, $pass, $db) {
    $conn = new mysqli($host, $user, $pass, $db);
    if ($conn->connect_error) {
        die(json_encode(['success' => false, 'message' => 'Conexión fallida: ' . $conn->connect_error]));
    }
    return $conn;
}

function jwt_decode($token) {
    try {
        $descifrado = JWT::decode($token, new Key(TOKEN_SECRET, 'HS256'));
        return (array) $descifrado;
    } catch (ExpiredException $e) {
        return ['error' => 'Token expirado'];
    } catch (Exception $e) {
        error_log('Error al decodificar el token: ' . $e->getMessage());
        return ['error' => 'Token inválido'];
    }
}

function generarToken($payload) {
    $options = ['expires' => time() + 18000]; // 5 horas
    return JWT::encode($payload, TOKEN_SECRET, 'HS256', null, $options);
}

function ejecutarConsulta($conn, $sql, $valores = []) {
    $stmt = $conn->prepare($sql);
    if ($valores) {
        $stmt->bind_param(str_repeat('s', count($valores)), ...$valores);
    }
    $stmt->execute();
    return $stmt->get_result();
}

function subirEstadisticas($conn, $id, $puntos, $preguntaNro, $tiempoPartida = null) {
    // Consulta para verificar si el jugador ya tiene estadísticas
    $queryStats = 'SELECT * FROM estadisticas_jugadores_tbl WHERE id_jugador = ?';
    $result = ejecutarConsulta($conn, $queryStats, [$id]);

    if ($result->num_rows <= 0) {
        // Si no existen estadísticas, insertar un nuevo registro
        if ($tiempoPartida === null) {
            $statsDefault = 'INSERT INTO estadisticas_jugadores_tbl (id_jugador, puntuacion_alta, pregunta_nro) VALUES (?, ?, ?)';
            ejecutarConsulta($conn, $statsDefault, [$id, $puntos, $preguntaNro]);
        } else {
            $statsDefault = 'INSERT INTO estadisticas_jugadores_tbl (id_jugador, puntuacion_alta, pregunta_nro, mejorTiempo) VALUES (?, ?, ?, ?)';
            ejecutarConsulta($conn, $statsDefault, [$id, $puntos, $preguntaNro, $tiempoPartida]);
        }
    } else {
        // Si existen estadísticas, actualizar el registro
        $estadisticas = $result->fetch_assoc();
        $puntoFinal = $estadisticas['puntuacion_alta'];
        $tiempoPartidaFinal = $estadisticas['mejorTiempo'];
        $preguntaNroFinal = $estadisticas['pregunta_nro'];

        // Comparar y actualizar el mejor tiempo
        if ($tiempoPartidaFinal === null || $tiempoPartida < $tiempoPartidaFinal) {
            $tiempoPartidaFinal = $tiempoPartida;
        }

        // Comparar y actualizar la puntuación alta
        if ($puntoFinal < $puntos) {
            $puntoFinal = $puntos;
        }

        // Comparar y actualizar el número de preguntas respondidas
        if ($preguntaNroFinal < $preguntaNro) {
            $preguntaNroFinal = $preguntaNro;
        }

        // Actualizar las estadísticas en la base de datos
        if ($tiempoPartida === null) {
            $queryUpdate = 'UPDATE estadisticas_jugadores_tbl SET puntuacion_alta = ?, pregunta_nro = ? WHERE id_jugador = ?;';
            ejecutarConsulta($conn, $queryUpdate, [$puntoFinal, $preguntaNroFinal, $id]);
        } else {
            $queryUpdate = 'UPDATE estadisticas_jugadores_tbl SET puntuacion_alta = ?, pregunta_nro = ?, mejorTiempo = ? WHERE id_jugador = ?;';
            ejecutarConsulta($conn, $queryUpdate, [$puntoFinal, $preguntaNroFinal, $tiempoPartidaFinal, $id]);
        }        
    }
}

function registrarAccion($conn, $usuarioId, $accion, $ip, $sqlAccion) {
    ejecutarConsulta($conn, "INSERT INTO acciones_usuario_tbl (usuario_id, accion, ip_usuario, SQLaccion) VALUES (?, ?, ?, ?);", [
        $usuarioId,
        $accion,
        $ip,
        $sqlAccion
    ]);
}

function almacenarPreguntas($conn, $preguntas) {
    foreach ($preguntas as $pregunta) {
        $id = $pregunta['id'];
        $pregunta_texto = $pregunta['pregunta'];
        $respuesta_correcta = $pregunta['respuesta_correcta'];
        $respuestas_incorrectas = json_encode($pregunta['respuestas_incorrectas']);
        $categoria = $pregunta['categoria'];
        $dificultad = $pregunta['dificultad'];
        $consultarIA = $pregunta['consultarIA'];

        $sql = "INSERT INTO preguntas_trivia_tbl (id, pregunta, respuesta_correcta, respuestas_incorrectas, categoria, dificultad, consultarIA) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $valores = [$id, $pregunta_texto, $respuesta_correcta, $respuestas_incorrectas, $categoria, $dificultad, $consultarIA];
        
        ejecutarConsulta($conn, $sql, $valores);
    }
}

function manejarRegistro($conn, $web) {
    $usuario = $web['usuario'];
    $telefono = $web['telefono'];
    $codigoTelefonico = $web['codigoTelefonico'];
    $fecha_nacimiento = $web['fecha_nacimiento'];
    $email = $web['email'];
    $contrasena = $web['contrasena'];
    $genero = $web['genero'];
    $ip = $_SERVER['REMOTE_ADDR'];

    $contrasenaCrypt = password_hash($contrasena, PASSWORD_BCRYPT);
    $imagenes = ($genero === "masculino") ? [
        "imgs/imgPerfilMasculino1.jpeg",
        "imgs/imgPerfilMasculino2.jpeg"
    ] : (($genero === "femenina") ? [
        "imgs/imgPerfilFemenino1.jpeg",
        "imgs/imgPerfilFemenino2.jpeg"
    ] : [
        "imgs/imgPerfilGeneroNulo.png"
    ]);

    $randomIndex = array_rand($imagenes);
    $foto_perfil_random = $imagenes[$randomIndex];
    $numeroTelefonico = "+" . $codigoTelefonico . " " . $telefono;

    $sql = 'INSERT INTO usuarios_tbl (nombre_completo, telefono, fecha_nacimiento, email, contrasena, foto_perfil, nivel, estatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    $valores = [$usuario, $numeroTelefonico, $fecha_nacimiento, $email, $contrasenaCrypt, $foto_perfil_random, 'USUARIO', 'ACTIVO'];

    try {
        ejecutarConsulta($conn, $sql, $valores);
        $idJugador = $conn->insert_id;

        $statsDefault = 'INSERT INTO estadisticas_jugadores_tbl (id_jugador) VALUES (?)';
        ejecutarConsulta($conn, $statsDefault, [$idJugador]);

        $token = generarToken(['id' => $idJugador]);
        setcookie('token', $token, time() + 18000, '/', '', true, false);
        
        registrarAccion($conn, $idJugador, "Registro de cuenta.", $ip, "Se añadió a la base de datos la información del usuario.");

        echo json_encode(['success' => true, 'message' => 'Registro exitoso.']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Error al registrar el usuario: ' . $e->getMessage()]);
    }
}

function manejarVerificarEmailTelefono($conn, $web) {
    $email = $web['email'];
    $telefono = $web['telefono'];

    error_log("Verificando email: $email y teléfono: $telefono");

    $query = 'SELECT * FROM usuarios_tbl WHERE email = ? OR telefono = ?';
    $results = ejecutarConsulta($conn, $query, [$email, $telefono]);

    if ($results->num_rows > 0) {
        $tipo = $results->fetch_assoc()['email'] === $email ? 'correo' : 'telefono';
        echo json_encode(['registrado' => true, 'tipo' => $tipo]);
    } else {
        echo json_encode(['registrado' => false]);
    }
}

function manejarLogin($conn, $web) {
    $email = $web['email'];
    $contrasena = $web['contrasena'];
    $ip = $_SERVER['REMOTE_ADDR'];
    $usuario = obtenerUsuarioPorEmail($conn, $email);
    
    if (!$usuario) {
        echo json_encode(['cuentaExistente' => false]);
        return;
    }

    if (password_verify($contrasena, $usuario['contrasena'])) {
        $token = generarToken(['id' => $usuario['id']]);
        setcookie('token', $token, time() + 18000, '/', '', true, false);

        ejecutarConsulta($conn, "UPDATE usuarios_tbl SET ultima_sesion = CURRENT_TIMESTAMP WHERE email = ?", [$email]);
        registrarAccion($conn, $usuario['id'], "Inicio sesión.", $ip, "Se modifico la ultima sesion del usuario.");

        echo json_encode(['cuentaExistente' => true, 'datos' => true]);
    } else {
        echo json_encode(['cuentaExistente' => true, 'datos' => false]);
    }
}

function manejarTokenSesion($conn, $web) {
    $token = $web['userToken'];

    if (!$token) {
        echo json_encode(['cookieSesion' => false]);
        return;
    }

    try {
        $descifrado = jwt_decode($token);

        if (isset($descifrado['error'])) {
            echo json_encode(['cookieSesion' => false, 'message' => $descifrado['error']]);
            return;
        }

        $id = $descifrado['id'];
        $query = 'SELECT * FROM usuarios_tbl WHERE id = ?';
        $results = ejecutarConsulta($conn, $query, [$id]);

        if ($results->num_rows <= 0) {
            echo json_encode(['cookieSesion' => false]);
        } else {
            $usuario = $results->fetch_assoc();
            echo json_encode([
                'cookieSesion' => true,
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre_completo'],
                'email' => $usuario['email'],
                'telefono' => $usuario['telefono'],
                'fecha_nacimiento' => $usuario['fecha_nacimiento'],
                'foto_perfil' => $usuario['foto_perfil'],
                'fecha_registro' => $usuario['fecha_registro'],
                'estatus' => $usuario['estatus'],
                'nivelUsuario' => $usuario['nivel'],
                'ultima_sesion' => $usuario['ultima_sesion']
            ]);
        }
    } catch (Exception $e) {
        echo json_encode(['cookieSesion' => false]);
    }
}

function obtenerUsuarioPorEmail($conn, $email) {
    $query = 'SELECT * FROM usuarios_tbl WHERE email = ?';
    $result = ejecutarConsulta($conn, $query, [$email]);
    return $result->num_rows > 0 ? $result->fetch_assoc() : null;
}

function manejarBuscarUsuario($conn, $web) {
    $identificacion = $web['identificacion'];
    if (!$identificacion) {
        echo json_encode(['existe' => false]);
        return;
    }

    $sql = 'SELECT * FROM usuarios_tbl WHERE id = ? OR email = ? OR telefono = ?;';
    $results = ejecutarConsulta($conn, $sql, [$identificacion, $identificacion, $identificacion]);

    if ($results->num_rows <= 0) {
        echo json_encode(['existe' => false]);
        return;
    }

    $usuario = $results->fetch_assoc();
    $resultStats = ejecutarConsulta($conn, 'SELECT * FROM estadisticas_jugadores_tbl WHERE id_jugador = ?;', [$usuario['id']]);
    $partidaGuardada = ejecutarConsulta($conn, 'SELECT * FROM partida_guardada_tbl WHERE id_jugador = ?;', [$usuario['id']]);
    $usuarioStats = $resultStats->fetch_assoc();
    $partida = $partidaGuardada->fetch_assoc();

    $listaTOP10Query = "SELECT * FROM estadisticas_jugadores_tbl WHERE mejorTiempo IS NOT NULL AND victorias > 0 ORDER BY mejorTiempo ASC LIMIT 10;";
    $listaTopPosicion = ejecutarConsulta($conn, $listaTOP10Query);
    $posicionTop = null;

    $descifrado = jwt_decode($web['token']);
    $id = $descifrado['id'];
    $admin = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$id])->fetch_assoc();

    registrarAccion($conn, $admin['id'], "Se solicitó información sobre el usuario: " . $usuario['nombre_completo'] . " (ID: " . $usuario['id'] . ").", $_SERVER['REMOTE_ADDR'], "Se buscó información sobre dicho usuario en la base de datos.");

    if ($usuario['ultima_sesion'] === null) {
        $usuario['ultima_sesion'] = $usuario['fecha_registro'];
    }

    if ($usuarioStats) {
        if ($usuarioStats['mejorTiempo'] === null) {
            $usuarioStats['mejorTiempo'] = "No ha ganado.";
            $posicionTop = "No ha ganado.";
        } else {
            $usuarioStats['mejorTiempo'] .= " seg";
            if ($usuario['estatus'] !== "INACTIVO") {
                $posicionTop = $listaTopPosicion->fetch_all(MYSQLI_ASSOC);
                $posicionTop = array_search($usuario['id'], array_column($posicionTop, 'id_jugador')) + 1;
                $posicionTop = "#" . $posicionTop;
            } else {
                $posicionTop = $listaTopPosicion->fetch_all(MYSQLI_ASSOC);
                $posicionTop = array_search($usuario['id'], array_column($posicionTop, 'id_jugador')) + 1;
                $posicionTop = "#" . $posicionTop;
            }
        }

        if ($partida) {
            echo json_encode([
                'existe' => true,
                'auditorID' => $id,
                'auditorNivel' => $admin['nivel'],
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre_completo'],
                'email' => $usuario['email'],
                'telefono' => $usuario['telefono'],
                'fecha_nacimiento' => $usuario['fecha_nacimiento'],
                'foto_perfil' => $usuario['foto_perfil'],
                'fecha_registro' => $usuario['fecha_registro'],
                'estatus' => $usuario['estatus'],
                'nivelUsuario' => $usuario['nivel'],
                'ultima_sesion' => $usuario['ultima_sesion'],
                'victorias' => $usuarioStats['victorias'],
                'derrotas' => $usuarioStats['derrotas'],
                'partidas' => $usuarioStats['partidas'],
                'puntuacion' => $usuarioStats['puntuacion_alta'],
                'pregunta' => $usuarioStats['pregunta_nro'],
                'tiempoRecord' => $usuarioStats['mejorTiempo'],
                'posicionTOP' => $posicionTop,
                'partida' => true,
                'partidaGuardada_preguntaID' => $partida['pregunta_id'],
                'partidaGuardada_puntos' => $partida['puntos'],
                'partidaGuardada_preguntaNro' => "#" . $partida['pregunta_nro'],
                'partidaGuardada_vidas' => $partida['vidas'],
                'partidaGuardada_tiempo' => $partida['tiempo'] . " seg",
                'partidaGuardada_cronometro' => $partida['tiempoPartida'] . " seg",
                'partidaGuardada_preguntas' => $partida['preguntas'],
                'partidaGuardada_comodines' => json_decode($partida['comodines'])
            ]);
            return;
        }

        echo json_encode([
            'existe' => true,
            'auditorID' => $id,
            'auditorNivel' => $admin['nivel'],
            'id' => $usuario['id'],
            'nombre' => $usuario['nombre_completo'],
            'email' => $usuario['email'],
            'telefono' => $usuario['telefono'],
            'fecha_nacimiento' => $usuario['fecha_nacimiento'],
            'foto_perfil' => $usuario['foto_perfil'],
            'fecha_registro' => $usuario['fecha_registro'],
            'estatus' => $usuario['estatus'],
            'nivelUsuario' => $usuario['nivel'],
            'ultima_sesion' => $usuario['ultima_sesion'],
            'victorias' => $usuarioStats['victorias'],
            'derrotas' => $usuarioStats['derrotas'],
            'partidas' => $usuarioStats['partidas'],
            'puntuacion' => $usuarioStats['puntuacion_alta'],
            'pregunta' => $usuarioStats['pregunta_nro'],
            'tiempoRecord' => $usuarioStats['mejorTiempo'],
            'posicionTOP' => $posicionTop,
            'partida' => false
        ]);
        return;
    }

    echo json_encode([
        'existe' => true,
        'auditorID' => $id,
        'auditorNivel' => $admin['nivel'],
        'id' => $usuario['id'],
        'nombre' => $usuario['nombre_completo'],
        'email' => $usuario['email'],
        'telefono' => $usuario['telefono'],
        'fecha_nacimiento' => $usuario['fecha_nacimiento'],
        'foto_perfil' => $usuario['foto_perfil'],
        'fecha_registro' => $usuario['fecha_registro'],
        'estatus' => $usuario['estatus'],
        'nivelUsuario' => $usuario['nivel'],
        'ultima_sesion' => $usuario['ultima_sesion'],
        'victorias' => 0,
        'derrotas' => 0,
        'partidas' => 0,
        'puntuacion' => 0,
        'pregunta' => 0,
        'tiempoRecord' => "No está en el top",
        'posicionTOP' => "No está en el top",
        'partida' => false
    ]);
}

function manejarEstadisticasJugador($conn, $web) {
    $token = $web['token'];
    $descifrado = jwt_decode($token);
    $id = $descifrado['id'];

    $verificar = 'SELECT * FROM estadisticas_jugadores_tbl WHERE id_jugador = ?';
    $result = ejecutarConsulta($conn, $verificar, [$id]);

    $listaTOP10Query = "SELECT * FROM estadisticas_jugadores_tbl WHERE mejorTiempo IS NOT NULL AND victorias > 0 ORDER BY mejorTiempo ASC LIMIT 10;";
    $listaTOP10 = ejecutarConsulta($conn, $listaTOP10Query);
    $listaTop10Valido = [];

    for ($i = 0; $i < $listaTOP10->num_rows; $i++) {
        $usuarioStats = $listaTOP10->fetch_assoc();
        $queryUsuario = "SELECT * FROM usuarios_tbl WHERE id = ?;";
        $usuario = ejecutarConsulta($conn, $queryUsuario, [$usuarioStats['id_jugador']])->fetch_assoc();
        if ($usuario['estatus'] !== "INACTIVO") {
            $listaTop10Valido[] = [
                'id' => $usuario['id'],
                'usuario' => $usuario['nombre_completo'],
                'tiempo' => $usuarioStats['mejorTiempo']
            ];
        }
    }

    if (empty($listaTop10Valido)) {
        $listaTop10Valido = null;
    }

    if ($result->num_rows > 0) {
        $estadisticas = $result->fetch_assoc();
        
        $posicionTop = ($estadisticas['victorias'] <= 0 || $estadisticas['mejorTiempo'] === null) ? "No estás en el top." :
        "#" . (array_search($id, array_column($listaTop10Valido ?? [], 'id')) + 1);
        
        $recordTiempo = $estadisticas['mejorTiempo'] === null ? "No estás en el top." : $estadisticas['mejorTiempo'] . " seg";

        echo json_encode([
            'partidas' => $estadisticas['partidas'],
            'victorias' => $estadisticas['victorias'],
            'derrotas' => $estadisticas['derrotas'],
            'puntuacion' => $estadisticas['puntuacion_alta'],
            'preguntaRecord' => $estadisticas['pregunta_nro'],
            'tiempoRecord' => $recordTiempo,
            'posicionTop' => $posicionTop,
            'top10' => $listaTop10Valido
        ]);
    } else {
        ejecutarConsulta($conn, "INSERT IGNORE INTO estadisticas_jugadores_tbl (id_jugador) VALUES (?);", [$id]);
        echo json_encode([
            'partidas' => 0,
            'victorias' => 0,
            'derrotas' => 0,
            'puntuacion' => 0,
            'preguntaRecord' => 0,
            'tiempoRecord' => "No está en el top",
            'posicionTop' => "No está en el top",
            'top10' => $listaTop10Valido
        ]);
    }
}

function manejarInactivarUsuario($conn, $web) {
    $identificacion = $web['identificacion'];
    if (!$identificacion) return;

    $sql = "UPDATE usuarios_tbl SET estatus = CASE WHEN estatus = 'ACTIVO' THEN 'INACTIVO' WHEN estatus = 'INACTIVO' THEN 'ACTIVO' END WHERE id = ?;";
    ejecutarConsulta($conn, $sql, [$identificacion]);

    $descifrado = jwt_decode($web['token']);
    $id = $descifrado['id'];
    $usuario = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$identificacion])->fetch_assoc();
    $admin = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$id])->fetch_assoc();

    registrarAccion($conn, $admin['id'], "Se actualizó el estado a '" . ($web['estado'] === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO') . "' al usuario: " . $usuario['nombre_completo'] . " (" . $usuario['id'] . ").", $_SERVER['REMOTE_ADDR'], "El administrador ha activado o desactivado una cuenta de la tabla 'usuarios'.");
    echo json_encode(['success' => true, 'message' => 'Usuario inactivado.']);
}

function manejarModificarNivel($conn, $web) {
    $identificacion = $web['identificacion'];
    if (!$identificacion) return;

    $sql = "UPDATE usuarios_tbl SET nivel = CASE WHEN nivel = 'ADMIN' THEN 'USUARIO' WHEN nivel = 'USUARIO' THEN 'ADMIN' ELSE nivel END WHERE id = ?;";
    ejecutarConsulta($conn, $sql, [$identificacion]);

    $descifrado = jwt_decode($web['token']);
    $id = $descifrado['id'];
    $usuario = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$identificacion])->fetch_assoc();
    $admin = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$id])->fetch_assoc();

    registrarAccion($conn, $admin['id'], "Se modificó el nivel de cuenta a '" . ($web['nivel'] === 'ADMIN' ? 'USUARIO' : 'ADMIN') . "' usuario: " . $usuario['nombre_completo'] . " (" . $usuario['id'] . ").", $_SERVER['REMOTE_ADDR'], "El administrador ha modificado el nivel de un usuario en la tabla 'usuarios'.");
    echo json_encode(['success' => true, 'message' => 'Usuario modificado.']);
}

function manejarAccionesDeUsuario($conn, $web) {
    $identificacion = $web['identificacion'];
    if (!$identificacion) return;

    $sql = "SELECT * FROM acciones_usuario_tbl WHERE usuario_id = ?;";
    $result = ejecutarConsulta($conn, $sql, [$identificacion]);
    $acciones = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode($acciones);
}

function manejarCrearAccion($conn, $web) {
    $token = $web['token'];
    if (!$token) return;

    $descifrado = jwt_decode($token);
    $id = $descifrado['id'];
    $accion = $web['accion'];
    $SQLAccion = $web['SQLAccion'];
    $ip = $_SERVER['REMOTE_ADDR'];

    registrarAccion($conn, $id, $accion, $ip, $SQLAccion);
}

function manejarBuscarPartida($conn, $web) {
    $token = $web['token'];
    $borrar = $web['borrar'] ?? false;
    $idUsuarioADMIN = $web['idUsuarioADMIN'] ?? null;
    $ip = $_SERVER['REMOTE_ADDR'];

    if ($idUsuarioADMIN) {
        if ($borrar) {
            $query = 'DELETE FROM partida_guardada_tbl WHERE id_jugador = ?';
            ejecutarConsulta($conn, $query, [$idUsuarioADMIN]);

            $descifrado = jwt_decode($token);
            $id = $descifrado['id'];
            $admin = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?;", [$id])->fetch_assoc();
            $usuario = ejecutarConsulta($conn, "SELECT * FROM usuarios_tbl WHERE id = ?", [$idUsuarioADMIN])->fetch_assoc();

            registrarAccion($conn, $admin['id'], "Se eliminó la partida del usuario: " . $usuario['nombre_completo'] . " (" . $usuario['id'] . ").", $ip, "El administrador ha eliminado una partida de la tabla 'partidaGuardada'.");
            echo json_encode(['success' => true, 'message' => 'Partida eliminada.']);
        }
    } else if ($token) {
        $descifrado = jwt_decode($token);
        $id = $descifrado['id'];

        if (!$borrar) {
            $verificar = 'SELECT * FROM partida_guardada_tbl WHERE id_jugador = ?';
            $result = ejecutarConsulta($conn, $verificar, [$id]);

            if ($result->num_rows > 0) {
                $partida = $result->fetch_assoc();
                echo json_encode([
                    'noPartida' => true,
                    'preguntaNro' => $partida['pregunta_nro'],
                    'preguntaId' => $partida['pregunta_id'],
                    'vidas' => $partida['vidas'],
                    'puntos' => $partida['puntos'],
                    'tiempo' => $partida['tiempo'],
                    'numerosUsados' => json_decode(json: $partida['preguntas']),
                    'tiempoPartida' => $partida['tiempoPartida'],
                    'comodinesUsados' => json_decode($partida['comodines'])
                ]);
            } else {
                echo json_encode(['noPartida' => false]);
            }
        } else {
            $query = 'DELETE FROM partida_guardada_tbl WHERE id_jugador = ?';
            ejecutarConsulta($conn, $query, [$id]);
            echo json_encode(['success' => true, 'message' => 'Partida eliminada.']);
        }
    }
}

function manejarGuardarPartida($conn, $web) {
    if (isset($web['preguntaId'])) {
        $token = $web['token'];
        $preguntaNro = $web['preguntaNro'];
        $preguntaId = $web['preguntaId'];
        $vidas = $web['vidas'];
        $puntos = $web['puntos'];
        $tiempo = $web['tiempo'];
        $numerosUsados = $web['numerosUsados'];
        $tiempoPartida = $web['tiempoPartida'];
        $comodines = $web['comodines'];
        $ip = $_SERVER['REMOTE_ADDR'];

        $descifrado = jwt_decode($token);
        $id = $descifrado['id'];

        $verificar = 'SELECT * FROM partida_guardada_tbl WHERE id_jugador = ?';
        $result = ejecutarConsulta($conn, $verificar, [$id]);

        registrarAccion($conn, $id, "Se guardó su última partida.", $ip, "Se ha guardado la información de la partida del jugador en la base de datos en la tabla 'partidaGuardada'.");

        if ($result->num_rows > 0) {
            $partidaExistente = $result->fetch_assoc();
            $tiempoSuma = $tiempoPartida + $partidaExistente['tiempoPartida'];
            $comodinesDB = json_decode($partidaExistente['comodines'], true);
            $comodinUsado = array_unique(array_merge($comodinesDB, $comodines));

            $nuevaPartidaDB = 'UPDATE partida_guardada_tbl SET puntos = ?, pregunta_id = ?, pregunta_nro = ?, tiempo = ?, vidas = ?, preguntas = ?, tiempoPartida = ?, comodines = ? WHERE id_jugador = ?;';
            ejecutarConsulta($conn, $nuevaPartidaDB, [
                $puntos,
                $preguntaId,
                $preguntaNro,
                $tiempo,
                $vidas,
                json_encode($numerosUsados),
                $tiempoSuma,
                json_encode($comodinUsado),
                $id
            ]);
        } else {
            $nuevaPartidaDB = 'INSERT INTO partida_guardada_tbl (id_jugador, puntos, pregunta_id, pregunta_nro, tiempo, vidas, preguntas, tiempoPartida, comodines) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);';
            ejecutarConsulta($conn, $nuevaPartidaDB, [
                $id,
                $puntos,
                $preguntaId,
                $preguntaNro,
                $tiempo,
                $vidas,
                json_encode($numerosUsados),
                $tiempoPartida,
                json_encode($comodines)
            ]);
        }
    }
}

function manejarGanoPerdioNueva($conn, $web) {
    if (isset($web['token'])) {
        $token = $web['token'];
        $descifrado = jwt_decode($token);
        $id = $descifrado['id'];
        $partidaNueva = $web['partidaNueva'];

        if (!$partidaNueva) {
            $derrota = $web['derrota'];
            $tiempo = $web['tiempo'];
            $puntos = $web['puntos'];
            $preguntasNro = $web['preguntasNro'];
            $ip = $_SERVER['REMOTE_ADDR'];

            $ganoOperdio = $derrota === true ? "perdido" : "ganado";
            registrarAccion($conn, $id, "El jugador ha terminado una partida donde ha " . $ganoOperdio . " teniendo " . $puntos . " puntos, respondido " . $preguntasNro . " preguntas y con un cronómetro de " . $tiempo . " segundos.", $ip, "Se actualizó la información del usuario en la tabla de 'estadisticas_jugadores_tbl' dependiendo de que si el jugador ganó o perdió.");

            if (!$derrota) {
                $query = "UPDATE estadisticas_jugadores_tbl SET victorias = victorias + 1 WHERE id_jugador = ?";
                ejecutarConsulta($conn, $query, [$id]);

                subirEstadisticas($conn, $id, $puntos, $preguntasNro, $tiempo);
            } else {
                $query = "UPDATE estadisticas_jugadores_tbl SET derrotas = derrotas + 1 WHERE id_jugador = ?";
                ejecutarConsulta($conn, $query, [$id]);

                subirEstadisticas($conn, $id, $puntos, $preguntasNro);
            }
        } else {
            $query = "UPDATE estadisticas_jugadores_tbl SET partidas = partidas + 1 WHERE id_jugador = ?";
            ejecutarConsulta($conn, $query, [$id]);
        }
        echo json_encode(['success' => true, 'message' => 'Cambios realizados.']);
    }
}

function buscarPregunta($conn, $data) {

    $id = $data['id'];

    $sql = "SELECT * FROM preguntas_trivia_tbl WHERE id = ?";
    $result = ejecutarConsulta($conn, $sql, [$id]);
    
    if ($result->num_rows > 0) {
        $pregunta = $result->fetch_assoc();
        
        echo json_encode([
            'existe' => true,
            'id' => $pregunta['id'],
            'pregunta' => $pregunta['pregunta'],
            'respuesta_correcta' => $pregunta['respuesta_correcta'],
            'respuestas_incorrectas' => json_decode($pregunta['respuestas_incorrectas']),
            'categoria' => $pregunta['categoria'],
            'dificultad' => $pregunta['dificultad'],
            'consultarIA' => $pregunta['consultarIA']
        ]);
    } else {
        echo json_encode([
            'existe' => false,
            'mensaje' => "No se encontró la pregunta con ID: $id"
        ]);
    }
}

function preguntaRandom($conn, $data) {
    $id = $data['id'];
    $preguntaNRO = $data['preguntaNro'];
    $numerosUsados = $data['numerosUsados'];
    
    $nivel = ($preguntaNRO < 5) ? "fácil" : (($preguntaNRO < 10) ? "medio" : "difícil");

    if ($id === null) {
        $sql = "SELECT * FROM preguntas_trivia_tbl WHERE dificultad = ?";

        if (!empty($numerosUsados)) {
            $numerosUsadosStr = implode(',', array_map('intval', $numerosUsados)); // Convertir a string para la consulta
            $sql .= " AND id NOT IN ($numerosUsadosStr)";
        }

        $sql .= " ORDER BY RAND() LIMIT 1";
        $result = ejecutarConsulta($conn, $sql, [$nivel]);

        if ($result->num_rows > 0) {
            $preguntaSeleccionada = $result->fetch_assoc(); // Obtener la pregunta
            $numerosUsados[] = $preguntaSeleccionada['id'];

            echo json_encode([
                'numerosUsados' => $numerosUsados,
                'id' => $preguntaSeleccionada['id'],
                'pregunta' => $preguntaSeleccionada['pregunta'],
                'respuesta_correcta' => $preguntaSeleccionada['respuesta_correcta'],
                'respuestas_incorrectas' => json_decode($preguntaSeleccionada['respuestas_incorrectas']),
                'categoria' => $preguntaSeleccionada['categoria'],
                'dificultad' => $preguntaSeleccionada['dificultad'],
                'consultarIA' => $preguntaSeleccionada['consultarIA'],
            ]);
            return;
        }
    } else {
        $sql = "SELECT * FROM preguntas_trivia_tbl WHERE id = ?";
        $result = ejecutarConsulta($conn, $sql, [$id]);

        if ($result->num_rows > 0) {
            $pregunta = $result->fetch_assoc(); // Obtener la pregunta

            echo json_encode([
                'numerosUsados' => $numerosUsados,
                'id' => $pregunta['id'],
                'pregunta' => $pregunta['pregunta'],
                'respuesta_correcta' => $pregunta['respuesta_correcta'],
                'respuestas_incorrectas' => json_decode($pregunta['respuestas_incorrectas']),
                'categoria' => $pregunta['categoria'],
                'dificultad' => $pregunta['dificultad'],
                'consultarIA' => $pregunta['consultarIA'],
            ]);
            return;
        } else {
            echo json_encode(['error' => 'No se encontró la pregunta con el ID proporcionado.']);
            return;
        }
    }
}

// Manejo de solicitudes POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $web = json_decode(file_get_contents('php://input'), true);

    if (isset($web['action'])) {
        switch ($web['action']) {
            case 'registro':
                manejarRegistro($conn, $web);
                break;

            case 'verificar-email-telefono':
                manejarVerificarEmailTelefono($conn, $web);
                break;

            case 'login':
                manejarLogin($conn, $web);
                break;

            case 'token-sesion':
                manejarTokenSesion($conn, $web);
                break;

            case 'buscarUsuario':
                manejarBuscarUsuario($conn, $web);
                break;               

            case 'estadisticasJugador':
                manejarEstadisticasJugador($conn, $web);
                break;

            case 'inactivarUsuario':
                manejarInactivarUsuario($conn, $web);
                break;

            case 'modificarNivel':
                manejarModificarNivel($conn, $web);
                break;

            case 'accionesDeUsuario':
                manejarAccionesDeUsuario($conn, $web);
                break;

            case 'crearAccion':
                manejarCrearAccion($conn, $web);
                break;

            case 'buscarPartida':
                manejarBuscarPartida($conn, $web);
                break;

            case 'guardarPartida':
                manejarGuardarPartida($conn, $web);
                break;

            case 'ganoPerdioNueva':
                manejarGanoPerdioNueva($conn, $web);
                break;

            case 'buscarPregunta':
                buscarPregunta($conn, $web);
                break;

            case 'preguntaRandom':
                preguntaRandom($conn, $web);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Acción no reconocida.']);
                break;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'No se ha especificado ninguna acción.']);
    }
} else {
    if (!isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
        $requestUri = $_SERVER['REQUEST_URI'];
        if ($requestUri === '/' || $requestUri === '/quetantosabes/' || $requestUri === '/quetantosabes/index.php') {
            /*
            ALMACENAR TODAS LAS PREGUNTAS DEL ARCHIVO JSON A LA BASE DE DATOS

            $json_data = file_get_contents('js/preguntas.json');
            $data = json_decode($json_data, true);
            almacenarPreguntas($conn, $data['trivia']);
            */

            header('Location: pages/inicio.html');
            exit;
        } else {
            header('Location: pages/error.html');
            exit;
        }
    }
}
?>