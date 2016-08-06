"use strict";

var mongoose = require('mongoose');
var secretKey = require('../config/secretKey');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

var UserSchema = new mongoose.Schema({
  credential : {
    local_id: {type: String, default: null},
    local_pw: {type: String, default: null},
    fb_id: {type: String, default: null}
  },
  credentialHash : String,
  isAdmin: {type: Boolean, default: false},
  regDate: {type: Date, default: Date.now()},
  notificationCheckedAt: {type: Date, default: Date.now()},

  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  active: {type: Boolean, default: true}
});

UserSchema.methods.verify_password = function(password, cb) {
  bcrypt.compare(password, this.credential.local_pw, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.signCredential = function (callback) {
  var hmac = crypto.createHmac('sha256', secretKey.jwtSecret);
  hmac.update(JSON.stringify(this.credential));
  this.credentialHash = hmac.digest('hex');
  return this.save(callback);
};

UserSchema.methods.getCredentialHash = function () {
  return this.credentialHash;
};

UserSchema.methods.compareCredentialHash = function(hash) {
  return this.credentialHash == hash;
}

UserSchema.methods.updateNotificationCheckDate = function (callback) {
  this.notificationCheckedAt = Date.now();
  return this.save(callback);
};

UserSchema.methods.changeLocalPassword = function(password, callback) {
  if (!password ||
        !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i))
    return callback(new Error("incorrect password"));

  bcrypt.hash(this.credential.local_pw, 4, function (err, hash) {
    if (err) return callback(err);

    this.credential.local_pw = hash;
    return this.signCredential(callback);
  });
}

UserSchema.methods.attachFBId = function(fb_id, callback) {
  if (!fb_id) {
    return new Promise(function (resolve, reject) {
      reject("null fb_id");
    })
  }
  this.credential.fb_id = fb_id;
  return this.signCredential(callback);
}

UserSchema.methods.detachFBId = function(callback) {
  this.credential.fb_id = null;
  return this.signCredential(callback);
}

/* Deprecated
UserSchema.statics.getUserFromCredential = function (credential) {
  if (!credential) {
    return new Promise (function(resolve, reject) { reject('Wrong Credential') });
  }
  return mongoose.model('User').findOne(
    {
      'credential.local_id' : credential.local_id,
      'credential.local_pw' : credential.local_pw,
      'credential.fb_id' : credential.fb_id,
    }).exec();
};
*/

UserSchema.statics.getUserFromCredentialHash = function (hash) {
  if (!hash) {
    return new Promise (function(resolve, reject) { reject('Wrong Hash') });
  } else {
    return mongoose.model('User').findOne({
      'credentialHash' : hash
    }).exec();
  }
};

UserSchema.statics.get_local = function(id, callback) {
  return mongoose.model('User').findOne({'credential.local_id' : id })
    .exec(callback);
};

UserSchema.statics.create_local = function(id, password, callback) {
  var User = mongoose.model('User');
  return User.get_local(id)
    .then(function(user){
      return new Promise(function (resolve, reject) {
        if (user) {
          var err = new Error("same id already exists")
          return reject(err);
        }
        user = new User({
          credential : {
            local_id : id,
            local_pw : password
          }
        });
        if (!user.credential.local_id ||
          !user.credential.local_id.match(/^[a-z0-9]{4,32}$/i)) {
            var err = new Error("incorrect id")
            return reject(err);
          }
        if (!user.credential.local_pw ||
          !user.credential.local_pw.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
            var err = new Error("incorrect password")
            return reject(err);
          }

        bcrypt.hash(user.credential.local_pw, 4, function (err, hash) {
          if (err) return reject(err);
          user.credential.local_pw = hash;
          user.signCredential(callback).then(function(user) {
            resolve(user);
          });
        });
      })
    })
    .catch(function(err){
      callback(err);
      return new Promise(function(resolve, reject) {
        reject(err);
      })
    });
};

UserSchema.statics.get_fb = function(id, callback) {
  return mongoose.model('User').findOne({'credential.fb_id' : id })
    .exec(callback);
};


module.exports = mongoose.model('User', UserSchema);