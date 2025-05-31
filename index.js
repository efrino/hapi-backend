const Hapi = require('@hapi/hapi');
const allRoutes = require('./routes');
const authMiddleware = require('./middleware/auth');
const axios = require('axios');

const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: '0.0.0.0',
    routes: { cors: true },
  });

  // Register middleware
  await server.register([authMiddleware]);

  // Tambahkan semua routes dari folder routes/
  allRoutes.forEach((route) => server.route(route));

  // Halaman HTML untuk cek koneksi ke Flask
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
              const btn = document.getElementById('checkBtn');
              const statusEl = document.getElementById('status');
              btn.addEventListener('click', async () => {
                statusEl.textContent = 'Mengecek koneksi...';
                try {
                  const response = await fetch('/api/checking-flask');
                  const result = await response.json();
                  if (result.status === 'success') {
                    statusEl.textContent = 'Koneksi sukses! Response dari Flask: ' + JSON.stringify(result.data);
                  } else {
                    throw new Error(result.message);
                  }
                } catch (error) {
                  statusEl.textContent = 'Gagal koneksi ke Flask: ' + error.message;
                }
              });
            </script>
          </body>
        </html>
      `;
      return h.response(html).type('text/html');
    },
  });

  // API backend untuk mengecek koneksi ke Flask
  server.route({
    method: 'GET',
    path: '/api/checking-flask',
    handler: async (request, h) => {
      try {
        const { data } = await axios.get('http://0.0.0.0:5000/');
        return h.response({ status: 'success', data }).code(200);
      } catch (err) {
        return h.response({ status: 'error', message: err.message }).code(500);
      }
    },
  });

  // Menampilkan daftar endpoint saat akses ke /
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      const routes = server.table();
      const routeList = routes
        .filter((r) => r.path !== '/')
        .map((r) => `<li><code>${r.method.toUpperCase()}</code> <code>${r.path}</code></li>`)
        .join('');

      const html = `
        <html>
          <head><title>API Routes</title></head>
          <body>
            <h1>Daftar Endpoint API</h1>
            <ul>${routeList}</ul>
          </body>
        </html>
      `;

      return h.response(html).type('text/html');
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
      console.error('❌ Failed to start server:', err);
    }
  })();
}

module.exports = { createServer };
