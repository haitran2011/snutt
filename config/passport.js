"use strict";

var request = require('request');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var FBStrategy = require('passport-facebook').Strategy;

var User = require('../model/user');

/**
 * TODO
 * Local strategy requires id and password for every request.
 * OAuth2 is an overkill.
 * Going to use passport-jwt.
 * passport-jwt is for only login,
 * you need to manually issue tokens.
 * And maybe some CSRF Tokens?
 *
 * Or maybe use passport only for registering (INCLUDING local)
 * Add credential object on the User model,
 * and save local/facebook credentials on that
 * Make jwt out of it
 * Log-in is the same as before
 *
 * And API Keys...?
 * Give clients jwt-hashed api keys (Like { platform : "iOS" })
 * Add the key to the jwt token
 * After unhashed, compare the token and api keys
 * .. Is this useful? What if both api key and the token stolen at once? (And it would be the most cases)
 * ----> You can change API key when bad things happen!!
 *       클라이언트 하나가 털리면 통째로 다 날려버릴 수 있다
 */

passport.use('local-id', new LocalStrategy({
    usernameField: 'id',
    passwordField: 'password',
    session: false,
    passReqToCallback: true
  },
  function(req, id, password, done) {
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
));

/**
 * Facebook Authentication.
 * Since we use fb only for authentication,
 * we does not save any token
 */
passport.use('local-fb', new LocalStrategy({
    usernameField: 'fb_name',
    passwordField: 'fb_token',
    session: false,
    passReqToCallback: true
  },
  function(req, fb_name, fb_token, done) {
    if (process.env.NODE_ENV == 'mocha') {
      if (fb_token == 'correct') return done(null, null, {fb_name: "John", fb_id: 1234});
      if (fb_token == 'correct2') return done(null, null, {fb_name: "Smith", fb_id: 1235});
      return done(null, null, { message: 'incorrect token'});
    }
    request({
        url: "https://graph.facebook.com/me",
        method: "GET",
        json: true,
        qs: {access_token: fb_token}
    }, function (err, res, body){
      if (err || res.statusCode != 200 || !body || !body.id) {
        return done(err, null, { message: 'incorrect token'});
      } else {
        return done(null, null, {fb_name: body.name, fb_id: body.id});
      }
    });
  }
));


/**
 * This is passport-facebook implementation.
 * Only for test purpose
 * Maybe web client can use this.
 */

/*
passport.use(new FBStrategy({
    clientID: "",
    clientSecret: "",
    callbackURL: "http://localhost:3000/api/facebook_test",
    session: false,
    passReqToCallback: true
  },
  function(req, accessToken, refreshToken, profile, cb) {
    console.log(cb);
    return cb(null, false, { accessToken: accessToken});
  }
));
*/


module.exports = passport;