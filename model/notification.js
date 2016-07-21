/**
 * Notification Model
 * Jang Ryeol, ryeolj5911@gmail.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');
var async = require('async');

var NotificationSchema = mongoose.Schema({
  user_id : { type: Schema.Types.ObjectId, ref: 'User', required : true },
  message : { type : String, required : true },
  created_at : { type : Date, required : true},
  type : { type: Number, required : true, default : 0 },
  detail : { type: Schema.Types.ObjectId, ref: 'NotificationDetail', default : null }
});

NotificationSchema.index({user_id: 1, created_at: -1});

NotificationSchema.statics.getNewest = function (user, offset, limit, callback) {
  return mongoose.Model('Notification').where('user_id').in([null, user._id])
    .sort('-created_at')
    .skip(offset)
    .limit(limit)
    .lean()
    .exec(callback);
};

NotificationSchema.statics.countUnread = function (user) {
  
};

/** 
 * Types
 * - Type.NORMAL      : Normal Messages. Detail would be null
 * - Type.COURSEBOOK  : Course Book Changes. Detail contains lecture difference
 * - Type.LECTURE     : Lecture Changes. Course book changes are for all users.
 *                      Lecture changes contains per-user update log.
 */
NotificationSchema.statics.Type = {
  NORMAL : 0,
  COURSEBOOK : 1,
  LECTURE : 2
};

// if user_id_array is null or not array, create it as global
NotificationSchema.statics.createNotifications = function (user_id_array, message, type, detail, callback) {
  if (!user_id_array || !user_id_array.length) {
    user_id_array = [null];
  }
  if (!type) type = 0;
  var notification_array = new Array(user_id_array.length);
  for (var i=0; i<user_id_array.length; i++) {
    notification_array[i] = {
      user_id : user_id_array[i],
      message : message,
      created_at : Date.now(),
      type : type,
      detail : detail
    };
  }
  mongoose.model('Notification').create(notification_array, callback);
};

module.exports = mongoose.model('Notification', NotificationSchema);
