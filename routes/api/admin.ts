/**
 * routes/api/admin.js
 * Admin purpose
 */
import express = require('express');
import libfcm = require('../../lib/fcm');
var router = express.Router();

router.use(function(req, res, next) {
  if (req["user"].isAdmin) return next();
  else {
    return res.status(403).json({ errcode: 0x0003, message: 'Admin privilege required.' });
  }
});

router.post('/send_fcm', function(req, res, next) {
  var p = libfcm.send_msg(req.body.user_id, req.body.message);
  p.then(function(result) {
    res.status(200).send(result);
  }).catch(function(err){
    res.status(500).send(err);
  });
});

/*
var path = require('path');
var CourseBook = require(path.join(__dirname, 'model/courseBook'));


router.get('/course_books', function(req, res, next) {
  CourseBook.find({},'year semester', {sort : {year : -1, semester : -1 }}, function (err, courseBooks) {
    res.send(200, courseBooks)
  });
});
*/

export = router;