"use strict";

var express = require('express');
var passport = require('../../config/passport');
var router = express.Router();

var User = require('../../model/user');

/**
 * POST
 * id, password
 */
router.post('/login_local', function(req, res, next) {
  passport.authenticate('local-id', function(err, user, info) {
    if (err) { return res.status(403).json({message:err.message}); }
    if (!user || !info.token) { return res.status(403).json({message:info.message}); }
    res.json({token: info.token});
  })(req, res, next);
});

/**
 * register local user
 * Registerations should be defined in this 'auth', not 'user', because
 * it needs to be accessed without token
 */
router.post('/register_local', function (req, res, next) {
  User.create_local(req.body.id, req.body.password, function(err, user) {
    if (err) {
      return res.status(403).json({message:err.message});
    }
    return res.json({message:"ok"});
  });
});

router.post('/login_fb', function(req, res, next) {
  req.body.password = "facebook";
  passport.authenticate('local-fb', function(err, user, info) {
    if (err) { return next(err); }
    if (!user || !info.token) { return res.status(403).json({message: info.message}); }
    res.json({ token: info.token});
  })(req, res, next);
});

module.exports = router;
