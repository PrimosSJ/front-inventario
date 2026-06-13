import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import {
    getInventoryRequest as defaultGetInventoryRequest,
    updateExtensionCommentRequest as defaultUpdateCommentRequest
} from "../api/inventory.api";

/**
 * Hook to manage inventory state, filtering, and real-time updates.
 * @param {Object} apiDeps - Injectable API dependencies.
 */
export function useInventoryData({ getInventory = defaultGetInventoryRequest } = {}) {
    const socket = useSocket();
    const [inventory, setInventory] = useState([]);
    const [expandidos, setExpandidos] = useState({});
    const [nombreFiltro, setNombreFiltro] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");

    useEffect(() => {
        getInventory()
            .then((res) => setInventory(res.data))
            .catch((err) => console.error("Failed to load inventory:", err));

        if (!socket) return;

        const handleUpdate = (data) => setInventory(data);
        socket.on("inventoryUpdate", handleUpdate);

        return () => {
            socket.off("inventoryUpdate", handleUpdate);
        };
    }, [socket, getInventory]);

    const toggleExpand = (id) => {
        setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredInventory = (inventory || []).filter((item) => {
        const nombreMatch = item.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
        const categoriaMatch = categoriaFiltro === "" || item.categoria === categoriaFiltro;
        return nombreMatch && categoriaMatch;
    });

    return {
        inventory, setInventory,
        expandidos, toggleExpand,
        nombreFiltro, setNombreFiltro,
        categoriaFiltro, setCategoriaFiltro,
        filteredInventory
    };
}

/**
 * Hook to manage modal state and API requests for extension comments.
 * @param {Function} setInventory - The state setter from useInventoryData.
 * @param {Object} apiDeps - Injectable API dependencies.
 */
export function useExtensionComments(setInventory, { updateComment = defaultUpdateCommentRequest } = {}) {
    const [modalExt, setModalExt] = useState(null);
    const [modalComentario, setModalComentario] = useState("");
    const [guardandoComentario, setGuardandoComentario] = useState(false);

    const handleGuardarComentario = async () => {
        if (!modalExt) return;
        setGuardandoComentario(true);
        try {
            await updateComment(modalExt.itemId, modalExt.codigo, modalComentario);
            setInventory((prev) =>
                prev.map((item) => {
                    if (item._id !== modalExt.itemId) return item;
                    return {
                        ...item,
                        extensiones: item.extensiones.map((ext) =>
                            ext.codigo === modalExt.codigo
                                ? { ...ext, comentario: modalComentario }
                                : ext
                        ),
                    };
                })
            );
            setModalExt(null);
            setModalComentario("");
        } catch (err) {
            console.error("Failed to update comment:", err);
        } finally {
            setGuardandoComentario(false);
        }
    };

    return {
        modalExt, setModalExt,
        modalComentario, setModalComentario,
        guardandoComentario, handleGuardarComentario
    };
}