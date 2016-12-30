"use strict";
const express = require("express");
var router = express.Router();
var CourseBook = require('../../model/courseBook');
var authRouter = require('./auth');
var timetableRouter = require('./timetable');
var searchQueryRouter = require('./searchQuery');
var tagsRouter = require('./tags');
var notificationRouter = require('./notification');
var userRouter = require('./user');
var adminRouter = require('./admin');
var apiKey = require('../../config/apiKey');
const User = require("../../model/user");
var api_info;
/**
 * Check API Key
 */
router.use(function (req, res, next) {
    var token = req.headers['x-access-apikey'];
    apiKey.validateKey(token).then(function (value) {
        api_info = value;
        next();
    }, function (err) {
        res.status(403).json({ errcode: 0x0000, message: err });
    });
});
router.get('/course_books', function (req, res, next) {
    CourseBook.getAll({ lean: true }, function (err, courseBooks) {
        if (err)
            return res.status(500).json({ message: "server fault" });
        res.json(courseBooks);
    });
});
router.get('/course_books/recent', function (req, res, next) {
    CourseBook.getRecent({ lean: true }, function (err, courseBook) {
        if (err)
            return res.status(500).json({ message: "server fault" });
        res.json(courseBook);
    });
});
router.use('/search_query', searchQueryRouter);
router.use('/tags', tagsRouter);
router.get('/app_version', function (req, res, next) {
    var version = apiKey.getAppVersion(api_info.string);
    if (version)
        res.json({ version: version });
    else
        res.status(404).json({ message: "unknown app" });
});
router.use('/auth', authRouter);
/**
 * Token Authenticator
 * Checks if the user is logged in
 * Which means all routers below this need authentication
 * If the user object is modified, you should re-login!!
 */
router.use(function (req, res, next) {
    if (req["user"])
        return next();
    var token = req.query.token || req.body.token || req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({
            errcode: 0x0002,
            message: 'No token provided.'
        });
    }
    User.getUserFromCredentialHash(token).then(function (user) {
        if (!user)
            return res.status(403).json({ errcode: 0x0001, message: 'Failed to authenticate token.' });
        req["user"] = user;
        next();
    }, function (err) {
        console.log(err);
        return res.status(403).json({ errcode: 0x0001, message: 'Failed to authenticate token.' });
    });
});
router.use('/tables', timetableRouter);
router.use('/user', userRouter);
router.use('/notification', notificationRouter);
router.use('/admin', adminRouter);
module.exports = router;
