require('dotenv').config();
const axios = require('axios');

const testing = process.env.STATUS_URL;

const flaskRoutes = [
    {
        method: 'GET',
        path: '/api/check-flask',
        options: {
            tags: ['api', 'flask'],
            description: 'Halaman HTML untuk cek koneksi ke Flask',
            notes: 'Menampilkan UI tombol untuk mengetes koneksi Flask secara manual.',
            handler: (request, h) => {
                const html = `
          <html>
            <head>
              <title>Cek Koneksi Flask</title>
              <style>
                body { font-family: sans-serif; padding: 20px; background-color: #fdfdfd; }
                button { padding: 10px 20px; font-size: 16px; margin-top: 10px; }
                pre { background: #f0f0f0; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
              </style>
            </head>
            <body>
              <h1>Cek Koneksi ke Flask Backend</h1>
              <button id="checkBtn">Cek Koneksi</button>
              <pre id="status">Klik tombol untuk cek koneksi Flask.</pre>
              <script>
                document.getElementById('checkBtn').addEventListener('click', async () => {
                  const status = document.getElementById('status');
                  status.textContent = 'Mengecek koneksi...';
                  try {
                    const res = await fetch('/api/checking-flask');
                    const data = await res.json();
                    if (data.status === 'success') {
                      status.textContent = JSON.stringify(data.flaskResponse, null, 2);
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
        },
    },
    {
        method: 'GET',
        path: '/api/checking-flask',
        options: {
            tags: ['api', 'flask'],
            description: 'Memeriksa koneksi ke Flask API dan mengembalikan respons status',
            notes: 'Mengambil data dari endpoint Flask /status dan mengembalikannya ke klien.',
            handler: async (request, h) => {
                try {
                    const { data } = await axios.get(testing);
                    return h.response({
                        status: 'success',
                        message: 'Koneksi sukses ke Flask!',
                        flaskResponse: data,
                    });
                } catch (err) {
                    return h.response({
                        status: 'error',
                        message: 'Gagal menghubungi Flask API',
                        error: err.message,
                    }).code(500);
                }
            },
        },
    },
];

module.exports = flaskRoutes;
