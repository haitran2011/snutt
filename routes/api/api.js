"use strict";

var express = require('express');
var router = express.Router();

var CourseBook = require('../../model/courseBook');

var authRouter = require('./auth');
var timetableRouter = require('./timetable');
var searchQueryRouter = require('./searchQuery');
var tagsRouter = require('./tags');
var notificationRouter = require('./notification');
var userRouter = require('./user');
var apiKey = require('../../config/apiKey');
var User = require('../../model/user');

var api_info;

/**
 * Check API Key
 */
router.use(function(req, res, next) {
  var token = req.headers['x-access-apikey'];
  apiKey.validateKey(token).then(function(value){
    api_info = value;
    next();
  }, function(err) {
    res.status(403).json({message: err});
  });
});

router.get('/course_books', function(req, res, next) {
  CourseBook.find({},'year semester', {sort : {year : -1, semester : -1 }}, function (err, courseBooks) {
    res.json(courseBooks);
  });
});

router.use('/search_query', searchQueryRouter);

router.use('/tags', tagsRouter);

router.get('/app_version', function(req, res, next) {
  var version = apiKey.getAppVersion(api_info.string);
  if (version) res.json({version: version});
  else res.status(404).json({message: "unknown app"});
});

router.use('/auth', authRouter);

/**
 * Token Authenticator
 * Checks if the user is logged in
 * Which means all routers below this need authentication
 * If the user object is modified, you should re-login!!
 */
router.use(function(req, res, next) {
  if(req.user) return next();
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if (token) {
    User.getUserFromCredentialHash(token).then(function(user){
      req.user = user;
      next();
    }, function (err) {
      console.log(err);
      return res.status(403).json({ message: 'Failed to authenticate token.' });
    });
  } else {
    // if there is no token
    // return an error
    return res.status(401).json({
      message: 'No token provided.'
    });
  }
});

router.use('/tables', timetableRouter);

router.use('/user', userRouter);

router.use('/notification', notificationRouter);

module.exports = router;
