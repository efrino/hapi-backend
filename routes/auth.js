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
        if (!user) {
          return h.response({ error: 'User not found' }).code(404);
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

const authRoutesExtended = [
  // GET /api/auth/me
  {
    method: 'GET',
    path: '/api/auth/me',
    options: {
      description: 'Get current user profile',
      notes: 'Get user info from token',
      tags: ['api', 'auth'],
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
    },
    handler: async (request, h) => {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) return h.response({ error: 'Unauthorized' }).code(401);

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

      // userData.user mengandung user info termasuk metadata
      return h.response({ user: userData.user }).code(200);
    },
  },

  // PUT /api/auth/me/{id}
  {
    method: 'PUT',
    path: '/api/auth/me/{id}',
    options: {
      description: 'Update user profile',
      notes: 'Update user metadata for authenticated user',
      tags: ['api', 'auth'],
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
        payload: Joi.object({
          email: Joi.string().email().optional(), // opsional update email
          password: Joi.string().min(6).optional(), // opsional update password
          name: Joi.object().optional(),
        }),
      },
    },
    handler: async (request, h) => {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) return h.response({ error: 'Unauthorized' }).code(401);

      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) return h.response({ error: 'Unauthorized' }).code(401);

      const { id } = request.params;

      // Pastikan user hanya bisa update data dirinya sendiri
      if (userData.user.id !== id) {
        return h.response({ error: 'Forbidden' }).code(403);
      }

      const updatePayload = {};
      if (request.payload.email) updatePayload.email = request.payload.email;
      if (request.payload.password) updatePayload.password = request.payload.password;
      if (request.payload.name) updatePayload.data = request.payload.name;

      try {
        // Update user lewat Supabase Auth method
        const { data, error } = await supabase.auth.updateUser(token, updatePayload);
        if (error) {
          return h.response({ error: error.message }).code(400);
        }
        return h.response({ message: 'User updated', user: data.user }).code(200);
      } catch (err) {
        console.error(err);
        return h.response({ error: 'Internal server error' }).code(500);
      }
    },
  },
];

module.exports = [authRoutes, authRoutesExtended];
