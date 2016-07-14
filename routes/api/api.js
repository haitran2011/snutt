var express = require('express');
var router = express.Router();

var CourseBook = require('../../model/courseBook');

var authRouter = require('./auth');
var timetableRouter = require('./timetable');
var searchQueryRouter = require('./searchQuery');
var tagsRouter = require('./tags');

router.get('/course_books', function(req, res, next) {
  CourseBook.find({},'year semester', {sort : {year : -1, semester : -1 }}, function (err, courseBooks) {
    res.send(200, courseBooks)
  });
});

router.use('/search_query', searchQueryRouter);

router.use('/tags', tagsRouter);

router.get('/app_version', function(req, res, next) {
   //FIXME : check for app_version and return the version
   res.send({version : 0.1});
});

/**
 * `authRouter` takes care of token authentication
 * All routers below needs to be authenticated
 */
router.use('/auth', authRouter);

router.use('/tables', timetableRouter);

module.exports = router;
