// routes/index.js

const [authRoutes, authRoutesExtended] = require('./auth');
const childrenRoutes = require('./children');
const predictionRoutes = require('./prediction');
const flaskRoutes = require('./flask');

module.exports = [
  ...authRoutes,
  ...childrenRoutes,
  ...predictionRoutes,
  ...authRoutesExtended,
  ...flaskRoutes,
];