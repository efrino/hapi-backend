// middleware/auth.js
const supabase = require('../lib/supabase');

const authMiddleware = {
    name: 'authMiddleware',
    version: '1.0.0',
    register: async function (server) {
        server.ext('onRequest', async (request, h) => {
            const authHeader = request.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.replace('Bearer ', '');
                const { data, error } = await supabase.auth.getUser(token);

                if (!error && data?.user) {
                    request.auth = {
                        isAuthenticated: true,
                        credentials: { user: data.user },
                    };
                } else {
                    request.auth = {
                        isAuthenticated: false,
                        credentials: null,
                    };
                }
            } else {
                request.auth = {
                    isAuthenticated: false,
                    credentials: null,
                };
            }

            return h.continue;
        });
    },
};

module.exports = authMiddleware;
