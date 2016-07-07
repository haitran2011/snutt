/**
 * Notification Model
 * Jang Ryeol, ryeolj5911@gmail.com
 *
 * Types
 * - 0 : Normal Messages. Detail would be null
 * - 1 : Course Book Changes. Detail contains lecture difference
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = mongoose.Schema({
  user_id : { type: Schema.Types.ObjectId, ref: 'User', default : null },
  message : { type : String, required : true },
  created_at : { type : Date, required : true},
  checked : { type : Boolean, required : true, default : false},
  type : { type: Number, required : true, default : 0 },
  detail : { type: Schema.Types.Mixed }
});

NotificationSchema.index({user_id: 1, created_at: -1});

NotificationSchema.statics.getNewest = function (user_id, offset, limit) {
  var query = mongoose.Model('Notification').where('user_id').in([null, user_id])
    .sort('-created_at')
    .skip(offset)
    .limit(limit)
}

NotificationSchema.statics.createNotification = function (user_id, message, type, detail) {
  if (!user_id) user_id = null;
  if (!type) type = 0;
  if (!detail) detail = null;
  var notification = new (mongoose.Model('Notification'))({
    user_id : user_id,
    message : message,
    created_at : Date.now(),
    type : type,
    detail : detail
  });
  notification.markModified('detail');
  notification.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
