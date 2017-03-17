/**
 * test/api/etc.ts
 * various tests
 * supertest: https://github.com/visionmedia/supertest
 * mocha: http://mochajs.org/#usage
 */
import assert = require('assert');
import errcode = require('../../lib/errcode');

export = function(app, db, request) {
  it('Color lists', function(done) {
    request.get('/colors')
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        var colors = res.body.colors;
        if (!colors[0].fg || !colors[0].bg)
            return done("No colors");
        done(err);
      });
  });
}