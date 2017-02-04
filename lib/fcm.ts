import {UserModel, UserDocument} from '../model/user';
import request = require('request-promise-native');
import config = require('../config/config');

function fcm_create_noti_key(key_name:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "create",
            "notification_key_name": key_name,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      return Promise.reject(err.response.body.error);
    });
}

function fcm_get_noti_key(key_name:string): Promise<string> {
  return request({
      method: 'GET',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      qs: {
        "notification_key_name": key_name
      },
      json: true
    }).then(function (body) {
      return Promise.resolve(body.notification_key);
    }).catch(function (err) {
      return Promise.reject(err.response.body.error);
    });
}

function fcm_add_device(key_name:string, key:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "add",
            "notification_key_name": key_name,
            "notification_key": key,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      return Promise.reject(err.response.body.error);
    });
}

function fcm_remove_device(key_name:string, key:string, registration_ids:[string]): Promise<string> {
  return request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "remove",
            "notification_key_name": key_name,
            "notification_key": key,
            "registration_ids": registration_ids
      },
      json: true
    }).then(function(body){
      return Promise.resolve(body.notification_key);
    }).catch(function(err){
      return Promise.reject(err.response.body.error);
    });
}

function fcm_add_topic(registration_id:string): Promise<any> {
  return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1/'+registration_id+'/rel/topics/global',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
        // no need for project_id
      }
    }).catch(function(err){
      return Promise.reject(err.response);
    });
}

function fcm_remove_topic_batch(registration_tokens:[string]): Promise<any> {
  return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
        // no need for project_id
      },
      body: {
        "to": "/topics/global",
        "registration_tokens": registration_tokens
      },
      json: true
    }).catch(function(err){
      return Promise.reject(err.response);
    });
}

function fcm_send_msg(to:string, title:string, body:string) {
  return request({
      method: 'POST',
      uri: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
      },
      body: {
            "to": to,
            "notification" : {
              "body" : body,
              "title" : title
            },
            "priority" : "high",
            "content_available" : true
      },
      json:true,
    }).catch(function(err){
      return Promise.reject(err.response);
    });
}

function get_or_create_key(user:UserDocument, registration_id:string): Promise<string> {
  var key_name = "user-"+user._id;
  var promise:Promise<any> = fcm_create_noti_key(key_name, [registration_id]);
  promise = promise.catch(function (err) {
    if (err == "notification_key already exists") {
      return fcm_get_noti_key(key_name)
    } else {
      return Promise.reject(err);
    }
  });
  promise = promise.then(function(fcm_key){
    user.fcm_key = fcm_key;
    return user.save();
  });
  promise = promise.then(function(user) {
    return Promise.resolve(user.fcm_key);
  });
  return promise;
}

/*
 * create_device
 * Add this registration_id for the user
 * and add topic
 */
export function create_device(user:UserDocument, registration_id:string): Promise<string> {
  var promise;
  if (!user.fcm_key) {
    promise = get_or_create_key(user, registration_id);
  } else {
    promise = Promise.resolve(user.fcm_key);
  }

  promise = promise.then(function(fcm_key) {
    return fcm_add_device("user-"+user._id, fcm_key, [registration_id]);
  }).catch(function(err){
    // User fcm key could be invalid
    return get_or_create_key(user, registration_id).then(function(fcm_key){
      return fcm_add_device("user-"+user._id, fcm_key, [registration_id]);
    });
  });

  promise = promise.then(function(fcm_key){
    return fcm_add_topic(registration_id);
  });

  return promise;
}

/*
 * remove_device
 * Remove this registration_id for the user
 */
export function remove_device(user:UserDocument, registration_id:string) {
  var promise;
  if (!user.fcm_key) {
    promise = get_or_create_key(user, registration_id);
  } else {
    promise = Promise.resolve(user.fcm_key);
  }

  promise = promise.then(function(fcm_key) {
    return fcm_remove_device("user-"+user._id, fcm_key, [registration_id]);
  }).catch(function(err){
    // User fcm key could be invalid
    return get_or_create_key(user, registration_id).then(function(fcm_key){
      return fcm_remove_device("user-"+user._id, fcm_key, [registration_id]);
    });
  });

  promise = promise.then(function(fcm_key) {
    return fcm_remove_topic_batch([registration_id]);
  });
  return promise;
}

/*
 * send_msg
 * If user_id is null, it's a global message
 */
export function send_msg(user_id:string, message:string, cb?): Promise<string> {
  var promise:Promise<any>;
  if (user_id && user_id.length > 0) {
    promise = UserModel.getFCMKey(user_id);
    promise = promise.then(function(fcmkey){
      return Promise.resolve(fcmkey);
    }).catch(function(err){
      return Promise.reject("failed to get FCM Key"); 
    });
  } else {
    promise = Promise.resolve("/topics/global")
  }

  promise = promise.then(function(to) {
    return fcm_send_msg(to, "SNUTT", message).then(function(body){
      return Promise.resolve("ok");
    });
  });

  promise = promise.then(function(result){
    if(cb) cb(null, result);
    return Promise.resolve(result);
  }).catch(function(err){
    if(cb) cb(err);
    return Promise.reject(err);
  });

  return promise;
}
