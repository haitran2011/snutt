var mongoose = require('mongoose');
var secretKey = require('../config/secretKey');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  credential : {
    local: {
      // id should not be unique, because non-active user can have same id
      id: {type: String, default: null},
      password: {type: String, default: null}
    },
    facebook: {
      id: {type: String, default: null},
      token: {type: String, default: null}
    }
  },
	isAdmin: {type: Boolean, default: false},
	regDate: {type: Date, default: Date.now()},
  notificationCheckedAt: {type: Date, default: Date.now()},

  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  active: {type: Boolean, default: true}
});

UserSchema.methods.verify_password = function(password, cb) {
	bcrypt.compare(password, this.credential.local.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

UserSchema.methods.signCredential = function () {
  return jwt.sign(this.credential, secretKey.jwtSecret, {
    expiresIn : '180d' //FIXME : expire time
  });
};

UserSchema.methods.updateNotificationCheckDate = function (callback) {
  this.notificationCheckedAt = Date.now();
  return this.save(callback);
};

UserSchema.statics.getUserFromCredential = function (credential) {
  if (!credential || !credential.local || !credential.facebook) {
    return new Promise (function(resolve, reject) { reject('Wrong Credential') });
  }
  return mongoose.model('User').findOne(
    {
      'credential.local.id' : credential.local.id,
      'credential.local.password' : credential.local.password,
      'credential.facebook.id' : credential.facebook.id,
      'credential.facebook.token' : credential.facebook.token
    }).exec();
};

UserSchema.statics.get_local = function(id, callback) {
  return mongoose.model('User').findOne({'credential.local.id' : id })
    .exec(callback);
};

UserSchema.statics.create_local = function(id, password, callback) {
  var User = mongoose.model('User');
  return User.get_local(id)
    .then(function(user){
      if (user) {
        return callback(new Error("same id already exists"));
      }
      user = new User({
        credential : {
          local: {
            id: id,
            password: password
          }
        }
      });
      if (!user.credential.local.id ||
        !user.credential.local.id.match(/^[a-z0-9]{4,32}$/i))
        return callback(new Error("incorrect id"));

      if (!user.credential.local.password ||
        !user.credential.local.password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i))
        return callback(new Error("incorrect password"));

      bcrypt.hash(user.credential.local.password, 4, function (err, hash) {
        if (err) return callback(err);

        user.credential.local.password = hash;
        return user.save(callback);
      });
    }, function(err) {
      callback(err);
      return new Promise(function(resolve, reject) {
        reject(err);
      })
    });
};

module.exports = mongoose.model('User', UserSchema);