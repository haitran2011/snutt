var express = require('express');
var passport = require('passport');
var router = express.Router();
var jwt = require('jsonwebtoken');

var User = require('../../model/user');

/**
 * POST
 * id, password
 */
router.post('/login_local', function(req, res, next) {
  passport.authenticate('local', {session: false}, function(err, user, info) {
    if (err) { return next(err); }
    if (!user || !info.token) { return res.status(403).send(info.message) }
    res.send(info.token);
  })(req, res, next);
});

/**
 * register local user
 * Registerations should be defined in this 'auth', not 'user', because
 * it needs to be accessed without token
 */
router.post('/register_local', function (req, res, next) {
  User.create_local(req.body.id, req.body.password, function(err, user) {
    if (err) {
      return res.status(403).send(err.message);
    }
    return res.send("ok");
  });
});

/*
 * Token Authenticator
 * Checks if the user is logged in
 * Which means all routers below this need authentication
 * If the user object is modified, you should re-login!!
 */
router.use(function(req, res, next) {
  if(req.user) return next();
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, secretKey.jwtSecret, function(err, decoded) {
      if (err) {
        return res.status(403).json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        User.getUserFromCredential(decoded).then(function(user){
            req.user = user;
            next;
        });
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(401).send({
      success: false,
      message: 'No token provided.'
    });

  }
});


module.exports = router;
