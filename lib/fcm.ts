import {UserModel, UserDocument} from '../model/user';
import request = require('request-promise-native');
import config = require('../config/config');

/*
 * create_device
 * Add this registration_id for the user
 * and add topic
 */
export function create_device(user:UserDocument, registration_id:string) {
  var promise;
  // If user doesn't have key, create or fetch key
  if (!user.fcm_key) {
    promise = request({
      method: 'POST',
      uri: 'https://android.googleapis.com/gcm/notification',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key,
        "project_id":config.fcm_project_id
      },
      body: {
            "operation": "create",
            "notification_key_name": "user-"+user._id,
            "registration_ids": [registration_id]
      },
      json: true
    }).then(function (body) {
      return Promise.resolve(body.notification_key);
    }).catch(function (err) {
      if (err.response.body.error == "notification_key already exists") {
        request({
          method: 'GET',
          uri: 'https://android.googleapis.com/gcm/notification',
          headers: {
            "Content-Type":"application/json",
            "Authorization":"key="+config.fcm_api_key,
            "project_id":config.fcm_project_id
          },
          qs: {
            "notification_key_name": "user-"+user._id
          },
          json: true
        }).then(function (body) {
          return Promise.resolve(body.notification_key);
        });
      }
    }).then(function (notification_key) {
      user.fcm_key = notification_key;
      return user.save().then(function(user){
        return Promise.resolve('key ready');
      });
    });
  } else {
    promise = Promise.resolve('key ready');
  }

  // Now user has key
  promise = promise.then(function(status){
    // Device is already added during key creation
    if (status === 'device ready')
      return Promise.resolve(status);

    // User should have had key
    if (!user.fcm_key) return Promise.reject("server fault");

    // Add the device
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
            "notification_key_name": "user-"+user._id,
            "notification_key": user.fcm_key,
            "registration_ids": [registration_id]
      },
      json: true
    }).then(function(body){
      if (body.notification_key) {
        return Promise.resolve('device ready');
      } else if (body.error) {
        return Promise.reject(body.error);
      }
      return Promise.reject('cannot add device');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  // Add topic
  promise = promise.then(function(status){
    // User should have had key
    if (!user.fcm_key) return Promise.reject("server fault");

    // Add topic
    return request({
      method: 'POST',
      uri: 'https://iid.googleapis.com/iid/v1/'+user.fcm_key+'/rel/topics/global',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
        // no need for project_id
      },
      resolveWithFullResponse: true
    }).then(function(res){
      if (res.statusCode == 200) {
        return Promise.resolve('done');
      }
      return Promise.reject('cannot add topic');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });

  return promise;
}

/*
 * remove_device
 * Remove this registration_id for the user
 */
export function remove_device(user:UserDocument, registration_id:string) {
  var promise = new Promise(function(resolve, reject){
    // User should have had key
    if (!user.fcm_key) return reject("no key");

    // Remove the device
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
            "notification_key_name": "user-"+user._id,
            "notification_key": user.fcm_key,
            "registration_ids": [registration_id]
      },
      json: true
    }).then(function(body){
      if (body.notification_key) {
        return resolve('device ready');
      } else if (body.error) {
        return reject(body.error);
      }
      return reject('cannot remove device');
    });
  });

  /*
  // remove topic
  promise = promise.then(function(status){
    // User should have had key
    if (!user.fcm_key) return Promise.reject("server fault");

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
        "registration_tokens": [user.fcm_key]
      },
      json: true,
      resolveWithFullResponse: true
    }).then(function(res){
      if (res.statusCode == 200 && !res.body.results[0].error) {
        return Promise.resolve('done');
      }
      return Promise.reject('cannot remove topic');
    });
  }).catch(function(err){
    // pass along errors
    return Promise.reject(err);
  });
  */

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

  promise = promise.then(function(target) {
    return request({
      method: 'POST',
      uri: 'https://fcm.googleapis.com/fcm/send',
      headers: {
        "Content-Type":"application/json",
        "Authorization":"key="+config.fcm_api_key
      },
      body: {
            "to": target,
            "notification" : {
              "body" : message,
              "title" : "SNUTT"
            },
            "priority" : "high",
            "content_available" : true
      },
      json:true,
      resolveWithFullResponse: true
    });
  });

  promise = promise.then(function(res){
    if (res.statusCode === 200) return Promise.resolve("ok");
    else return Promise.reject(res.body);
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
