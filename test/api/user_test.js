/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */

var assert = require('assert');

module.exports = function(app, db, request) {
  it('Log-in succeeds', function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt", password:"1234"})
      .expect(200)
      .end(function(err, res){
        done(err);
      });
  });

  describe('Log-in fails when', function() {
    it('user does not exist', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"FakeSnutt", password:"1234"})
        .expect(404, 'user not found')
        .end(function(err, res){
          done(err);
        });
    });
    it('wrong password', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"snutt", password:"12345"})
        .expect(403, 'wrong password')
        .end(function(err, res){
          done(err);
        });
    });
  });

  it('Register succeeds', function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt2", password:"1234"})
      .expect(200, 'ok')
      .end(function(err, res){
        done(err);
      });
  });

  describe('Register fails when', function() {
    it('Duplicate ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt", password:"1234"})
        .expect(500, 'same id already exists')
        .end(function(err, res){
          done(err);
        });
    });

    it('Weird ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt##*", password:"1234"})
        .expect(500, 'incorrect id')
        .end(function(err, res){
          done(err);
        });
    });

    it('Too short ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"tt", password:"1234"})
        .expect(500, 'incorrect id')
        .end(function(err, res){
          done(err);
        });
    });

    it('Too long ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"Thisisverylongidyouknothatthisisfreakinglongmanverylong", password:"1234"})
        .expect(500, 'incorrect id')
        .end(function(err, res){
          done(err);
        });
    });

    it('No password', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"IDontNeedPw", password:""})
        .expect(500, 'incorrect password')
        .end(function(err, res){
          done(err);
        });
    });
  });
};
