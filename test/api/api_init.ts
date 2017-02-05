/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */
process.env.NODE_ENV = 'mocha';

import mocha = require("mocha");
 
import assert = require('assert');
import supertest = require('supertest');
import config = require('../../config/config');
import db = require('../../db');
import app = require('../../app');

var CourseBookModel = require('../../model/courseBook').CourseBookModel;
import {LectureModel} from '../../model/lecture';
import {FeedbackModel} from '../../model/feedback';

let request = supertest(app);
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
    CourseBookModel.findOneAndUpdate({ year: 2016, semester: 3 },
      { updated_at: Date.now() },
      {
        new: true,   // return new doc
        upsert: true // insert the document if it does not exist
      })
      .exec(function(err, doc) {
        if (err) return done(err);
        assert.equal(doc.year, 2016);
        assert.equal(doc.semester, 3);
        CourseBookModel.findOneAndUpdate({ year: 2015, semester: 4 },
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

  before(function(done) {
    var myLecture = new LectureModel({
        "year": 2016,
        "semester": 3,
        "classification": "전선",
        "department": "컴퓨터공학부",
        "academic_year": "3학년",
        "course_number": "400.320",
        "lecture_number": "002",
        "course_title": "공학연구의 실습 1",
        "credit": 1,
        "class_time": "화(13-1)/목(13-1)",
        "instructor": "이제희",
        "quota": 15,
        "enrollment": 0,
        "remark": "컴퓨터공학부 및 제2전공생만 수강가능",
        "category": "",
        /*
         * See to it that the server removes _id fields correctly
         */
        "_id": "56fcd83c041742971bd20a86",
        "class_time_mask": [
          0,
          12,
          0,
          12,
          0,
          0
        ],
        "class_time_json": [
          {
            "day": 1,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a88"
          },
          {
            "day": 3,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a87"
          }
        ],
    });
    myLecture.save(done);
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

  it('Send Feedback', function(done) {
    request.post('/api/feedback')
      .send({
        "email": "abcd@gmail.com",
        "message": "What is this?"
      })
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        FeedbackModel.find({}, function(err, docs) {
          assert.equal(docs.length, 1);
          assert.equal(docs[0].email, "abcd@gmail.com");
          done(err);
        })
      })
  })

  describe('User', function () {
    require('./user_test')(app, db, request);
  });

  describe('Timetable', function () {
    require('./timetable_test')(app, db, request);
  });
});
