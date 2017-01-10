import mongoose = require('mongoose');
import config = require('../config/config');
import bcrypt = require('bcrypt');
import crypto = require('crypto');
import errcode = require('../lib/errcode');
import {TimetableModel, TimetableDocument} from './timetable';
import {CourseBookModel} from './courseBook';

export interface UserDocument extends mongoose.Document {
  credential : {
    local_id: string,
    local_pw: string,
    fb_name: string,
    fb_id: string
  };
  credentialHash : string;
  isAdmin: boolean;
  regDate: Date;
  notificationCheckedAt: Date;
  email: string;
  fcm_key: string;
  active: boolean;

  verify_password(password: string, cb: (err, isMatch:boolean)=>void) : void;
  signCredential(callback?:(err, user:UserDocument)=>void):Promise<UserDocument>;
  getCredentialHash():string;
  compareCredentialHash(hash):string;
  updateNotificationCheckDate(callback?:(err, user:UserDocument)=>void):Promise<UserDocument>;
  changeLocalPassword(password:string, callback?:(err, user:UserDocument)=>void):void;
  attachFBId(fb_name:string, fb_id:string, callback?:(err, user:UserDocument)=>void):Promise<UserDocument>;
  detachFBId(callback?:(err, user:UserDocument)=>void):Promise<UserDocument>;
};

interface _UserModel extends mongoose.Model<UserDocument> {
  getUserFromCredentialHash(hash:string) : Promise<UserDocument>;
  getFCMKey(id:string, callback?:(err, key:string)=>void) : Promise<string>;
  get_local(id:string, callback:(err, user:UserDocument)=>void) : Promise<UserDocument>;
  create_local(old_user:UserDocument, id:string, password:string, callback?:(err, user:UserDocument)=>void) : Promise<UserDocument>;
  get_fb(name:string, id:string, callback?:(err, user:UserDocument)=>void) : Promise<UserDocument>;
  get_fb_or_create(name:string, id:string, callback?:(err, user:UserDocument)=>void) : Promise<UserDocument>;
}

var UserSchema = new mongoose.Schema({
  credential : {
    local_id: {type: String, default: null},
    local_pw: {type: String, default: null},
    fb_name: {type: String, default: null},
    fb_id: {type: String, default: null}
  },
  credentialHash : {type: String, default: null},
  isAdmin: {type: Boolean, default: false},
  regDate: {type: Date, default: Date.now()},
  notificationCheckedAt: {type: Date, default: Date.now()},
  email: String,
  fcm_key: String,

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
  var hmac = crypto.createHmac('sha256', config.secretKey);
  hmac.update(JSON.stringify(this.credential));
  this.credentialHash = hmac.digest('hex');
  return this.save(callback);
};

UserSchema.methods.getCredentialHash = function () {
  return this.credentialHash;
};

UserSchema.methods.compareCredentialHash = function(hash) {
  return this.credentialHash == hash;
};

UserSchema.methods.updateNotificationCheckDate = function (callback) {
  this.notificationCheckedAt = Date.now();
  return this.save(callback);
};

UserSchema.methods.changeLocalPassword = function(password, callback) {
  if (!password ||
        !password.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i))
    return callback({errcode: errcode.INVALID_PASSWORD, message: "incorrect password"});

  var user = this;
  user.credential.local_pw = password;

  bcrypt.hash(user.credential.local_pw, 4, function (err, hash) {
    if (err) return callback(err);
    user.credential.local_pw = hash;
    return user.signCredential(callback);
  });
};

UserSchema.methods.attachFBId = function(fb_name, fb_id, callback) {
  if (!fb_id) {
    callback("null fb_id");
    return Promise.reject("null fb_id");
  }
  this.credential.fb_name = fb_name;
  this.credential.fb_id = fb_id;
  return this.signCredential(callback);
};

UserSchema.methods.detachFBId = function(callback) {
  if (!this.credential.local_id) {
    callback("no local ID");
    return Promise.reject("no local ID");
  }
  this.credential.fb_name = null;
  this.credential.fb_id = null;
  return this.signCredential(callback);
};

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

UserSchema.statics.getUserFromCredentialHash = function (hash:string) : Promise<UserDocument> {
  if (!hash) {
    return Promise.reject('Wrong Hash');
  } else {
    return mongoose.model('User').findOne({
      'credentialHash' : hash,
      'active' : true
    }).exec();
  }
};

UserSchema.statics.getFCMKey = function(id, callback) {
  return mongoose.model('User').findOne({'_id' : id, 'active' : true }, "fcm_key").lean()
    .exec().then(function(user: UserDocument){
      if (!user) {
        callback("no user");
        return Promise.reject("no user");
      }
      callback(null, user.fcm_key);
      return Promise.resolve(user.fcm_key);
    }, function(err){
      callback(err);
      return Promise.reject(err);
    });
};

UserSchema.statics.get_local = function(id, callback) {
  return mongoose.model('User').findOne({'credential.local_id' : id, 'active' : true })
    .exec(callback);
};

UserSchema.statics.create_local = function(old_user, id, password, callback) {
  var User = <_UserModel>mongoose.model('User');
  if (!old_user) {
    old_user = new User({
      credential : {
        local_id : id,
        local_pw : password
      }
    });
  } else {
    old_user.credential.local_id = id;
    old_user.credential.local_pw = password;
  }
  return User.get_local(id, null)
    .then(function(user){
      return new Promise(function (resolve, reject) {
        var err;
        if (user) {
          err = { errcode:errcode.DUPLICATE_ID, message: "same id already exists" };
          return reject(err);
        }
        user = old_user;
        if (!user.credential.local_id ||
          !user.credential.local_id.match(/^[a-z0-9]{4,32}$/i)) {
            err = { errcode:errcode.INVALID_ID, message: "incorrect id"};
            return reject(err);
          }
        if (!user.credential.local_pw ||
          !user.credential.local_pw.match(/^(?=.*\d)(?=.*[a-z])\S{6,20}$/i)) {
            err = { errcode:errcode.INVALID_PASSWORD, message: "incorrect password"};
            return reject(err);
          }

        bcrypt.hash(user.credential.local_pw, 4, function (err, hash) {
          if (err) return reject({ errcode:errcode.SERVER_FAULT, message: "server fault"});
          user.credential.local_pw = hash;
          user.signCredential(callback).then(function(user) {
            resolve(user);
          });
        });
      });
    })
    .catch(function(err){
      callback(err);
      return Promise.reject(err);
    });
};

UserSchema.statics.get_fb = function(name, id, callback) {
  return mongoose.model('User').findOne({'credential.fb_id' : id, 'active' : true })
    .exec(callback);
};

UserSchema.statics.get_fb_or_create = function(name, id, callback) {
  var User = <_UserModel>mongoose.model('User');
  return User.get_fb(name, id, null)
    .then(function(user){
      if (!user) {
        user = new User({
          credential : {
            fb_name: name,
            fb_id: id
          }
        });
        CourseBookModel.getRecent({lean:true}).then(function(coursebook){
            return TimetableModel.createTimetable({
              user_id : user._id,
              year : coursebook.year,
              semester : coursebook.semester,
              title : "나의 시간표"});
        });
        return user.signCredential(callback);
      } else {
        callback(null, user);
        return Promise.resolve(user);
      }
    })
    .catch(function(err){
      callback(err);
      return Promise.reject(err);
    });
};

export let UserModel = <_UserModel>mongoose.model<UserDocument>('User', UserSchema);