const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ARCHIVO_BD = path.join(__dirname, 'turnos_compartidos.json');

if (!fs.existsSync(ARCHIVO_BD) || fs.readFileSync(ARCHIVO_BD, 'utf8').trim() === "") {
    fs.writeFileSync(ARCHIVO_BD, JSON.stringify([]));
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Servir el HTML
    if ((req.url === '/' || req.url === '/index.html') && req.method === 'GET') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Error al cargar index.html");
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(content);
            }
        });
    } 
    // API: Obtener Turnos
    else if (req.url === '/api/turnos' && req.method === 'GET') {
        let datos = fs.readFileSync(ARCHIVO_BD, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(datos.trim() ? datos : "[]");
    } 
    // API: Guardar Turno
    else if (req.url === '/api/turnos' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const nuevoTurno = JSON.parse(body);
            let turnos = JSON.parse(fs.readFileSync(ARCHIVO_BD, 'utf8'));
            nuevoTurno.id = Date.now(); // ID único basado en milisegundos
            turnos.push(nuevoTurno);
            fs.writeFileSync(ARCHIVO_BD, JSON.stringify(turnos, null, 2));
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ OK: true }));
        });
    }
    // API: Cancelar / Eliminar Turno 
    else if (req.url.startsWith('/api/turnos/') && req.method === 'DELETE') {
        // Extraemos el ID que viene en la URL (ej: /api/turnos/171123456)
        const idEliminar = parseInt(req.url.split('/').pop());
        let turnos = JSON.parse(fs.readFileSync(ARCHIVO_BD, 'utf8'));
        
        // Filtramos para dejar todos los turnos MENOS el que tiene el ID a borrar
        turnos = turnos.filter(t => t.id !== idEliminar);
        
        fs.writeFileSync(ARCHIVO_BD, JSON.stringify(turnos, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ OK: true }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor con cancelación activo en el puerto ${PORT}`);
});
