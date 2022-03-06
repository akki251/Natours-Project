const express = require('express');
const viewController = require('../controllers/viewController');

const CSP = 'Content-Security-Policy';
const POLICY =
  "default-src 'self' https://*.mapbox.com ;" +
  "base-uri 'self';block-all-mixed-content;" +
  "font-src 'self' https: data:;" +
  "frame-ancestors 'self';" +
  "img-src http://localhost:3000 'self' blob: data:;" +
  "object-src 'none';" +
  "script-src https: cdn.jsdelivr.net cdnjs.cloudflare.com api.mapbox.com 'self' blob: ;" +
  "script-src-attr 'none';" +
  "style-src 'self' https: 'unsafe-inline';" +
  'upgrade-insecure-requests;';

const router = express.Router();

router.use((req, res, next) => {
  //   res.setHeader(CSP, POLICY);
  res.set({
    'Content-Security-Policy': `default-src 'self' http: https:;block-all-mixed-content;font-src 'self' http: data:;frame-ancestors 'self';img-src 'self' data: blob:;object-src 'none';script-src 'self' https://api.mapbox.com https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval';script-src-elem https: http: ;script-src-attr 'self' https://api.mapbox.com https://cdn.jsdelivr.net 'unsafe-inline';style-src 'self' https://api.mapbox.com https://fonts.googleapis.com 'unsafe-inline';worker-src 'self' blob:`
  });
  next();
});

router.get('/', viewController.getOverview);

router.get('/tour/:slug', viewController.getTour);

router.get('/login', viewController.getLoginForm);

module.exports = router;
