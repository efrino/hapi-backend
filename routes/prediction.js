// File: routes/prediction.js
const supabase = require('../lib/supabase');
const axios = require('axios');
const flaskApiUrl = process.env.FLASK_API_URL;

const predictionRoutes = [
  {
    method: 'POST',
    path: '/api/predict',
    handler: async (request, h) => {
      const { sex, age, height, weight } = request.payload;

      if (!sex || age == null || height == null || weight == null) {
        return h.response({ message: 'Semua data harus diisi.' }).code(400);
      }

      try {
        // Kirim data ke Flask untuk prediksi
        const { data: flaskResult } = await axios.post(`${flaskApiUrl}/predict`, {
          sex,
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
    handler: async (request, h) => {
      const token = request.headers.authorization?.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

      const { sex, age, height, weight, child_id } = request.payload;

      try {
        const { data: flaskResult } = await axios.post('http://0.0.0.0:5000/predict', {
          sex,
          age,
          height,
          weight,
        });

        const { result, score, recommendation } = flaskResult;

        const { data, error } = await supabase.from('predictions').insert({
          user_id: userData.user.id,
          child_id: child_id || null,
          sex,
          age,
          height,
          weight,
          result,
          score,
          recommendation,
        }).select();

        if (error) return h.response({ error: error.message }).code(400);

        return h.response({ message: 'Prediction saved', prediction: data[0] }).code(201);
      } catch (err) {
        console.error('Prediction save error:', err.message);
        return h.response({ message: 'Gagal memproses prediksi.' }).code(500);
      }
    },
  },
  {
    method: 'GET',
    path: '/api/predictions',
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
];

module.exports = predictionRoutes;
