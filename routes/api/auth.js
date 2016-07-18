var express = require('express');
var passport = require('../../config/passport');
var router = express.Router();

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

module.exports = router;
