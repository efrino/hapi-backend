// File: routes/prediction.js
const supabase = require('../lib/supabase');
const axios = require('axios');
const Joi = require('joi');
const flaskApiUrl = process.env.FLASK_API_URL;

const predictionRoutes = [
    {
        method: 'POST',
        path: '/api/predict',
        options: {
            description: 'Predict stunting (no login)',
            notes: 'Sends data to Flask API and returns prediction result',
            tags: ['api', 'prediction'],
            validate: {
                payload: Joi.object({
                    gender: Joi.string().valid('Laki-laki', 'Perempuan').required(),
                    age: Joi.number().required(),
                    height: Joi.number().required(),
                    weight: Joi.number().required(),
                }),
            },
        },
        handler: async (request, h) => {
            const { gender, age, height, weight } = request.payload;

            if (!gender || age == null || height == null || weight == null) {
                return h.response({ message: 'Semua data harus diisi.' }).code(400);
            }

            try {
                const { data: flaskResult } = await axios.post(`${flaskApiUrl}/predict`, {
                    gender,
                    age,
                    height,
                    weight,
                });

                return h.response(flaskResult).code(200);
            } catch (error) {
                console.error('Error connecting to Flask:', error.message);
                return h.response({ message: 'Gagal terhubung ke model prediksi.' }).code(500);
            }
        },
    },

    {
        method: 'POST',
        path: '/api/predictions',
        options: {
            description: 'Predict and save result',
            notes: 'Requires login. Sends data to model and stores result in database',
            tags: ['api', 'prediction'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                payload: Joi.object({
                    child_id: Joi.string().optional(),
                    gender: Joi.string().valid('Laki-laki', 'Perempuan').required(),
                    age: Joi.number().required(),
                    height: Joi.number().required(),
                    weight: Joi.number().required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) {
                return h.response({ error: 'Unauthorized' }).code(401);
            }

            const { gender, age, height, weight, child_id } = request.payload;

            try {
                const { data: flaskResult } = await axios.post(`${flaskApiUrl}/predict`, {
                    gender,
                    age,
                    height,
                    weight,
                });

                const {
                    status,
                    confidence,
                    nutrition_recommendation,
                    additional_info,
                } = flaskResult;

                const { data, error } = await supabase
                    .from('predictions')
                    .insert({
                        user_id: userData.user.id,
                        child_id: child_id || null,
                        gender,
                        age,
                        height,
                        weight,
                        status,
                        confidence,
                        nutrition_recommendation,
                        additional_info,
                    })
                    .select()
                    .single();


                if (error) {
                    console.error('Error saving to Supabase:', error.message);
                    return h.response({ error: error.message }).code(400);
                }

                return h.response({
                    message: 'Prediction saved',
                    prediction: data[0],
                }).code(201);
            } catch (err) {
                console.error('Prediction save error:', err.message);
                return h.response({ message: 'Gagal memproses prediksi.' }).code(500);
            }
        },
    },
    {
        method: 'GET',
        path: '/api/predictions',
        options: {
            description: 'Get prediction history',
            notes: 'Returns all predictions made by the authenticated user',
            tags: ['api', 'prediction'],
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
                .from('predictions')
                .select('*')
                .eq('user_id', userData.user.id)
                .order('created_at', { ascending: false });

            if (error) return h.response({ error: error.message }).code(400);
            return { predictions: data };
        },
    },
    {
        method: 'GET',
        path: '/api/predictions/{id}',
        options: {
            description: 'Get prediction detail by ID',
            notes: 'Returns a single prediction by ID if it belongs to the authenticated user',
            tags: ['api', 'prediction'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                params: Joi.object({
                    id: Joi.string().uuid().required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { id } = request.params;

            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) {
                return h.response({ error: 'Unauthorized' }).code(401);
            }

            const { data, error } = await supabase
                .from('predictions')
                .select('*')
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .single();

            if (error || !data) {
                return h.response({ error: 'Prediction not found or access denied' }).code(404);
            }

            return h.response(data).code(200);
        },
    },
    {
        method: 'DELETE',
        path: '/api/predictions/{id}',
        options: {
            description: 'Delete a prediction by ID',
            notes: 'Deletes a prediction if it belongs to the authenticated user',
            tags: ['api', 'prediction'],
            validate: {
                headers: Joi.object({
                    authorization: Joi.string().required(),
                }).unknown(),
                params: Joi.object({
                    id: Joi.string().uuid().required(),
                }),
            },
        },
        handler: async (request, h) => {
            const token = request.headers.authorization?.replace('Bearer ', '');
            const { id } = request.params;

            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userError || !userData.user) {
                return h.response({ error: 'Unauthorized' }).code(401);
            }

            // Check ownership first
            const { data: existing, error: fetchError } = await supabase
                .from('predictions')
                .select('id')
                .eq('id', id)
                .eq('user_id', userData.user.id)
                .single();

            if (fetchError || !existing) {
                return h.response({ error: 'Prediction not found or access denied' }).code(404);
            }

            // Delete
            const { error: deleteError } = await supabase
                .from('predictions')
                .delete()
                .eq('id', id)
                .eq('user_id', userData.user.id);

            if (deleteError) {
                return h.response({ error: 'Failed to delete prediction' }).code(400);
            }

            return h.response({ message: 'Prediction deleted successfully' }).code(200);
        },
    }

];

module.exports = predictionRoutes;
