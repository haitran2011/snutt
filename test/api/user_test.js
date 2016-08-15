/**
 * test/api/user_test.js
 * These tests are for routes/api/user.js
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */
"use strict";

var assert = require('assert');

module.exports = function(app, db, request) {
  var token;
  var token2;

  it('Log-in succeeds', function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(res);
        token = res.body.token;
        done(err);
      });
  });

  it('Token transaction works', function(done) {
    request.get('/api/user/info')
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res){
        if (err) console.log(res);
        done(err);
      });
  });

  it('Token transaction fails when no token', function(done) {
    request.get('/api/user/info')
      .expect(401)
      .end(function(err, res){
        if (err) console.log(res);
        assert.equal(res.body.errcode, 0x0002);
        done(err);
      });
  });

  it('Token transaction fails when incorrect token', function(done) {
    request.get('/api/user/info')
      .set('x-access-token', "abcd")
      .expect(403)
      .end(function(err, res){
        if (err) console.log(res);
        assert.equal(res.body.errcode, 0x0001);
        done(err);
      });
  });

  describe('Log-in fails when', function() {
    it('user does not exist', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"FakeSnutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong id');
          done(err);
        });
    });
    it('wrong password', function(done) {
      request.post('/api/auth/login_local')
        .send({id:"snutt", password:"abc12345"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'wrong password');
          done(err);
        });
    });
  });

  it('Register succeeds', function(done) {
    request.post('/api/auth/register_local')
      .send({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        assert.equal(res.body.message, 'ok');
        done(err);
      });
  });

  it('Log-in registered account', function(done) {
    request.post('/api/auth/login_local')
      .send({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(res);
        token2 = res.body.token;
        done(err);
      });
  });

  it('Auto-generated default timetable', function(done) {
    request.get('/api/tables/')
      .set('x-access-token', token2)
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        assert.equal(res.body[0].title, "나의 시간표");
        assert.equal(res.body[0].year, 2016);
        assert.equal(res.body[0].semester, 3);
        done();
      });
  });

  describe('Register fails when', function() {
    it('No ID', function(done) {
      request.post('/api/auth/register_local')
        .send({password:"IDontNeedID"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Duplicate ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'same id already exists');
          done(err);
        });
    });

    it('Weird ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"snutt##*", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too short ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"tt", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('Too long ID', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"ThisIsVeryLongIdYouKnowThatThisIsFreakingLongManVeryLong", password:"abc1234"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect id');
          done(err);
        });
    });

    it('No password', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"IDontNeedPw"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too short', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"idiot", password:"a1111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password too long', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"dumb", password:"abcdefghijklmnopqrst1"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only digits', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"numb", password:"111111"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password only letters', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"numbnumb", password:"abcdef"})
        .expect(403)
        .end(function(err, res){
          assert.equal(res.body.message, 'incorrect password');
          done(err);
        });
    });

    it('Password with whitespace', function(done) {
      request.post('/api/auth/register_local')
        .send({id:"hacker", password:"sql injection"})
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
    var fb_token = "correct";
    var fb_token2 = "correct2";
    before(function(done) {
      request.post('/api/auth/login_local')
      .send({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(err);
        token = res.body.token;
        done(err);
      });
    });

    before(function(done) {
      request.post('/api/auth/login_local')
      .send({id:"snutt2", password:"abc1234*"})
      .expect(200)
      .end(function(err, res){
        if (err) console.log(err);
        token2 = res.body.token;
        done(err);
      });
    });

    it('Log-in with facebook fails when no fb_id', function(done) {
      request.post('/api/auth/login_fb')
        .expect(400)
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
        .send({fb_name:"John", fb_token: fb_token})
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
        .send({fb_name:"John", fb_token: fb_token})
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
        .send({fb_name:"John", fb_token: fb_token})
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.message, "already attached with this fb_id");
          done(err);
        });
    });

    it('Facebook status holds true', function(done) {
      request.get('/api/user/status_fb')
        .set('x-access-token', token)
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.name, "John");
          assert.equal(res.body.attached, true);
          done(err);
        });
    });

    it('Log-in with facebook succeeds', function(done) {
      request.post('/api/auth/login_fb')
        .send({fb_name:"John", fb_token: fb_token})
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.token, token);
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
      request.get('/api/user/status_fb')
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

    it('Auto-register when log-in with not attached fb_id', function(done){
      request.post('/api/auth/login_fb')
        .send({fb_name:"Smith", fb_token: fb_token2})
        .expect(200)
        .end(function(err, res){
          if (err) console.log(err);
          token = res.body.token;
          done(err);
        });
    });

    it('Auto-generated default timetable', function(done) {
      request.get('/api/tables/')
        .set('x-access-token', token)
        .expect(200)
        .end(function(err, res) {
          if (err) done(err);
          assert.equal(res.body[0].title, "나의 시간표");
          assert.equal(res.body[0].year, 2016);
          assert.equal(res.body[0].semester, 3);
          done();
        });
    });

    it('Accounts with only facebook credential cannot detach FB ID', function(done){
      request.post('/api/user/detach_fb')
        .set('x-access-token', token)
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          assert.equal(res.body.message, "no local id");
          done(err);
        });
    });

    it('Log-in fails with incorrect access token', function(done){
      request.post('/api/auth/login_fb')
        .send({fb_name:"Smith", fb_token: "incorrect"})
        .expect(403)
        .end(function(err, res){
          if (err) console.log(err);
          done(err);
        });
    });
  });
};
