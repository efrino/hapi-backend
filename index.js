require('dotenv').config();
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const axios = require('axios');
const allRoutes = require('./routes');
const authMiddleware = require('./middleware/auth');
const Package = require('./package.json');

const flaskApiUrl = process.env.FLASK_API_URL;

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
          { name: 'predictions', description: 'Prediksi & hasil stunting' },
        ],
        documentationPath: '/docs',
      },
    },
  ]);

  // Tambahkan semua routes dari folder routes/
  allRoutes.forEach((route) => server.route(route));

  // Route untuk cek koneksi ke Flask (HTML UI)
  server.route({
    method: 'GET',
    path: '/api/check-flask',
    handler: (request, h) => {
      const html = `
      <html>
        <head><title>Cek Koneksi Flask</title></head>
        <body>
          <h1>Cek Koneksi ke Flask Backend</h1>
          <button id="checkBtn">Cek Koneksi</button>
          <p id="status"></p>
          <script>
            document.getElementById('checkBtn').addEventListener('click', async () => {
              const status = document.getElementById('status');
              status.textContent = 'Mengecek koneksi...';
              try {
                const res = await fetch('/api/checking-flask');
                const data = await res.json();
                if (data.status === 'success') {
                  status.textContent = 'Koneksi sukses: ' + JSON.stringify(data.data);
                } else {
                  status.textContent = 'Gagal: ' + data.message;
                }
              } catch (err) {
                status.textContent = 'Error: ' + err.message;
              }
            });
          </script>
        </body>
      </html>
      `;
      return h.response(html).type('text/html');
    },
  });

  // Endpoint untuk cek koneksi ke Flask (API)
  server.route({
    method: 'GET',
    path: '/api/checking-flask',
    handler: async (request, h) => {
      try {
        const { data } = await axios.get(flaskApiUrl);
        return h.response({ status: 'success', data });
      } catch (err) {
        return h.response({ status: 'error', message: err.message }).code(500);
      }
    },
  });

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
