import { createContext, useContext, useState, useEffect } from "react";
import { ignoreAuthBackend } from "../api/client";
import { verifyTokenRequest, loginRequest } from "../api/auth.api";

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(ignoreAuthBackend ? { email: "dev@mock.local", role: "admin" } : null);
    const [loading, setLoading] = useState(!ignoreAuthBackend);
    const [token, setToken] = useState(ignoreAuthBackend ? "mock-dev-token" : localStorage.getItem("token"));

    useEffect(() => {
        if (ignoreAuthBackend) return;

        const verifyToken = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await verifyTokenRequest(token);

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    localStorage.removeItem("token");
                    setToken(null);
                }
            } catch (error) {
                console.error("Failed to verify token", error);
                localStorage.removeItem("token");
                setToken(null);
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    const login = async (email, password) => {
        if (ignoreAuthBackend) {
            const mockToken = "mock-dev-token";
            localStorage.setItem("token", mockToken);
            setToken(mockToken);
            setUser({ email, role: "admin" });
            return { success: true };
        }

        try {
            const response = await loginRequest(email, password);
            const data = await response.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                setToken(data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, message: "Login failed. Please try again." };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};