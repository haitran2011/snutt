import express = require('express');
var router = express.Router();

import apiRouter = require('./api/api');

//router.use('/api', apiRouter);

router.get('/terms_of_service', function(req, res, next) {
  res.render('terms_of_service.html');
});

router.get('/privacy_policy', function(req, res, next) {
  res.render('privacy_policy.html');
});

router.get('/member', function(req, res, next) {
  res.render('member.html');
});

router.use('/', apiRouter);

export = router;