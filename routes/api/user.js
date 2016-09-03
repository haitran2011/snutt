/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
var passport = require('../../config/passport');
var request = require('request-promise-native');
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

router.put('/info', function (req, res, next) {
  if (req.body.email) req.user.email = req.body.email;
  req.user.save(function(err, user){
    if (err) return res.status(500).json({messsage:"server fault"});
    res.json({message:"ok"});
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

router.post('/add_device', function (req, res, next) {
  var promise;
  if (!req.body.registration_id) return res.status(400).json({message: "no registration_id"});

  // If user doesn't have key, create or fetch key
  if (!req.user.fcm_key) {
    promise = request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      body: {
            "operation": "create",
            "notification_key_name": "user-"+req.user_id,
            "registration_ids": [req.body.registration_id]
      },
      json: true
    }).then(function (body) {
      if (body.notification_key)
          return Promise.resolve('done');
      if (body.error == "notification_key already exists") {
        request({
          method: 'GET',
          uri: 'https://android.googleapis.com/gcm/notification',
          qs: {
            "notification_key_name": "user-"+req.user_id
          },
          json: true
        }).then(function (body) {
          if (body.notification_key) {
            req.user.fcm_key = body.notification_key;
            return req.user.save().then(function(user){
              return Promise.resolve('key ready');
            });
          } else {
            return Promise.reject("cannot get fcm key");
          }
        });
      }
      return Promise.reject("cannot get fcm key");
    });
  } else {
    promise = Promise.resolve('key ready');
  }

  // Now user has key
  promise = promise.then(function(status){
    // Device is already added during key creation
    if (status === 'done')
      return Promise.resolve(status);

    // User should have had key
    if (!req.user.fcm_key) return Promise.reject("server fault");

    // Add the device
    return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      body: {
            "operation": "add",
            "notification_key_name": "user-"+req.user_id,
            "notification_key": req.user.fcm_key,
            "registration_ids": [req.body.registration_id]
      },
      json: true
    }).then(function(body){
      if (body.notification_key)
        return Promise.resolve('done');
      else
        return Promise.reject('cannot add device');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  promise.then(function(status){
    if (status === 'done')
      return res.json({message:"ok"});
    else
      return res.status(500).json({message:"server fault"});
  }).catch(function(err){
    res.status(500).json({message:err});
  });
});

router.post('/remove_account', function(req, res, next){
  req.user.active = false;
  req.user.save(function(err, user){
    if (err) return res.status(500).json({messsage:"server fault"});
    res.json({message:"ok"});
  });
});

module.exports = router;