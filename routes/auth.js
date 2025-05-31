// File: routes/auth.js
const supabase = require('../lib/supabase');
const Joi = require('joi');

const authRoutes = [
  {
    method: 'POST',
    path: '/api/auth/register',
    options: {
      description: 'Register a new user',
      notes: 'Creates a new user in Supabase Auth and profiles table',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
          name: Joi.string().min(2).required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { email, password, name } = request.payload;

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: '',
            data: { name },
          },
        });

        if (error) {
          console.error('Register error:', error.message);
          return h.response({ error: error.message }).code(400);
        }

        if (data.user) {
          await supabase
            .from('profiles')
            .insert({ id: data.user.id, name });
        }

        return h.response({
          message: 'Registration successful',
          user: data.user,
        }).code(201);
      } catch (err) {
        console.error('Unexpected error during registration:', err);
        return h.response({ error: 'Internal server error' }).code(500);
      }
    },
  },

  {
    method: 'POST',
    path: '/api/auth/login',
    options: {
      description: 'User login',
      notes: 'Authenticates a user and returns session info',
      tags: ['api', 'auth'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().required(),
        }),
      },
    },
    handler: async (request, h) => {
      const { email, password } = request.payload;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Login error:', error.message);
          return h.response({ error: error.message }).code(400);
        }

        const user = data.user;

        // Cek apakah profile user sudah ada
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // Jika belum ada, tambahkan data ke tabel profiles
        if (!profile && profileError && profileError.code === 'PGRST116') {
          try {
            await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: user.user_metadata?.name || 'Unnamed',
              });
          } catch (insertError) {
            console.warn('Failed to insert profile on login:', insertError.message);
          }
        }

        return h.response({
          message: 'Login successful',
          session: data.session,
          user,
        });
      } catch (err) {
        console.error('Unexpected error during login:', err);
        return h.response({ error: 'Internal server error' }).code(500);
      }
    },
  },
];

module.exports = authRoutes;
