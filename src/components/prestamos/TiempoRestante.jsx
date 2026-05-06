import { useState, useEffect } from "react";

function calcularTexto(fechaIso) {
    const ahora = new Date();
    const target = new Date(fechaIso);
    const diffMs = target.getTime() - ahora.getTime();
    const diffTotalHoras = diffMs / (1000 * 60 * 60);
    const diffDias = Math.floor(diffTotalHoras / 24);
    const horasRestantes = Math.floor(diffTotalHoras % 24);

    if (diffMs <= 0) {
        // Vencido
        const vencidoHoras = Math.abs(Math.ceil(diffTotalHoras));
        if (vencidoHoras < 24) {
            return { texto: `Vencido hace ${vencidoHoras}h`, clase: "text-error font-bold" };
        }
        const vencidoDias = Math.ceil(Math.abs(diffTotalHoras) / 24);
        return { texto: `Vencido hace ${vencidoDias} día${vencidoDias !== 1 ? "s" : ""}`, clase: "text-error font-bold" };
    }

    if (diffTotalHoras < 24) {
        const horas = Math.ceil(diffTotalHoras);
        return { texto: `${horas}h restantes`, clase: "text-orange-500 font-semibold" };
    }

    if (diffDias <= 3) {
        return {
            texto: `${diffDias}d ${horasRestantes}h restantes`,
            clase: "text-warning font-semibold",
        };
    }

    return { texto: `${diffDias} días restantes`, clase: "text-success" };
}

export default function TiempoRestante({ fechaIso }) {
    const [display, setDisplay] = useState(() => calcularTexto(fechaIso));

    useEffect(() => {
        setDisplay(calcularTexto(fechaIso));
        const intervalo = setInterval(() => {
            setDisplay(calcularTexto(fechaIso));
        }, 60_000);
        return () => clearInterval(intervalo);
    }, [fechaIso]);

    return <span className={display.clase}>{display.texto}</span>;
}
