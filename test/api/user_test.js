/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */
"use strict";

var assert = require('assert');

module.exports = function(app, db, request) {
  it('Log-in succeeds', function(done) {
    request.post('/api/auth/login_local')
      .query({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(res);
        done(err);
      });
  });

  describe('Log-in fails when', function() {
    it('user does not exist', function(done) {
      request.post('/api/auth/login_local')
        .query({id:"FakeSnutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong id');
          done(err);
        });
    });
    it('wrong password', function(done) {
      request.post('/api/auth/login_local')
        .query({id:"snutt", password:"abc12345"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong password');
          done(err);
        });
    });
  });

  it('Register succeeds', function(done) {
    request.post('/api/auth/register_local')
      .query({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        assert.equal(res.body.message, 'ok');
        done(err);
      });
  });

  describe('Register fails when', function() {
    it('No ID', function(done) {
      request.post('/api/auth/register_local')
        .query({password:"IDontNeedID"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Duplicate ID', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"snutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'same id already exists');
          done(err);
        });
    });

    it('Weird ID', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"snutt##*", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too short ID', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"tt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too long ID', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"ThisIsVeryLongIdYouKnowThatThisIsFreakingLongManVeryLong", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('No password', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"IDontNeedPw"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too short', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"idiot", password:"a1111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too long', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"dumb", password:"abcdefghijklmnopqrst1"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only digits', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"numb", password:"111111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only letters', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"numbnumb", password:"abcdef"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password with whitespace', function(done) {
      request.post('/api/auth/register_local')
        .query({id:"hacker", password:"sql injection"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });
  });

  describe('Facebook Function', function() {
    var token;
    var token2;
    var fb_id = "abcd";
    before(function(done) {
      request.post('/api/auth/login_local')
      .query({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(err);
        token = res.body.token;
        done(err);
      });
    });

    before(function(done) {
      request.post('/api/auth/login_local')
      .query({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(err);
        token2 = res.body.token;
        done(err);
      });
    });

    it('Log-in with facebook fails when no fb_id', function(done) {
      request.post('/api/auth/login_fb')
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          done(err);
        });
    });

    it('Attach fails when no fb_id', function(done) {
      request.post('/api/user/attach_fb')
        .set('x-access-token', token)
        .expect(400)
        .end(function(err, res){
          if (err) console.log(err);
          done(err);
        });
    });

    it('Attach Facebook ID', function(done) {
      request.post('/api/user/attach_fb')
        .set('x-access-token', token)
        .query({fb_id: fb_id})
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          token = res.body.token;
          done(err);
        });
    });

    it('Attach fails when already attached', function(done) {
      request.post('/api/user/attach_fb')
        .set('x-access-token', token)
        .query({fb_id: "abcd2"})
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.message, "already attached");
          done(err);
        });
    });

    it('Attach fails when already attached fb_id', function(done) {
      request.post('/api/user/attach_fb')
        .set('x-access-token', token2)
        .query({fb_id: "abcd"})
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.message, "already attached with this fb_id");
          done(err);
        });
    });

    it('Facebook status holds true', function(done) {
      request.post('/api/user/status_fb')
        .set('x-access-token', token)
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.attached, true);
          done(err);
        });
    });

    it('Log-in with facebook succeeds', function(done) {
      request.post('/api/auth/login_fb')
        .query({fb_id: fb_id})
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          done(err);
        });
    });

    it('Detach Facebook ID', function(done) {
      request.post('/api/user/detach_fb')
        .set('x-access-token', token)
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          token = res.body.token;
          done(err);
        });
    });

    it('Facebook status holds false', function(done) {
      request.post('/api/user/status_fb')
        .set('x-access-token', token)
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.attached, false);
          done(err);
        });
    });

    it('Detach fails when already detached', function(done) {
      request.post('/api/user/detach_fb')
        .set('x-access-token', token)
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.message, "not attached yet");
          done(err);
        });
    });
  });
};
