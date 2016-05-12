/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');

module.exports = function(app, db, request) {
  it('Duplicate ID register fails', function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt", password:"1234"})
      .expect(500, 'same id already exists')
      .end(function(err, res){
        done(err);
      });
  });
  it('Log-in succeeds', function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt", password:"1234"})
      .expect(200)
      .end(function(err, res){
        done(err);
      });
  });
};
