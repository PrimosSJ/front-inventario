import { useEffect } from "react";
import { getSpecialPendingLoansRequest } from "../../api/loans.api";
import { enviarRecordatorioDevolucion, EMAIL_ENABLED } from "../../services/email.service";

const INTERVALO_MS = 30 * 60 * 1000;

function claveReminder(prestamoId) {
    const hoy = new Date().toISOString().slice(0, 10);
    return `reminder_sent_${prestamoId}_${hoy}`;
}

function yaSeEnvioHoy(prestamoId) {
    return localStorage.getItem(claveReminder(prestamoId)) === "1";
}

function marcarEnviado(prestamoId) {
    localStorage.setItem(claveReminder(prestamoId), "1");
}

async function verificarYEnviar() {
    let prestamos;
    try {
        const res = await getSpecialPendingLoansRequest();
        prestamos = res.data;
    } catch {
        return;
    }

    const ahora = new Date();
    const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    for (const prestamo of prestamos) {
        if (!prestamo.fecha_devolucion_esperada || !prestamo.email) continue;

        const fechaDev = new Date(prestamo.fecha_devolucion_esperada);
        const venceProximo = fechaDev <= en24h;

        if (!venceProximo) continue;
        if (yaSeEnvioHoy(prestamo._id)) continue;

        try {
            await enviarRecordatorioDevolucion({
                email: prestamo.email,
                nombre: prestamo.nombre,
                nombre_producto: prestamo.nombre_producto,
                extension_codigo: prestamo.extension_codigo || null,
                fecha_devolucion_esperada: prestamo.fecha_devolucion_esperada,
            });
            marcarEnviado(prestamo._id);
        } catch (err) {
            console.error(`No se pudo enviar recordatorio para préstamo ${prestamo._id}:`, err);
        }
    }
}

export default function AlertasDevoluciones() {
    useEffect(() => {
        // Si el envío de correos está desactivado, no se hace polling ni recordatorios.
        if (!EMAIL_ENABLED) return;
        verificarYEnviar();
        const intervalo = setInterval(verificarYEnviar, INTERVALO_MS);
        return () => clearInterval(intervalo);
    }, []);

    return null;
}
