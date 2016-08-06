/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
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
  if (req.user.credential.fb_id) {
    return res.status(403).json({message: "already attached"});
  }
  if (!req.query.fb_id) {
    return res.status(400).json({message: "no fb_id provided"});
  }
  User.get_fb(req.query.fb_id, function(err, user) {
    if (err) {
      return res.status(500).json({message: "server error"});
    }
    if (user) {
      return res.status(403).json({message: "already attached with this fb_id"});
    }
    req.user.attachFBId(req.query.fb_id).then(function () {
      return res.json({token: req.user.getCredentialHash()});
    }, function () {
      return res.status(500).json({message: "server error"});
    });
  });
});

router.post('/detach_fb', function (req, res, next) {
  if (!req.user.credential.fb_id) {
    return res.status(403).json({message: "not attached yet"});
  }
  req.user.detachFBId().then(function () {
    return res.json({token: req.user.getCredentialHash()});
  }, function() {
    return res.status(500).json({message: "server error"});
  });
});

router.post('/status_fb', function (req, res, next) {
  var attached;
  if (req.user.credential.fb_id) {
    attached = true;
  } else {
    attached = false;
  }
  return res.json({attached: attached});
});

module.exports = router;