/**
 * test/api/timetable_test.js
 * These tests are for routes/api/timetable.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');

module.exports = function(app, db, request, token) {
  it('Check DB Connected', function() {
    assert(db.connection.readyState);
  });
  // TODO : check actual token
  it('Check Token', function() {
    assert.equal(token, "true token");
  });
  // TODO : Lecture CRUD
};
