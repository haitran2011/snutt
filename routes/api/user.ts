/**
 * routes/api/user.js
 * API for User CRUD
 */
import express = require('express');
import request = require('request-promise-native');
var router = express.Router();
import config = require('../../config/config');
import auth = require('../../lib/auth');
import fcm = require('../../lib/fcm');
import {UserModel, UserDocument} from '../../model/user';
import errcode = require('../../lib/errcode');

router.get('/info', function (req, res, next) {
  var user:UserDocument = req["user"];
  return res.json({
    isAdmin: user.isAdmin,
    regDate: user.regDate,
    notificationCheckedAt: user.notificationCheckedAt,
    email: user.email,
    local_id: user.credential.local_id,
    fb_name: user.credential.fb_name
  });
});

router.put('/info', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (req.body.email) user.email = req.body.email;
  user.save(function(err, user){
    if (err) return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
    res.json({message:"ok"});
  });
});

router.post('/password', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (user.credential.local_id) return res.status(403).json({errcode: errcode.ALREADY_LOCAL_ACCOUNT, message: "already have local id"});
  UserModel.create_local(user, req.body.id, req.body.password, function(err, user){
    if (err) return res.status(403).json({errcode: err.errcode, message:err.message});
    res.json({token: user.getCredentialHash()});
  });
});

router.put('/password', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (!user.credential.local_id) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  user.verify_password(req.body.old_password, function(err, isMatch){
    if (err || !isMatch) return res.status(403).json({errcode: errcode.WRONG_PASSWORD, message:"wrong old password"});
    user.changeLocalPassword(req.body.new_password, function(err, user){
        if (err) {
          if (err.errcode)
            return res.status(403).json({errcode:err.errcode, message:err.message});
          else
            return res.status(500).json({errcode:errcode.SERVER_FAULT, message:"server fault"});
        }
        res.json({token: user.getCredentialHash()});
      });
    });
});

// Credential has been modified. Should re-send token
router.post('/facebook', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (user.credential.fb_id) return res.status(403).json({errcode: errcode.ALREADY_FB_ACCOUNT, message: "already attached"});
  if (!req.body.fb_token || !req.body.fb_id)
    return res.status(400).json({errcode: errcode.NO_FB_ID_OR_TOKEN, message: "both fb_id and fb_token required"});

  auth.fb_auth(req.body.fb_id, req.body.fb_token, function(err, _, info) {
    if (err || !info.fb_id) return res.status(403).json({errcode: err.errcode, message:err.message});
    UserModel.get_fb(info.fb_name, info.fb_id, function(err, result) {
      if (err) {
        console.log(err);
        return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
      }
      if (result) return res.status(403).json({errcode: errcode.FB_ID_WITH_SOMEONE_ELSE, message: "already attached with this fb_id"});
      user.attachFBId(info.fb_name, info.fb_id).then(function(user) {
        return res.json({token: user.getCredentialHash()});
      }, function (err) {
        console.log(err);
        return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
      });
    });
  });
});

router.delete('/facebook', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (!user.credential.fb_id) return res.status(403).json({errcode: errcode.NOT_FB_ACCOUNT, message: "not attached yet"});
  if (!user.credential.local_id) return res.status(403).json({errcode: errcode.NOT_LOCAL_ACCOUNT, message: "no local id"});
  user.detachFBId().then(function () {
    return res.json({token: user.getCredentialHash()});
  }, function() {
    return res.status(500).json({errcode: errcode.SERVER_FAULT, message: "server error"});
  });
});

router.get('/facebook', function (req, res, next) {
  var user:UserDocument = req["user"];
  var attached;
  if (user.credential.fb_id) {
    attached = true;
  } else {
    attached = false;
  }
  return res.json({attached: attached, name: user.credential.fb_name});
});

router.post('/device', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (!req.body.registration_id) return res.status(400).json({errcode: errcode.NO_REGISTRATION_ID, message: "no registration_id"});
  var promise = fcm.create_device(user, req.body.registration_id);

  promise.then(function(status){
    if (status === 'done') {
      return res.json({message:"ok"});
    } else {
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
    }
  }).catch(function(err){
    res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  });
});

router.delete('/device', function (req, res, next) {
  var user:UserDocument = req["user"];
  if (!req.body.registration_id) return res.status(400).json({errcode: errcode.NO_REGISTRATION_ID, message: "no registration_id"});
  var promise = fcm.remove_device(user, req.body.registration_id);

  promise.then(function(status){
    if (status === 'done') {
      return res.json({message:"ok"});
    } else {
      return res.status(500).json({errcode: errcode.SERVER_FAULT, message:"server fault"});
    }
  }).catch(function(err){
    res.status(500).json({errcode: errcode.SERVER_FAULT, message:err});
  });
});

router.delete('/account', function(req, res, next){
  var user:UserDocument = req["user"];
  user.active = false;
  user.save(function(err, user){
    if (err) return res.status(500).json({errcode: errcode.SERVER_FAULT, messsage:"server fault"});
    res.json({message:"ok"});
  });
});

export = router;