"use strict";

var request = require('request');
var User = require('../model/user');

function local_auth (id, password, done) {
  User.get_local(id, function(err, user) {
    if(err) return done(err);
    if(!user) return done(null, false, { message: 'wrong id' });
    user.verify_password(password, function(err, is_match) {
      if(!is_match) return done(null, false, { message: 'wrong password' });
      var token = user.getCredentialHash();
      return done(null, user, {token: token});
    });
  });
}

function fb_auth (fb_id, fb_token, done) {
  if (process.env.NODE_ENV == 'mocha') {
    if (fb_token == 'correct' && fb_id == "1234") return done(null, null, {fb_name: "John", fb_id: "1234"});
    if (fb_token == 'correct2' && fb_id == "12345") return done(null, null, {fb_name: "Smith", fb_id: "12345"});
    return done(null, null, { message: 'incorrect token'});
  }
  request({
      url: "https://graph.facebook.com/me",
      method: "GET",
      json: true,
      qs: {access_token: fb_token}
  }, function (err, res, body){
    if (err || res.statusCode != 200 || !body || !body.id || fb_id !== body.id) {
      return done(err, null, { message: 'incorrect token'});
    } else {
      return done(null, null, {fb_name: body.name, fb_id: body.id});
    }
  });
}

module.exports = {
  local_auth: local_auth,
  fb_auth: fb_auth,};
