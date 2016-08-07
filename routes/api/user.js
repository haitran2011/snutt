/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
var passport = require('../../config/passport');
var router = express.Router();
var User = require('../../model/user');

router.get('/info', function (req, res, next) {
  return res.json({
    isAdmin: req.user.isAdmin,
    regDate: req.user.regDate,
    notificationCheckedAt: req.user.notificationCheckedAt,
    email: req.user.email
  });
});

// Credential has been modified. Should re-send token
router.post('/attach_fb', function (req, res, next) {
  if (req.user.credential.fb_id) return res.status(403).json({message: "already attached"});
  if (!req.body.fb_token || !req.body.fb_name)
    return res.status(400).json({message: "both fb_name and fb_token required"});

  passport.authenticate('local-fb', function(err, user, info) {
    if (err || !info.fb_id) return res.status(403).json({message:err.message});
    User.get_fb(info.fb_name, info.fb_id, function(err, user) {
      if (err) {
        console.log(err);
        return res.status(500).json({message: "server error"});
      }
      if (user) return res.status(403).json({message: "already attached with this fb_id"});
      req.user.attachFBId(info.fb_name, info.fb_id).then(function () {
        return res.json({token: req.user.getCredentialHash()});
      }, function (err) {
        console.log(err);
        return res.status(500).json({message: "server error"});
      });
    });
  })(req, res, next);
});

router.post('/detach_fb', function (req, res, next) {
  if (!req.user.credential.fb_id) return res.status(403).json({message: "not attached yet"});
  if (!req.user.credential.local_id) return res.status(403).json({message: "no local id"});
  req.user.detachFBId().then(function () {
    return res.json({token: req.user.getCredentialHash()});
  }, function() {
    return res.status(500).json({message: "server error"});
  });
});

router.get('/status_fb', function (req, res, next) {
  var attached;
  if (req.user.credential.fb_id) {
    attached = true;
  } else {
    attached = false;
  }
  return res.json({attached: attached, name: req.user.credential.fb_name});
});

module.exports = router;