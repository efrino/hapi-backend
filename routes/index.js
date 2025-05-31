// routes/index.js

const authRoutes = require('./auth');
const childrenRoutes = require('./children');
const predictionRoutes = require('./prediction');

module.exports = [
  ...authRoutes,
  ...childrenRoutes,
  ...predictionRoutes,
];