import emailjs from "@emailjs/browser";
import { ENV } from "../config/env.config";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_PRESTAMO = import.meta.env.VITE_EMAILJS_TEMPLATE_PRESTAMO;
const TEMPLATE_RECORDATORIO = import.meta.env.VITE_EMAILJS_TEMPLATE_RECORDATORIO;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Envío de correos desactivado globalmente vía ENV.EMAIL_ENABLED.
 * Cuando está desactivado, las funciones resuelven sin hacer nada (no-op),
 * evitando errores por falta de keys de EmailJS.
 */
export const EMAIL_ENABLED = ENV.EMAIL_ENABLED;

export async function enviarConfirmacionPrestamo({
    email,
    nombre,
    nombre_producto,
    extension_codigo,
    tipo_prestamo,
    fecha_devolucion_esperada,
}) {
    if (!EMAIL_ENABLED) {
        return Promise.resolve({ skipped: true, reason: "email-disabled" });
    }
    return emailjs.send(
        SERVICE_ID,
        TEMPLATE_PRESTAMO,
        {
            to_email: email,
            to_name: nombre,
            nombre_producto,
            extension_codigo: extension_codigo || "-",
            tipo_prestamo: tipo_prestamo === "especial" ? "Especial" : "Público",
            fecha_devolucion: fecha_devolucion_esperada
                ? new Date(fecha_devolucion_esperada).toLocaleDateString()
                : "-",
        },
        PUBLIC_KEY
    );
}

export async function enviarRecordatorioDevolucion({
    email,
    nombre,
    nombre_producto,
    extension_codigo,
    fecha_devolucion_esperada,
}) {
    if (!EMAIL_ENABLED) {
        return Promise.resolve({ skipped: true, reason: "email-disabled" });
    }
    return emailjs.send(
        SERVICE_ID,
        TEMPLATE_RECORDATORIO,
        {
            to_email: email,
            to_name: nombre,
            nombre_producto,
            extension_codigo: extension_codigo || "-",
            fecha_devolucion: fecha_devolucion_esperada
                ? new Date(fecha_devolucion_esperada).toLocaleDateString()
                : "-",
        },
        PUBLIC_KEY
    );
}
