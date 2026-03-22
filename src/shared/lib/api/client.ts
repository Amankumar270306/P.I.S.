import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config: any) => {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('pis_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user?.id) {
                    config.headers['X-User-Id'] = user.id;
                }
            } catch { }
        }
    }
    return config;
});

export default api;
