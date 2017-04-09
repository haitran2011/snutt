import {importFromString} from '../../data/import_txt';
import {LectureDocument} from '../../model/lecture';
import {Type} from '../../model/notification';
import assert = require('assert');

const YEAR = 2011;
const SEMESTER = '1';
const SEMESTER_INDEX = 1;
const TABLE_NAME = "importTest"

const TEXT_HEADER = YEAR + "/" + SEMESTER + "\n"+
"2017-04-09 11:00:22\n"+
"classification;department;academic_year;course_number;lecture_number;"+
"course_title;credit;class_time;location;instructor;quota;enrollment;"+
"remark;category;snuev_lec_id;snuev_eval_score\n";

const import_txt1 = TEXT_HEADER+
"교양;국어국문학과;1학년;031.001;048;글쓰기의 기초;"+
"3;월(1.5-1.5)/수(1.5-1.5);009-102/009-102;김승민;25;0;®음악대학;foundation_writing;;"

const import_txt2 = TEXT_HEADER+
"교양;국어국문학과;1학년;031.001;048;글쓰기의 기초;"+
"3;월(1.5-1.5)/수(1.5-1.5);009-102/009-102;김승민;25;25;®음악대학;foundation_writing;;"

const import_txt3 = TEXT_HEADER+
"교양;국어국문학과;1학년;031.001;048;글쓰기의 기초;"+
"3;월(1.5-1.5)/수(1.5-1.5);009-105/009-105;김승민;25;25;®음악대학;foundation_writing;;"

const import_txt4 = TEXT_HEADER;

function importFromStringCb(str:string, cb:(err?)=>void) {
  importFromString(str, YEAR, SEMESTER, false).then(function() {
    cb();
  }).catch(function(err) {
    console.error(err);
    cb(err);
  });
}

function searchWriting(request, token):Promise<LectureDocument> {
  return new Promise<LectureDocument>(function(resolve, reject){
    request.post('/search_query/')
      .set('x-access-token', token)
      .send({title:"글기", year:YEAR, semester:SEMESTER_INDEX})
      .expect(200)
      .end(function(err, res) {
        if (err) {
          reject(err);
        }
        if(!res.body.length) {
          reject("No lecture found");
        }
        resolve(res.body[0]);
      })
  })
}

export = function(app, db, request) {
  var token:String;
  var table_id:String;
  
  before(function(done) {
    importFromStringCb(import_txt1, done);
  });

  before(function(done) {
    request.post('/auth/login_local')
      .send({id:"snutt", password:"abc1234"})
      .expect(200)
      .end(function(err, res){
        if (err) console.error(res.body);
        token = res.body.token;
        done(err);
      });
  });

  before (function(done){
    request.post('/tables/')
      .set('x-access-token', token)
      .send({year:YEAR, semester:SEMESTER_INDEX, title:TABLE_NAME})
      .expect(200)
      .end(function(err, res) {
        if (err) {
          console.error(res);
          return done(err);
        }
        for (let i=0; i< res.body.length; i++) {
          if (res.body[i].title == TABLE_NAME) {
            table_id = res.body[i]._id;
            break;
          }
        }
        if (!table_id) err = "Table Creation Failed";
        done(err);
      });
  });

  it ("notification for new coursebook", async function(done) {
    request.get('/notification/')
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        assert.equal(res.body[0].type, Type.COURSEBOOK);
        done();
      });
  });

  it ("search imported lectures", async function(done){
    try {
      var lecture = await searchWriting(request, token);
      if (lecture.course_title != "글쓰기의 기초") {
        done("Lecture title differs");
      }
      done();
    } catch(err) {
      done(err);
    }
  });

  /*
  it ("coursebook not updated when only enrollment changes", async function(done) {
    request.get('/notification/')
      .set('x-access-token', token)
      .expect(200)
      .end(function(err, res) {
        if (err) done(err);
        assert.equal(res.body[0].type, Type.COURSEBOOK);
        done();
      });
  });*/
}