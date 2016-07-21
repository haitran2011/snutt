var router = require('express').Router();
var Notification = require('../../model/notification');

router.get('/', function(req, res, next){
  Notification.getNewest(req.user, 0, 20).then(function(value){
    res.json(value);
  }, function(err) {
    console.log(err);
    res.status(500).send('error');
  });
});

router.get('/count', function(req, res, next){
  Notification.countUnread(req.user).then(function(value){
    res.send(value);
  }, function(err) {
    console.log(err);
    res.status(500).send('error');
  });
});

module.exports = router;
