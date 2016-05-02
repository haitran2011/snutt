/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');

module.exports = function(app, db, request) {
  it('Check DB Connected', function() {
    assert(db.connection.readyState);
  });
  // TODO : return actual token
  return "false token";
};
