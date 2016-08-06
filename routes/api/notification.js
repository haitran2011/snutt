"use strict";

var router = require('express').Router();
var Notification = require('../../model/notification');
var User = require('../../model/user');

router.get('/', function(req, res, next){
  var offset, limit;
  if (!req.body.offset) offset = 0;
  else offset = Number(req.body.offset);
  if (!req.body.limit) limit = 20;
  else limit = Number(req.body.limit);
  Notification.getNewest(req.user, offset, limit).then(function(value){
    if (req.body.explicit) {
      req.user.updateNotificationCheckDate(function (err) {
        if (err) {
          console.log(err);
          return res.status(500).json({message: 'error'});
        }
        res.json(value);
      });
    } else {
      res.json(value);
    }
  }, function(err) {
    console.log(err);
    res.status(500).json({message: 'error'});
  });
});

router.get('/count', function(req, res, next){
  Notification.countUnread(req.user).then(function(value){
    // res.send() dose not accept number for response body
    // if number, it treats it as http status
    res.json({count: value.toString()});
  }, function(err) {
    console.log(err);
    res.status(500).json({message: 'error'});
  });
});

module.exports = router;
