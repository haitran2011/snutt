/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */

var assert = require('assert');
var request = require('supertest');
var app = require('../../app');
var db = require('../../db');

request = request(app);
describe('API Test', function() {
  before(function(done) {
    assert(db.connection.readyState);
    db.disconnect(function() {
      db.connect('mongodb://localhost/snutt_test', done);
    })
  });
  describe('User', function () {
    require('./user_test')(app, db, request);
  });
  describe('Timetable', function () {
    require('./timetable_test')(app, db, request);
  });
});
