/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */

var assert = require('assert');
var request = require('supertest');
var app = require('../../app');
var db = require('../../db');

// User token. Get from 'User' test
var token;

request = request(app);
describe('API Test', function() {
  it('Check DB Connected', function() {
    assert(db.connection.readyState);
  });
  it('Switch to test DB', function(done) {
    db.disconnect(function() {
      db.connect('mongodb://localhost/snutt_test', done);
    })
  });
  describe('User', function () {
    token = require('./user_test')(app, db, request);
  });
  describe('Timetable', function () {
    require('./timetable_test')(app, db, request, token);
  });
});
