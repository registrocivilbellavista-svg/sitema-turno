const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'turnos.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Función para leer los turnos guardados
const leerTurnos = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        const contenido = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(contenido || '[]');
    } catch (e) {
        return [];
    }
};

// Función para guardar los turnos
const guardarTurnos = (turnos) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(turnos, null, 2));
};

// API: Obtener todos los turnos
app.get('/api/turnos', (req, res) => {
    res.json(leerTurnos());
});

// API: Crear un nuevo turno
app.post('/api/turnos', (req, res) => {
    const turnos = leerTurnos();
    const nuevoTurno = {
        id: Date.now().toString(), // Genera un ID único basado en el tiempo
        paciente: req.body.paciente,
        dni: req.body.dni,
        tramite: req.body.tramite,
        mail: req.body.mail,
        telefono: req.body.telefono,
        fecha: req.body.fecha,
        hora: req.body.hora,
        atendido: false
    };
    
    turnos.push(nuevoTurno);
    guardarTurnos(turnos);
    res.status(201).json(nuevoTurno);
});

// API: Marcar como Atendido (PATCH)
app.patch('/api/turnos/:id', (req, res) => {
    const turnos = leerTurnos();
    const turno = turnos.find(t => t.id === req.params.id);
    if (turno) {
        if (req.body.atendido !== undefined) turno.atendido = req.body.atendido;
        guardarTurnos(turnos);
        res.json(turno);
    } else {
        res.status(404).json({ error: "Turno no encontrado" });
    }
});

// API: Eliminar/Cancelar un turno (DELETE)
app.delete('/api/turnos/:id', (req, res) => {
    let turnos = leerTurnos();
    const longitudInicial = turnos.length;
    turnos = turnos.filter(t => t.id !== req.params.id);
    
    if (turnos.length < longitudInicial) {
        guardarTurnos(turnos);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Turno no encontrado" });
    }
});

// Forzar a que cualquier otra ruta cargue el HTML
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
