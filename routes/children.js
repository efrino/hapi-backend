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
                    gender: Joi.string().valid('Laki-laki', 'Perempuan').required(),
                    age: Joi.number().integer().min(0).required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);


            const { name, gender, age } = request.payload;

            const { data, error } = await supabase
                .from('children')
                .insert({ user_id: userData.user.id, name, gender, age })
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
    {
        method: 'GET',
        path: '/api/children/{id}',
        options: {
            description: 'Get a child by ID (only if belongs to user)',
            notes: 'Requires authentication. Returns one child detail by ID if owned by user.',
            tags: ['api', 'children'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                params: Joi.object({
                    id: Joi.string().guid({ version: 'uuidv4' }).required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

            const { id } = request.params;

            const { data, error } = await supabase
                .from('children')
                .select('*')
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .single();

            if (error) return h.response({ error: 'Child not found or not authorized' }).code(404);

            return { child: data };
        },
    },
    {
        method: 'PUT',
        path: '/api/children/{id}',
        options: {
            description: 'Update a child by ID (only if belongs to user)',
            notes: 'Requires authentication. Updates name, gender, or age.',
            tags: ['api', 'children'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                params: Joi.object({
                    id: Joi.string().guid({ version: 'uuidv4' }).required(),
                }),
                payload: Joi.object({
                    name: Joi.string().optional(),
                    gender: Joi.string().valid('Laki-laki', 'Perempuan').optional(),
                    age: Joi.number().integer().min(0).optional(),
                }).min(1), // At least one field must be provided
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

            const { id } = request.params;
            const payload = request.payload;

            // Ensure the child belongs to the user
            const { data: existing, error: existingError } = await supabase
                .from('children')
                .select('id')
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .single();

            if (existingError) return h.response({ error: 'Child not found or not authorized' }).code(404);

            const { data, error } = await supabase
                .from('children')
                .update(payload)
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .select();

            if (error) return h.response({ error: error.message }).code(400);

            return { message: 'Child updated', child: data[0] };
        },
    },
    {
        method: 'DELETE',
        path: '/api/children/{id}',
        options: {
            description: 'Delete a child by ID (only if belongs to user)',
            notes: 'Requires authentication. Deletes a child profile.',
            tags: ['api', 'children'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                params: Joi.object({
                    id: Joi.string().guid({ version: 'uuidv4' }).required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

            const { id } = request.params;

            // Pastikan child milik user
            const { data: existing, error: existingError } = await supabase
                .from('children')
                .select('id')
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .single();

            if (existingError) return h.response({ error: 'Child not found or not authorized' }).code(404);

            const { error } = await supabase
                .from('children')
                .delete()
                .eq('id', id)
                .eq('user_id', userData.user.id);

            if (error) return h.response({ error: error.message }).code(400);

            return h.response({ message: 'Child deleted' }).code(200);
        },
    }

];

module.exports = childrenRoutes;