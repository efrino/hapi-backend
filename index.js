require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const axios = require('axios');
const allRoutes = require('./routes');
const authMiddleware = require('./middleware/auth');
const Package = require('./package.json');


const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: { cors: true },
  });

  await server.register([
    authMiddleware,
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'GrowSmart API Documentation',
          version: Package.version,
        },
        grouping: 'tags',
        tags: [
          { name: 'auth', description: 'Autentikasi dan akun' },
          { name: 'children', description: 'Data anak & pertumbuhan' },
          { name: 'prediction', description: 'Prediksi & hasil stunting' },
           { name: 'flask', description: 'Koneksi ke backend Flask' },
        ],
        documentationPath: '/docs',
      },
    },
  ]);

  // Tambahkan semua routes dari folder routes/
  allRoutes.forEach((route) => server.route(route));

  // Root: Redirect ke /docs
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return h.redirect('/docs');
    },
  });
  return server;
};

if (require.main === module) {
  (async () => {
    try {
      const server = await createServer();
      await server.start();
      console.log(`✅ Server running at: ${server.info.uri}`);
    } catch (err) {
      console.error('❌ Server failed to start:', err);
    }
  })();
}

module.exports = { createServer };
