/**
 * routes/api/user.js
 * API for User CRUD
 */
"use strict";

var express = require('express');
var request = require('request-promise-native');
var router = express.Router();
var config = require('../../config/config');
var auth = require('../../lib/auth');
var fcm = require('../../lib/fcm');
var User = require('../../model/user');

router.get('/info', function (req, res, next) {
  return res.json({
    isAdmin: req.user.isAdmin,
    regDate: req.user.regDate,
    notificationCheckedAt: req.user.notificationCheckedAt,
    email: req.user.email,
    local_id: req.user.credential.local_id,
    fb_name: req.user.credential.fb_name
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
  req.user.verify_password(req.body.old_password, function(err, isMatch){
    if (err || !isMatch) return res.status(403).json({message:"wrong old password"});
    req.user.changeLocalPassword(req.body.new_password, function(err, user){
      if (err) return res.status(403).json({message:err.message});
        res.json({token: req.user.getCredentialHash()});
      });
    });
});

// Credential has been modified. Should re-send token
router.post('/facebook', function (req, res, next) {
  if (req.user.credential.fb_id) return res.status(403).json({message: "already attached"});
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({message: "both fb_id and fb_token required"});

  auth.fb_auth(req.body.fb_id, req.body.fb_token, function(err, user, info) {
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
  });
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
  if (!req.body.registration_id) return res.status(400).json({message: "no registration_id"});
  var promise = fcm.create_device(req.user, req.body.registration_id);

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
  if (!req.body.registration_id) return res.status(400).json({message: "no registration_id"});
  var promise = fcm.remove_device(req.user, req.body.registration_id);

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