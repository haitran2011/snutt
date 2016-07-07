/**
 * NotificationDetail Model
 * Jang Ryeol, ryeolj5911@gmail.com
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationDetailSchema = mongoose.Schema({
  title : { type : String, required : true },
  content : { type: Schema.Types.Mixed, default : null}
});

NotificationDetailSchema.statics.get = function (id, callback) {
  var query = mongoose.Model('NotificationDetail').findOne({'_id': id}).lean()
    .exec(callback);
};

NotificationDetailSchema.statics.createDetail = function (title, content, callback) {
  if (!content) content = null;
  var notificationDetail = new (mongoose.model('NotificationDetail'))({
    title : title,
    content : content
  });
  // Mixed Type must be marked manually
  if (content) notificationDetail.markModified('content');
  notificationDetail.save(callback);
};

module.exports = mongoose.model('NotificationDetail', NotificationDetailSchema);