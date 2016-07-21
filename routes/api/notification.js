var router = require('express').Router();
var Notification = require('../../model/notification');
var User = require('../../model/user');

router.get('/', function(req, res, next){
  Notification.getNewest(req.user, 0, 20).then(function(value){
    if (req.query.explicit) {
      req.user.updateNotificationCheckDate(function (err) {
        if (err) {
          console.log(err);
          return res.status(500).send('error');
        }
        res.json(value);
      });
    } else {
      res.json(value);
    }
  }, function(err) {
    console.log(err);
    res.status(500).send('error');
  });
});

router.get('/count', function(req, res, next){
  Notification.countUnread(req.user).then(function(value){
    // res.send() dose not accept number for response body
    // if number, it treats it as http status
    res.send(value.toString());
  }, function(err) {
    console.log(err);
    res.status(500).send('error');
  });
});

module.exports = router;
