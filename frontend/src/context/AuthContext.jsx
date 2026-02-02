import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false);

    const logout = useCallback(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setLoading(false);
        setAuthChecked(true);
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.user);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
            setAuthChecked(true);
        }
    }, [logout]);

    const refreshAccessToken = useCallback(async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            const response = await api.post('/auth/refresh', {}, {
                headers: {
                    Authorization: `Bearer ${refreshToken}`
                }
            });

            localStorage.setItem('accessToken', response.data.access_token);
            await fetchCurrentUser();
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
        }
    }, [fetchCurrentUser, logout]);

    useEffect(() => {
        // Check for existing token on mount
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 > Date.now()) {
                    // Token is still valid, fetch user
                    fetchCurrentUser();
                } else {
                    // Token expired, try refresh
                    refreshAccessToken();
                }
            } catch (error) {
                console.error('Token decode error:', error);
                logout();
            }
        } else {
            setLoading(false);
            setAuthChecked(true);
        }
    }, [fetchCurrentUser, refreshAccessToken, logout]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });

        const { user: userData, access_token, refresh_token } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);

        // Update state
        setUser(userData);
        setAuthChecked(true);

        return userData;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);

        const { user: newUser, access_token, refresh_token } = response.data;

        // Store tokens
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);

        // Update state
        setUser(newUser);
        setAuthChecked(true);

        return newUser;
    };

    const updateProfile = async (data) => {
        const response = await api.put('/auth/me', data);
        setUser(response.data.user);
        return response.data.user;
    };

    const value = {
        user,
        loading,
        authChecked,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isOfficer: user?.role === 'officer',
        isCitizen: user?.role === 'citizen',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
