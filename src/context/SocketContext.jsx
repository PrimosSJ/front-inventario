import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import url from "../api/client";

const SocketContext = createContext();

/**
 * Custom hook to access the global Socket.io instance safely.
 * @returns {import("socket.io-client").Socket | null}
 */
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};

/**
 * Provider component that initializes and manages a single WebSocket connection.
 */
export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(url);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};