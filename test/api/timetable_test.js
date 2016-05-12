/**
 * test/api/timetable_test.js
 * These tests are for routes/api/timetable.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');
var async = require('async');

module.exports = function(app, db, request) {
  var token;
  var table_id;
  before(function(done) {
    async.series([
      function(callback) {
        request.post('/api/auth/login_local')
          .send({id:"snutt", password:"1234"})
          .expect(200)
          .end(function(err, res){
            token = res.body;
            if (err) done(err);
            callback(err);
          });
      },
      function(callback) {
        request.post('/api/tables/')
          .set('x-access-token', token)
          .send({year:2016, semester:1, title:"MyTimeTable"})
          .expect(200)
          .end(function(err, res){
            table_id = res.body;
            if (err) done(err);
            callback(err);
          });
      },
      function(callback) {
        done();
        callback();
      }
    ]);
  });

  it ('Get timetable list succeeds', function(done){
    request.get('/api/tables/')
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        assert.equal(res.body[0].title, "MyTimeTable");
        done();
      })
  });

  it ('Get timetable succeeds', function(done){
    request.get('/api/tables/'+table_id)
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        if (res.body.title != "MyTimeTable")
          done(new Error("timetable title differs"));
        done();
      })
  });

  it ('Create timetable succeeds', function(done){
    request.post('/api/tables/')
      .set('x-access-token', token)
      .send({year:2016, semester:1, title:"MyTimeTable2"})
      .expect(200)
      .end(function(err, res) {
        done(err);
      })
  });

  it ('Create timetable fails with the same title', function(done){
    request.post('/api/tables/')
      .set('x-access-token', token)
      .send({year:2016, semester:1, title:"MyTimeTable"})
      .expect(500, 'insert timetable failed')
      .end(function(err, res) {
        done(err);
      })
  });

  it ('Update timetable title succeeds', function(done){
    request.put('/api/tables/'+table_id)
      .set('x-access-token', token)
      .send({title:"MyTimeTable3"})
      .expect(200)
      .end(function(err, res) {
        assert.equal(res.body, table_id);
        request.get('/api/tables/'+table_id)
          .set('x-access-token', token)
          .expect(200)
          .end(function(err, res) {
            if (err) done(err);
            assert.equal(res.body.title, "MyTimeTable3");
            done();
          });
      })
  });

  /* TODO : Lecture CRUD. Copy must be done after lecture CRUD
   * because we should see whether the lecture contents copied correctly
   */
};
