/**
 * test/api/api_init.js
 * This script is parent script for api tests.
 * usage : $ npm test
 */

process.env.NODE_ENV = 'mocha';

var assert = require('assert');
var request = require('supertest');
var app = require('../../app');
var db = require('../../db');

request = request(app);
describe('API Test', function() {
  
  // Change connection into test DB in order not to corrupt production DB
  before(function(done) {
    assert(db.connection.readyState);
    db.disconnect(function() {
      db.connect('mongodb://localhost/snutt_test', function(err){
        if (err) return done(err);
        // Clean Test DB
        // mongoose.connection.db.dropDatabase()
        // dose not actually drop the db, but actually clears it
        db.connection.db.dropDatabase(function(err) {
          done(err);
        });
      });
    })
  });
  
  // Register test user
  before(function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt", password:"1234"})
      .expect(200, 'ok')
      .end(function(err, res){
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
