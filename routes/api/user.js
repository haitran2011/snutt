/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
var router = express.Router();
var User = require('../../model/user');

// Credential has been modified. Should re-send token
router.post('/attach_fb', function(req, res, next) {

});

router.post('/detach_fb', function(req, res, next) {
  User.get_fb(req.user.credential.facebook.id, function(err, user) {
    if(err) return cb(err);
    if(!user) return cb(null, false, { message: 'TODO: autoregister on login' });
    user.credential.fb_id = null;
    user.save(function(err, doc) {
      if (err) return cb(err);
      var token = doc.signCredential();
      return cb(null, doc, {token: token})
    })
  });
});

router.post('/status_fb', function(req, res, next) {

});