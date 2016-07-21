if (!module.parent) {
  console.log("Not to be executed directly. Instead call import_txt.js");
  console.log("usage: $ node import_txt.js 2016 1");
  process.exit(1);
}

var db = require('../db');
var async = require('async');
var LectureModel = require('../model/lecture');
var CourseBook = require('../model/courseBook');
var Notification = require('../model/notification');
var Lecture = LectureModel.Lecture;
var Timetable = require('../model/timetable');
var TagList = require('../model/tagList');
var Util = require('../lib/util');

/*
 * 교양 영역을 한글로 번역.
 * fetch.rb를 수정하게 되면
 * 지난 수강편람을 모두 새로고침해야 하므로
 * 일단은 update_lectures에서 두번 해석
 */

var str_category = {
  "" : "",
  "foundation_writing":"사고와 표현",
  "foundation_language":"외국어",
  "foundation_math":"수량적 분석과 추론",
  "foundation_science":"과학적 사고와 실험",
  "foundation_computer":"컴퓨터와 정보 활용",
  "knowledge_literature":"언어와 문학",
  "knowledge_art":"문화와 예술",
  "knowledge_history":"역사와 철학",
  "knowledge_politics":"정치와 경제",
  "knowledge_human":"인간과 사회",
  "knowledge_nature":"자연과 기술",
  "knowledge_life":"생명과 환경",
  "general_physical":"체육",
  "general_art":"예술실기",
  "general_college":"대학과 리더십",
  "general_creativity":"창의와 융합",
  "general_korean":"한국의 이해"
};

function insert_course(lines, year, semesterIndex, next)
{
  var semesterString = (['1', '여름', '2', '겨울'])[semesterIndex-1];
  var saved_cnt = 0, err_cnt = 0;
  var tags = {
    classification : [],
    department : [],
    academic_year : [],
    credit : [],
    instructor : [],
    category : []
  };
  var old_lectures;
  var new_lectures = [];
  var diff = {
    created : [],
    removed : [],
    updated : []
  };

  // Do each function step by step
  async.series([
    function (callback) {
      console.log ("Loading new lectures...");
      for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        var components = line.split(";");
        if (components.length == 1) continue;

        // 교양영역 번역
        components[13] = str_category[components[13]];
        // null(과학교육계) 고침
        components[1] = components[1].replace("null", "");

        var new_tag = {
          classification : components[0],
          department : components[1],
          academic_year : components[2],
          credit : components[6]+'학점',
          instructor : components[9],
          category : components[13]
        };

        for (var key in tags) {
          if (tags.hasOwnProperty(key)){
            var existing_tag = undefined;
            for (var j=0; j<tags[key].length; j++) {
              if (tags[key][j] == new_tag[key]){
                existing_tag = new_tag[key];
                break;
              }
            }
            if (existing_tag == undefined) {
              if (new_tag[key].length < 2) continue;
              tags[key].push(new_tag[key]);
            }
          }
        }

        var timeJson = Util.timeAndPlaceToJson(components[7], components[8]);
        // TimeMask limit is 15*2
        for (var j=0; j<timeJson.length; j++) {
          var t_end = parseFloat(timeJson[j].start)+parseFloat(timeJson[j].len);
          if (t_end > 15) {
            console.log("Warning: ("+components[3]+", "+components[4]+", "+components[5]+
              ") ends at "+t_end);
          }
        }

        new_lectures.push(new Lecture({
          year: Number(year),
          semester: semesterIndex,
          classification: components[0],
          department: components[1],
          academic_year: components[2],
          course_number: components[3],
          lecture_number: components[4],
          course_title: components[5],
          credit: Number(components[6]),
          class_time: components[7],
          class_time_json: timeJson,
          class_time_mask: Util.timeJsonToMask(timeJson),
          instructor: components[9],
          quota: Number(components[10]),
          enrollment: Number(components[11]),
          remark: components[12],
          category: components[13]
        }));
        process.stdout.write("Loading " + new_lectures.length + "th course\r");
      }
      console.log("\nLoad complete with "+new_lectures.length+" courses");
      callback();
    },
    function (callback) {
      console.log ("Pulling existing lectures...");
      Lecture.find({year : year, semester : semesterIndex}).lean()
        .exec(function(err, docs) {
          old_lectures = docs;
          callback(err);
        });
    },
    function (callback){
      console.log("Comparing existing lectures and new lectures...");
      for (var i=0; i<new_lectures.length; i++) {
        var exists = false;
        for (var j=0; j<old_lectures.length; j++) {
          if (old_lectures[j].checked) continue;
          if (old_lectures[j].course_number != new_lectures[i].course_number) continue;
          if (old_lectures[j].lecture_number != new_lectures[i].lecture_number) continue;
          var diff_update = Util.compareLecture(old_lectures[j], new_lectures[i]);
          if (diff_update != null) {
            diff_update.course_number = old_lectures[j].course_number;
            diff_update.lecture_number = old_lectures[j].lecture_number;
            diff_update.course_title = old_lectures[j].course_title;
            diff.updated.push(diff_update);
            console.log(old_lectures[j].course_title+" updated");
          }
          old_lectures[j].checked = true;
          exists = true;
          break;
        }
        if (exists == false) {
          diff.created.push({
            course_number: new_lectures[i].course_number,
            lecture_number: new_lectures[i].lecture_number,
            course_title: new_lectures[i].course_title
          });
          console.log(new_lectures[i].course_title+" created");
        }
      }
      for (var i=0; i<old_lectures.length; i++) {
        if (!old_lectures[i].checked) {
          diff.removed.push({
            course_number: old_lectures[i].course_number,
            lecture_number: old_lectures[i].lecture_number,
            course_title: old_lectures[i].course_title
          });
          console.log(old_lectures[i].course_title+" removed");
        }
      }
      if (diff.updated.length == 0 &&
          diff.created.length == 0 &&
          diff.removed.length == 0) {
        console.log("Nothing updated.");
        return callback(new Error("Update cancelled: nothing to update"));
      }
      console.log(diff.updated.length + " updated, "+
          diff.created.length + " created, "+
          diff.removed.length + " removed.");
      if (diff.updated.length + diff.created.length + diff.removed.length > 100) {
        console.log("*** Too many updates. No notification inserted. ***");
        return callback();
      }
      
      var msg = year+"년도 "+semesterString+"학기 수강 편람이 업데이트 되었습니다.";
      Notification.createNotification(null, msg, Notification.Type.COURSEBOOK, diff,
        function(err) {
          if (!err) console.log("Notification inserted");
          callback(err);
        });
    },
    function (callback){
      async.series([
        function(callback){
          async.each(diff.updated, function(updated_lecture, callback) {
            Timetable.find(
              {
                year: year,
                semester: semesterIndex,
                lecture_list: {
                  $elemMatch : {
                    course_number: updated_lecture.course_number,
                    lecture_number: updated_lecture.lecture_number
                  }
                }
              },
              {
                lecture_list: {
                  $elemMatch : {
                    course_number: updated_lecture.course_number,
                    lecture_number: updated_lecture.lecture_number
                  }
                }
              }, function(err, timetables) {
                async.each(timetables, function(timetable, callback) {
                  if (timetable.lecture_list.length != 1) {
                    return callback(new Error({
                      message: "Lecture update error",
                      timetable_id: timetable,
                      lecture: updated_lecture
                    }))
                  }
                  var noti_detail = {
                    timetable_id : timetable._id,
                    lecture : updated_lecture
                  };
                  timetable.update_lecture(timetable.lecture_list[0]._id, updated_lecture.after,
                    function(err, timetable){
                      Notification.createNotification(
                        timetable.user_id,
                        "'"+timetable.title+"' 시간표의 '"+updated_lecture.course_title+"' 강의가 업데이트 되었습니다.",
                        Notification.Type.LECTURE,
                        noti_detail,
                        function(err) {
                          callback(err);
                        });
                  });
                }, function(err) {
                  callback(err);
                });
            });
          }, function(err){
            callback(err);
          })
        },
        function(callback){
          async.each(diff.removed, function(removed_lecture, callback) {
            Timetable.find(
              {
                year: year,
                semester: semesterIndex,
                lecture_list: {
                  $elemMatch : {
                    course_number: removed_lecture.course_number,
                    lecture_number: removed_lecture.lecture_number
                  }
                }
              },
              {
                lecture_list: {
                  $elemMatch : {
                    course_number: removed_lecture.course_number,
                    lecture_number: removed_lecture.lecture_number
                  }
                }
              }, function(err, timetables) {
                async.each(timetables, function(timetable, callback) {
                  if (timetable.lecture_list.length != 1) {
                    return callback(new Error({
                      message: "Lecture update error",
                      timetable_id: timetable,
                      lecture: removed_lecture
                    }))
                  }
                  var noti_detail = {
                    timetable_id : timetable._id,
                    lecture : removed_lecture
                  };
                  timetable.delete_lecture(timetable.lecture_list[0]._id, function(err, timetable) {
                    if (err) return callback(err);
                    Notification.createNotification(
                      timetable.user_id,
                      "'"+timetable.title+"' 시간표의 '"+removed_lecture.course_title+"' 강의가 폐강되었습니다.",
                      Notification.Type.LECTURE,
                      noti_detail,
                      function(err) {
                        callback(err);
                      });
                  });
                }, function(err) {
                  callback(err);
                });
              });
          }, function(err){
            callback(err);
          })
        }
      ], function(err, results){
        callback(err);
      });
    },
    function (callback){
      Lecture.remove({ year: year, semester: semesterIndex}, function(err) {
        if (err) {
          console.log(err);
          callback(err, 'remove lectures');
        } else {
          console.log("Removed existing lecture for this semester");
          callback(null, 'remove lectures');
        }
      });
    },
    function (callback){
      console.log("Inserting new lectures...");
      async.each(new_lectures, function(lecture, callback) {
        lecture.save(function (err, lecture) {
          if (err) {
            console.log(err);
            err_cnt++
          }
          process.stdout.write("Inserting " + (++saved_cnt) + "th course\r");
          callback();
        });
      }, function(err) {
        console.log("\nInsert complete with " + eval(saved_cnt-err_cnt) + " success and "+ err_cnt + " errors");
        for (var key in tags) {
          if (tags.hasOwnProperty(key)){
            tags[key].sort();
          }
        }
        callback(null, 'insert lectures');
      });
    },
    function (callback){
      TagList.remove({ year: year, semester: semesterIndex}, function(err) {
        if (err) callback(err, 'tag remove');
        console.log("Removed existing tags");
        callback(null, 'tag remove');
      });
    },
    function (callback){
      console.log("Inserting tags from new lectures...");
      var tagList = new TagList({
        year: Number(year),
        semester: semesterIndex,
        tags: tags,
        updated_at: Date.now()
      });
      tagList.save(function (err, docs) {
        if (err) callback(err, 'tags');
        else {
          console.log("Inserted tags");
          callback(null, 'tags');
        }
      });
    },
    function (callback) {
      console.log("saving coursebooks...");
      CourseBook.findOneAndUpdate({ year: Number(year), semester: semesterIndex },
        { updated_at: Date.now() },
        {
          new: true,   // return new doc
          upsert: true // insert the document if it does not exist
        })
        .exec(function(err, doc) {
        callback(err);
      });
    }
  ], function (err, results){
    if (err) {
      console.log(err);
      process.exit(1);
    }
    next();
  });
}

module.exports = {
  insert_course: insert_course};
