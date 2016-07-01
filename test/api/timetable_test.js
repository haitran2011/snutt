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
  var table_updated_at;
  var lecture_id;
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
        table_updated_at = res.body.updated_at;
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

  it ('Create timetable with the same title should fail', function(done){
    request.post('/api/tables/')
      .set('x-access-token', token)
      .send({year:2016, semester:1, title:"MyTimeTable"})
      .expect(403, 'duplicate title')
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
        if(err) done(err);
        assert.equal(res.body, table_id);
        request.get('/api/tables/'+table_id)
          .set('x-access-token', token)
          .expect(200)
          .end(function(err, res) {
            assert.equal(res.body.title, "MyTimeTable3");
            done(err);
          });
      })
  });
  
  it ('Table updated_at updated correctly', function(done) {
    request.get('/api/tables/'+table_id)
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        if (err) return done(err);
        if (res.body.updated_at == table_updated_at)
          return done(new Error("update time does not differ"));
        done();
      })
  });

  it ('Updating timetable with the same title should fail', function(done){
    request.put('/api/tables/'+table_id)
      .set('x-access-token', token)
      .send({title:"MyTimeTable2"})
      .expect(403, 'duplicate title')
      .end(function(err, res) {
        done(err);
      })
  });

  /* Search query does not work on test db
  it ('Get 글쓰기의 기초', function(done) {
    request.post('/api/search_query/')
      .set('x-access-token', token)
      .send({title:"글기", year:2016, semester:1})
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        console.log(res.body);
        assert.equal(!res.body.length, false);
        lecture = res.body[0];
        done();
      })
  });
  */

  it ('Create a custom lecture', function(done) {
    request.post('/api/tables/'+table_id+'/lecture/')
      .set('x-access-token', token)
      .send({
        "year": 2016,
        "semester": 1,
        "classification": "전선",
        "department": "컴퓨터공학부",
        "academic_year": "3학년",
        "course_number": "400.320",
        "lecture_number": "002",
        "course_title": "공학연구의 실습 1",
        "credit": 1,
        "class_time": "화(13-1)/목(13-1)",
        "instructor": "이제희",
        "quota": 15,
        "enrollment": 0,
        "remark": "컴퓨터공학부 및 제2전공생만 수강가능",
        "category": "",
        "created_at": "2016-03-31T07:56:44.137Z",
        "updated_at": "2016-03-31T07:56:44.137Z",
        /*
         * See to it that the server removes _id fields correctly
         */
        "_id": "56fcd83c041742971bd20a86",
        "class_time_mask": [
          0,
          12,
          0,
          12,
          0,
          0
        ],
        "class_time_json": [
          {
            "day": 1,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a88"
          },
          {
            "day": 3,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a87"
          }
        ],
        "__v": 0
      })
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        lecture_id = res.body._id;
        assert.equal(res.body.course_number, "400.320");
        assert.equal(res.body.class_time_json[0].place, "302-308");
        done();
      })
  });

  it ('Copy timetable', function(done) {
    request.post('/api/tables/'+table_id+'/copy/')
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        request.get('/api/tables/'+table_id)
          .set('x-access-token', token)
          .expect(200)
          .end(function(err, res) {
            assert.equal(res.body.lecture_list[0].course_number, "400.320");
            assert.equal(res.body.lecture_list[0].class_time_json[0].place, "302-308");
            done(err);
          });
      });
  });

  it ('Modify a lecture', function(done) {
    request.put('/api/tables/'+table_id+'/lecture/'+lecture_id)
      .set('x-access-token', token)
      .send({course_title:"abcd"})
      .expect(200)
      .end(function(err, res) {
        request.get('/api/tables/'+table_id)
          .set('x-access-token', token)
          .expect(200)
          .end(function(err, res) {
            if (err) done(err);
            if (res.body.lecture_list[0].course_title == "abcd") done();
            else done(new Error("lecture not updated"));
          });
      });
  });

  it ('Modifying course/lecture number should fail', function(done) {
    request.put('/api/tables/'+table_id+'/lecture/'+lecture_id)
      .set('x-access-token', token)
      .send({course_number: "400.333", title:"abcd"})
      .expect(403)
      .end(function(err, res) {
        if (err) {
          done(err);
        } else {
          request.put('/api/tables/' + table_id + '/lecture/' + lecture_id)
            .set('x-access-token', token)
            .send({lecture_number: "010", title: "abcd"})
            .expect(403)
            .end(function (err, res) {
              if (err) done(err);
            });
          done();
        }
      });
  });

  it ('Creating a same lecture should fail', function(done) {
    request.post('/api/tables/'+table_id+'/lecture/')
      .set('x-access-token', token)
      .send({
        "year": 2016,
        "semester": 1,
        "classification": "전선",
        "department": "컴퓨터공학부",
        "academic_year": "3학년",
        "course_number": "400.320",
        "lecture_number": "002",
        "course_title": "공학연구의 실습 1",
        "credit": 1,
        "class_time": "화(13-1)/목(13-1)",
        "instructor": "이제희",
        "quota": 15,
        "enrollment": 0,
        "remark": "컴퓨터공학부 및 제2전공생만 수강가능",
        "category": "",
        "created_at": "2016-03-31T07:56:44.137Z",
        "updated_at": "2016-03-31T07:56:44.137Z",
        /*
         * See to it that the server removes _id fields correctly
         */
        "_id": "56fcd83c041742971bd20a86",
        "class_time_mask": [
          0,
          12,
          0,
          12,
          0,
          0
        ],
        "class_time_json": [
          {
            "day": 1,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a88"
          },
          {
            "day": 3,
            "start": 13,
            "len": 1,
            "place": "302-308",
            "_id": "56fcd83c041742971bd20a87"
          }
        ],
        "__v": 0
      })
      .expect(403)
      .end(function(err, res) {
        done(err);
      })
  });

  it ('Delete a lecture', function(done) {
    request.delete('/api/tables/'+table_id+'/lecture/'+lecture_id)
      .set('x-access-token', token)
      .expect(200, "ok")
      .end(function(err, res) {
        if (err) {
          done(err);
          return;
        }
        request.get('/api/tables/'+table_id)
          .set('x-access-token', token)
          .expect(200)
          .end(function(err, res) {
            if (err) done(err);
            if (res.body.lecture_list.length != 0 &&
              res.body.lecture_list[0]._id == lecture_id) {
              err = new Error("lecture not deleted");
            }
            done(err);
          });
      })
  });
};
