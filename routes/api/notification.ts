"use strict";

var router = require('express').Router();
var Notification = require('../../model/notification');
var User = require('../../model/user');

router.get('/', function(req, res, next){
  var offset, limit;
  if (!req.query.offset) offset = 0;
  else offset = Number(req.query.offset);
  if (!req.query.limit) limit = 20;
  else limit = Number(req.query.limit);
  Notification.getNewest(req.user, offset, limit).then(function(value){
    if (req.query.explicit) {
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
    res.json({count: value});
  }, function(err) {
    console.log(err);
    res.status(500).json({message: 'error'});
  });
});

module.exports = router;
