const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Permite que tu HTML se comunique con Render

// 1. CONEXIÓN A LA BASE DE DATOS (Usa la variable de entorno de Render)
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://registrocivilbellavista_db_user:xBY2kSqi7vYIQ5kf@turnoregistro.gxj56bq.mongodb.net/";

mongoose.connect(MONGO_URI)
    .then(() => console.log("¡Conectado con éxito a MongoDB Atlas permanente!"))
    .catch(err => console.error("Error al conectar a MongoDB:", err));

// 2. DEFINIR EL MODELO DE DATOS DE UN TURNO
const TurnoSchema = new mongoose.Schema({
    paciente: { type: String, required: true },
    dni: { type: String, required: true },
    tramite: { type: String, required: true },
    mail: { type: String, required: true },
    telefono: { type: String, required: true },
    fecha: { type: String, required: true }, // Formato AAAA-MM-DD
    hora: { type: String, required: true },  // Formato HH:MM
    codigo: { type: String, required: true },
    registro: { type: String, required: true },
    atendido: { type: Boolean, default: false }
});

// Forzamos a que guarde el ID compatible con tu HTML convirtiendo virtualmente _id a id
TurnoSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
TurnoSchema.set('toJSON', { virtuals: true });

const Turno = mongoose.model('Turno', TurnoSchema);

// 3. RUTAS DE TU API CONECTADAS A LA BASE DE DATOS

// OBTENER TURNOS (GET)
app.get('/api/turnos', async (req, res) => {
    try {
        const turnos = await Turno.find();
        res.json(turnos);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener la agenda" });
    }
});

// GUARDAR NUEVO TURNO (POST)
app.post('/api/turnos', async (req, res) => {
    try {
        const nuevoTurno = new Turno(req.body);
        await nuevoTurno.save();
        res.status(201).json(nuevoTurno);
    } catch (err) {
        res.status(400).json({ error: "Error al procesar la reserva" });
    }
});

// MARCAR COMO ATENDIDO (PATCH)
app.patch('/api/turnos/:id', async (req, res) => {
    try {
        const turnoActualizado = await Turno.findByIdAndUpdate(
            req.params.id, 
            { atendido: req.body.atendido }, 
            { new: true }
        );
        if (!turnoActualizado) return res.status(404).send("Turno no encontrado");
        res.json(turnoActualizado);
    } catch (err) {
        res.status(500).json({ error: "Error al actualizar estado" });
    }
});

// CANCELAR / ELIMINAR TURNO (DELETE)
app.delete('/api/turnos/:id', async (req, res) => {
    try {
        const turnoEliminado = await Turno.findByIdAndDelete(req.params.id);
        if (!turnoEliminado) return res.status(404).send("El turno ya no existe");
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar el turno" });
    }
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => console.log(`Servidor en producción corriendo en puerto ${PUERTO}`));
