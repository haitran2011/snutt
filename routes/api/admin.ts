/**
 * routes/api/admin.js
 * Admin purpose
 */
"use strict";

var express = require('express');
var router = express.Router();

router.use(function(req, res, next) {
  if (req.user.isAdmin) return next();
  else {
    return res.status(403).json({ errcode: 0x0003, message: 'Admin privilege required.' });
  }
});

router.post('/password', function (req, res, next) {
  if (req.user.credential.local_id) return res.status(403).json({message: "already have local id"});
  User.create_local(req.user, req.body.id, req.body.password, function(err, user){
    if (err) return res.status(403).json({message:err.message});
    res.json({token: req.user.getCredentialHash()});
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

module.exports = router;