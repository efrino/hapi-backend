// File: routes/children.js
const supabase = require('../lib/supabase');

const childrenRoutes = [
    {
        method: 'POST',
        path: '/api/children',
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);

            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

            const { name, sex, age } = request.payload;

            const { data, error } = await supabase
                .from('children')
                .insert({ user_id: userData.user.id, name, sex, age })
                .select();

            if (error) return h.response({ error: error.message }).code(400);

            return h.response({ message: 'Child added', child: data[0] }).code(201);
        },
    },
    {
        method: 'GET',
        path: '/api/children',
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);

            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

            const { data, error } = await supabase
                .from('children')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('created_at', { ascending: false });

            if (error) return h.response({ error: error.message }).code(400);

            return { children: data };
        },
    },
];

module.exports = childrenRoutes;