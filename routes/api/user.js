/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
var passport = require('../../config/passport');
var request = require('request-promise-native');
var router = express.Router();
var config = require('../../config/config');
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

router.post('/password', function (req, res, next) {
  if (req.user.credential.local_id) return res.status(403).json({message: "already have local id"});
  User.create_local(req.user, req.body.id, req.body.password, function(err, user){
    if (err) return res.status(403).json({message:err.message});
    res.json({token: req.user.getCredentialHash()});
  });
});

router.put('/password', function (req, res, next) {
  if (!req.user.credential.local_id) return res.status(403).json({message: "no local id"});
  req.user.changeLocalPassword(req.body.password, function(err, user){
    if (err) return res.status(403).json({message:err.message});
    res.json({token: req.user.getCredentialHash()});
  });
});

// Credential has been modified. Should re-send token
router.post('/facebook', function (req, res, next) {
  if (req.user.credential.fb_id) return res.status(403).json({message: "already attached"});
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({message: "both fb_id and fb_token required"});

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

router.delete('/facebook', function (req, res, next) {
  if (!req.user.credential.fb_id) return res.status(403).json({message: "not attached yet"});
  if (!req.user.credential.local_id) return res.status(403).json({message: "no local id"});
  req.user.detachFBId().then(function () {
    return res.json({token: req.user.getCredentialHash()});
  }, function() {
    return res.status(500).json({message: "server error"});
  });
});

router.get('/facebook', function (req, res, next) {
  var attached;
  if (req.user.credential.fb_id) {
    attached = true;
  } else {
    attached = false;
  }
  return res.json({attached: attached, name: req.user.credential.fb_name});
});

router.post('/device', function (req, res, next) {
  var promise;
  if (!req.body.registration_id) return res.status(400).json({message: "no registration_id"});

  // If user doesn't have key, create or fetch key
  if (!req.user.fcm_key) {
    promise = request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "create",
            "notification_key_name": "user-"+req.user_id,
            "registration_ids": [req.body.registration_id]
      },
      json: true
    }).then(function (body) {
      if (body.notification_key)
          return Promise.resolve('device ready');
      if (body.error == "notification_key already exists") {
        request({
          method: 'GET',
          uri: 'https://android.googleapis.com/gcm/notification',
          headers: {
            "Content-Type":"application/json",
            "Authorization":"key="+config.fcm_api_key,
            "project_id":config.fcm_project_id
          },
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
    if (status === 'device ready')
      return Promise.resolve(status);

    // User should have had key
    if (!req.user.fcm_key) return Promise.reject("server fault");

    // Add the device
    return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "add",
            "notification_key_name": "user-"+req.user_id,
            "notification_key": req.user.fcm_key,
            "registration_ids": [req.body.registration_id]
      },
      json: true
    }).then(function(body){
      if (body.notification_key) {
        return Promise.resolve('device ready');
      } else if (body.error) {
        return Promise.reject(body.error);
      }
      return Promise.reject('cannot add device');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  // Add topic
  promise = promise.then(function(status){
    // User should have had key
    if (!req.user.fcm_key) return Promise.reject("server fault");

    // Add topic
    return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1/'+req.user.fcm_key+'/rel/topics/global',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
        // no need for project_id
      },
      resolveWithFullResponse: true
    }).then(function(res){
      if (res.statusCode == 200) {
        return Promise.resolve('done');
      }
      return Promise.reject('cannot add topic');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  promise.then(function(status){
    if (status === 'done') {
      return res.json({message:"ok"});
    } else {
      return res.status(500).json({message:"server fault"});
    }
  }).catch(function(err){
    res.status(500).json({message:err});
  });
});

router.delete('/device', function (req, res, next) {
  var promise = new Promise(function(resolve, reject){
    // User should have had key
    if (!req.user.fcm_key) return reject("no key");

    // Add the device
    return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "remove",
            "notification_key_name": "user-"+req.user_id,
            "notification_key": req.user.fcm_key,
            "registration_ids": [req.body.registration_id]
      },
      json: true
    }).then(function(body){
      if (body.notification_key) {
        return resolve('device ready');
      } else if (body.error) {
        return reject(body.error);
      }
      return reject('cannot remove device');
    });
  });

  // remove topic
  promise = promise.then(function(status){
    // User should have had key
    if (!req.user.fcm_key) return Promise.reject("server fault");

    // Add topic
    return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
        // no need for project_id
      },
      body: {
        "to": "/topics/global",
        "registration_tokens": [req.user.fcm_key]
      },
      json: true,
      resolveWithFullResponse: true
    }).then(function(res){
      if (res.statusCode == 200 && !res.body.results[0].error) {
        return Promise.resolve('done');
      }
      return Promise.reject('cannot remove topic');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  promise.then(function(status){
    if (status === 'done') {
      return res.json({message:"ok"});
    } else {
      return res.status(500).json({message:"server fault"});
    }
  }).catch(function(err){
    res.status(500).json({message:err});
  });
});

router.delete('/account', function(req, res, next){
  req.user.active = false;
  req.user.save(function(err, user){
    if (err) return res.status(500).json({messsage:"server fault"});
    res.json({message:"ok"});
  });
});

module.exports = router;