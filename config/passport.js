var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FBStrategy = require('passport-facebook').Strategy;

var secretKey = require('../config/secretKey');
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

passport.use(new LocalStrategy({
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
        var token = user.signCredential();
        return done(null, user, {token: token})
      })
    });
  }
));

/**
 * Facebook Authentication.
 * Since we use fb only for authentication,
 * we does not save any token
 */
passport.use(new FBStrategy({
    clientID: secretKey.FBID,
    clientSecret: secretKey.FBSECRET,
    session: false,
    passReqToCallback: true
  },
  function(accessToken, refreshToken, profile, cb) {
    User.get_fb(profile.id, function(err, user) {
      if(err) return cb(err);
      if(!user) return cb(null, false, { message: 'TODO: autoregister on login' });
      var token = user.signCredential();
      return cb(null, user, {token: token})
    });
  }
));


module.exports = passport;