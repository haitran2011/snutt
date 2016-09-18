/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */
"use strict";

process.env.NODE_ENV = 'mocha';

var assert = require('assert');
var request = require('supertest');
var config = require('../../config/config');
var db = require('../../db');
var app = require('../../app');

var CourseBook = require('../../model/courseBook');

request = request(app);
describe('API Test', function() {



  before(function(done) {
    if (config.secretKey && config.host && config.port && config.email)
      return done();
    else
      return done(new Error("Config is not set. If you're not serious, Just type\n" +
       "> SNUTT_HOST=localhost SNUTT_PORT=3000 SNUTT_EMAIL=snutt@wafflestudio.com SNUTT_SECRET=1 npm test"));
  });

  // Change connection into test DB in order not to corrupt production DB
  before(function(done) {
    if (!db.connection.readyState)
      return done(new Error("DB not connected"));
    db.connection.close(function() {
      db.connect('mongodb://localhost/snutt_test', function(err){
        return done(err);
      });
    });
  });

  // Clean Test DB
  // mongoose.connection.db.dropDatabase()
  // dose not actually drop the db, but actually clears it
  before(function(done) {
    db.connection.db.dropDatabase(function(err) {
      done(err);
    });
  });

  // Add 2 coursebooks, 2016-2 and 2015-W
  before(function(done) {
    CourseBook.findOneAndUpdate({ year: 2016, semester: 3 },
      { updated_at: Date.now() },
      {
        new: true,   // return new doc
        upsert: true // insert the document if it does not exist
      })
      .exec(function(err, doc) {
        if (err) return done(err);
        assert.equal(doc.year, 2016);
        assert.equal(doc.semester, 3);
        CourseBook.findOneAndUpdate({ year: 2015, semester: 4 },
          { updated_at: Date.now() },
          {
            new: true,   // return new doc
            upsert: true // insert the document if it does not exist
          })
          .exec(function(err, doc) {
            if (err) return done(err);
            assert.equal(doc.year, 2015);
            assert.equal(doc.semester, 4);
            done(err);
        });
    });
  });

  // Register test user
  before(function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        assert.equal(res.body.message, 'ok');
        done(err);
      });
  });

  it('MongoDB >= 2.4', function(done) {
    var admin = db.connection.db.admin();
    admin.buildInfo(function (err, info) {
      if (err)
        return done(err);
      if (parseFloat(info.version) < 2.4)
        return done(new Error("MongoDB version("+info.version+") is outdated(< 2.4). Service might not work properly"));
      done();
    });
  });

  it('Recent Coursebook', function(done) {
    request.get('/api/course_books/recent')
      .expect(200)
      .end(function(err, res){
        assert.equal(res.body.semester, 3);
        done(err);
      });
  });

  describe('User', function () {
    require('./user_test')(app, db, request);
  });

  describe('Timetable', function () {
    require('./timetable_test')(app, db, request);
  });
});
