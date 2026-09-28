const http = require('http');
const fs = require('fs');
const path = require('path');

// Render asigna el puerto dinámicamente mediante process.env.PORT
const PORT = process.env.PORT || 3000;

// Forzamos rutas absolutas con path.join y __dirname para evitar errores ENOENT en Linux/Render
const ARCHIVO_BD = path.join(__dirname, 'turnos_compartidos.json');
const RUTA_HTML = path.join(__dirname, 'index.html');

// Inicializar la base de datos JSON si no existe o está vacía
if (!fs.existsSync(ARCHIVO_BD) || fs.readFileSync(ARCHIVO_BD, 'utf8').trim() === "") {
    fs.writeFileSync(ARCHIVO_BD, JSON.stringify([]));
}

const server = http.createServer((req, res) => {
    // Configuración de cabeceras CORS globales para permitir conexiones multi-PC y móviles
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responder de inmediato a las peticiones de control de CORS (Preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Servir el archivo de la aplicación (index.html)
    if ((req.url === '/' || req.url === '/index.html') && req.method === 'GET') {
        fs.readFile(RUTA_HTML, (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`❌ Error crítico ENOENT: No se encontró el archivo index.html en el servidor.`);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(content);
            }
        });
    } 
    
    // API ENDPOINT: Obtener todos los turnos agendados (GET)
    else if (req.url === '/api/turnos' && req.method === 'GET') {
        try {
            let datos = fs.readFileSync(ARCHIVO_BD, 'utf8');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(datos.trim() ? datos : "[]");
        } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end("[]");
        }
    } 
    
    // API ENDPOINT: Guardar un nuevo turno (POST)
    else if (req.url === '/api/turnos' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const nuevoTurno = JSON.parse(body);
                let datos = fs.readFileSync(ARCHIVO_BD, 'utf8');
                let turnos = datos.trim() ? JSON.parse(datos) : [];
                
                // Asignamos un ID único basado en la marca de tiempo exacta
                nuevoTurno.id = Date.now();
                turnos.push(nuevoTurno);
                
                fs.writeFileSync(ARCHIVO_BD, JSON.stringify(turnos, null, 2));
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ OK: true }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Estructura de datos inválida" }));
            }
        });
    }
    
    // API ENDPOINT: Cancelar / Eliminar un turno específico por ID (DELETE)
    else if (req.url.startsWith('/api/turnos/') && req.method === 'DELETE') {
        try {
            const idEliminar = parseInt(req.url.split('/').pop());
            let datos = fs.readFileSync(ARCHIVO_BD, 'utf8');
            let turnos = datos.trim() ? JSON.parse(datos) : [];
            
            // Conservamos todos los registros excepto el que coincide con el ID recibido
            turnos = turnos.filter(t => t.id !== idEliminar);
            
            fs.writeFileSync(ARCHIVO_BD, JSON.stringify(turnos, null, 2));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ OK: true }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "No se pudo procesar la cancelación" }));
        }
    } 
    
    // Manejo de rutas inexistentes (404 Not Found)
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end("404 Not Found");
    }
});

// Iniciamos la escucha del servidor en el puerto configurado y permitiendo conexiones externas (0.0.0.0)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo y activo en el puerto ${PORT}`);
});
