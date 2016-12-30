/**
 * Notification Model
 * Jang Ryeol, ryeolj5911@gmail.com
 */
"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('./user');
var fcm = require('../lib/fcm');
var NotificationSchema = mongoose.Schema({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    message: { type: String, required: true },
    created_at: { type: Date, required: true },
    type: { type: Number, required: true, default: 0 },
    detail: { type: Schema.Types.Mixed, default: null },
    fcm_status: { type: String, default: null }
});
NotificationSchema.index({ user_id: 1, created_at: -1 });
NotificationSchema.statics.getNewest = function (user, offset, limit, callback) {
    return mongoose.model('Notification').where('user_id').in([null, user._id])
        .sort('-created_at')
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(callback);
};
NotificationSchema.statics.countUnread = function (user, callback) {
    return mongoose.model('Notification').where('user_id').in([null, user._id])
        .count({ created_at: { $gt: user.notificationCheckedAt } })
        .exec(callback);
};
/**
 * Types
 * - Type.NORMAL      : Normal Messages. Detail would be null
 * - Type.COURSEBOOK  : Course Book Changes. Detail contains lecture difference
 * - Type.LECTURE     : Lecture Changes. Course book changes are for all users.
 *                      Lecture changes contains per-user update log.
 */
NotificationSchema.statics.Type = {
    NORMAL: 0,
    COURSEBOOK: 1,
    LECTURE: 2
};
// if user_id_array is null or not array, create it as global
NotificationSchema.statics.createNotification = function (user_id, message, type, detail, callback) {
    if (!type)
        type = 0;
    var Notification = mongoose.model('Notification');
    var notification = new Notification({
        user_id: user_id,
        message: message,
        created_at: Date.now(),
        type: type,
        detail: detail
    });
    var promise = fcm.send_msg(user_id, message);
    promise = promise.then(function (result) {
        notification.fcm_status = result;
        return notification.save(callback);
    }).catch(function (err) {
        notification.fcm_status = "err";
        return notification.save(callback);
    });
    return promise;
};
module.exports = mongoose.model('Notification', NotificationSchema);
