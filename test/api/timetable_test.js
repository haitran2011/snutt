/**
 * test/api/timetable_test.js
 * These tests are for routes/api/timetable.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');

module.exports = function(app, db, request) {
  var token;
  before(function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt", password:"1234"})
      .expect(200)
      .end(function(err, res){
        token = res.body;
        done(err);
      });
  });
  
  // TODO : Lecture CRUD
};
