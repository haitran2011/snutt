import express = require('express');
var router = express.Router();
import {NotificationModel} from '../../model/notification';
import {UserDocument} from '../../model/user';

router.get('/', function(req, res, next){
  var user:UserDocument = <UserDocument>req["user"];
  var offset, limit;
  if (!req.query.offset) offset = 0;
  else offset = Number(req.query.offset);
  if (!req.query.limit) limit = 20;
  else limit = Number(req.query.limit);
  NotificationModel.getNewest(user, offset, limit).then(function(value){
    if (req.query.explicit) {
      user.updateNotificationCheckDate(function (err) {
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
  var user:UserDocument = <UserDocument>req["user"];
  NotificationModel.countUnread(user).then(function(value){
    res.json({count: value});
  }, function(err) {
    console.log(err);
    res.status(500).json({message: 'error'});
  });
});

export = router;
