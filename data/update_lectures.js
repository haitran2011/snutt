var async = require('async');
var Lecture = require('../model/lecture');
var TagList = require('../model/tagList');
var Util = require('../lib/util');

function insert_course(lines, year, semesterIndex, next)
{
  var cnt = 0, saved_cnt = 0, err_cnt = 0;
  var tags = {
    classification : [],
    department : [],
    academic_year : [],
    credit : [],
    instructor : []
  };
  var old_lectures;
  var new_lectures = new Array(lines.length);

  // Do each function step by step
  async.series([
    function (callback) {
      console.log ("Pulling existing lectures...");
      Lecture.find({year : year, semester : semesterIndex}, function(err, docs) {
        old_lectures = docs;
        callback();
      });
    },
    function (callback) {
      for (var i=0; i<lines.length; i++) {
        var line = lines[i];
        var components = line.split(";");
        if (components.length == 1) continue;

        var new_tags = {
          classification : components[0],
          department : components[1],
          academic_year : components[2],
          credit : components[6]+'학점',
          instructor : components[9]
        };

        for (var key in tags) {
          if (tags.hasOwnProperty(key)){
            var existing_tag = undefined;
            for (var j=0; j<tags[key].length; j++) {
              if (tags[key][j] == new_tags[key]){
                existing_tag = new_tags[key];
                break;
              }
            }
            if (existing_tag == undefined) {
              if (new_tags[key].length < 2) continue;
              tags[key].push(new_tags[key]);
            }
          }
        }

        var timeJson = Util.timeAndPlaceToJson(components[7], components[8]);
        new_lectures[cnt++] = new Lecture({
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
          category: components[13],
          created_at: Date.now(),
          updated_at: Date.now()
        });
        process.stdout.write("Loading " + cnt + "th course\r");
      }
      console.log("\nLoading complete with "+cnt+" courses");
      callback();
    },
    function (callback){
      Lecture.remove({ year: year, semester: semesterIndex}, function(err) {
        if (err) {
          console.log(err);
          callback(err, 'remove lectures');
        } else {
          console.log("Removed existing coursebook for this semester");
          callback(null, 'remove lectures');
        }
      });
    },
    function (callback){
      async.each(new_lectures, function(lecture, callback) {
        if(lecture == undefined) {
          callback();
          return;
        }
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
      var tagList = new TagList({
        year: Number(year),
        semester: semesterIndex,
        tags: tags,
        updated_at: Date.now()
      });
      tagList.save(function (err, docs) {
        if (err) callback(err, 'tags');
        else {
          console.log("Tags successfully inserted");
          callback(null, 'tags');
        }
      });
    }
  ], function (err, results){
    next();
  });
}

module.exports = {
  insert_course: insert_course};
