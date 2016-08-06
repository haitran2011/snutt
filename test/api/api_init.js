/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */
"use strict";

process.env.NODE_ENV = 'mocha';

var assert = require('assert');
var request = require('supertest');
var db = require('../../db');
var app = require('../../app');

request = request(app);
describe('API Test', function() {

  // Change connection into test DB in order not to corrupt production DB
  before(function(done) {
    if (!db.connection.readyState)
      return done(new Error("DB not connected"));
    db.disconnect(function() {
      db.connect('mongodb://localhost/snutt_test', function(err){
        return done(err);
      });
    })
  });

  // Clean Test DB
  // mongoose.connection.db.dropDatabase()
  // dose not actually drop the db, but actually clears it
  before(function(done) {
    db.connection.db.dropDatabase(function(err) {
      done(err);
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

  describe('User', function () {
    require('./user_test')(app, db, request);
  });

  describe('Timetable', function () {
    require('./timetable_test')(app, db, request);
  });
});
