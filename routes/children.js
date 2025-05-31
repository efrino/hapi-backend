// File: routes/children.js
const supabase = require('../lib/supabase');
const Joi = require('joi');

const childrenRoutes = [
    {
        method: 'POST',
        path: '/api/children',
        options: {
            description: 'Add a child profile',
            notes: 'Requires authentication. Adds a new child profile',
            tags: ['api', 'children'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                payload: Joi.object({
                    name: Joi.string().required(),
                    sex: Joi.string().valid('male', 'female').required(),
                    age: Joi.number().integer().min(0).required(),
                }),
            },
        },
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
        options: {
            description: 'Get all children by user',
            notes: 'Requires authentication. Returns list of children for user',
            tags: ['api', 'children'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
            },
        },
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