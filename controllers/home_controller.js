var fs = require("fs");
var ejs = require("ejs");
var utils = require("../utils.js");
var url = require("url");
var icalendar = require("icalendar");
var restler = require('restler');

var stringToObject = utils.stringToObject;
var objectToString = utils.objectToString;
var safeString = utils.safeString;
var _ = require('underscore');

function payload_template(options) {
  /* Arguments -
   *     lectures
   *     year
   *     semester
   */
  // 시간표 짜기
  var my_lectures = options.lectures;
  var content = "var current_year = '" + options.year + "';\n";
  content += "var current_semester = '" + options.semester + "';\n";
  content += "var my_lectures = [";

  var acc = "";
  var join = function (str) {
    if(!acc) {
      acc += str;
    } else {
      acc += "," + str;
    }
  };

  _.each(my_lectures, function (lec) {
    lec.location = safeString(lec.location);
    lec.class_time = safeString(lec.class_time);
  });
  _.each(my_lectures, function (lec) {
    join(objectToString(lec));
  });

  content += acc;
  content += "];\n";

  return content;
}

module.exports = {
  //TODO : implement non-blocking code
  functor: function(config, target, lectureModel) {
    var data_path = config[target].ROOT_DATA_PATH;
    var view_path = config[target].ROOT_VIEW_PATH;
    var json_path = config[target].ROOT_JSON_PATH;
    var timetable_header = fs.readFileSync(view_path + "/timetable_header.htm");
    var timetable_footer = ejs.render(fs.readFileSync(view_path + "/timetable_footer.ejs.htm", 'utf8'),
        {filename: view_path + "/timetable_footer.ejs.htm"});
    var user_timetable_header = fs.readFileSync(view_path + "/user_timetable_header.htm");
    var user_timetable_footer = fs.readFileSync(view_path + "/user_timetable_footer.htm");

    return {
      home: function(params, renderer, request) {
        if ("user" in params) {
          id = params.user;
          lectureModel.load(params.user, function (err, loaded_info) {
            if (err) {
              console.log('Error while showing home');
              renderer.text('ERROR');
            }
            else {
              renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
            }
          });
        }
        else if(renderer.cookies.get("user_id")) {
          var user_id = renderer.cookies.get("user_id");          
          lectureModel.load(user_id, function (err, loaded_info) {
            if (err) {
              console.log('Invalid user_id');
              renderer.text(timetable_header + timetable_footer);
            }
            else {
              renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
            }
          });

        }
        else {
          renderer.text (timetable_header + timetable_footer);
        }
      },

      member: function (params, renderer, request) {
        //Note : older node versions doesn't support object type as an options argument
        //Just use toString() to convert buffers into String
        fs.readFile (view_path + "/members.ejs.htm", 'utf8', function (err, data) {
          if (err) {
            console.log(err);
            renderer.err();
          }
          renderer.text (timetable_header + ejs.render(data));
        });
      },

      // app crash hotfixes. NOTE THAT ZIP FILE CRASHES when encoding = utf8 is set....
      app_data: function (params, renderer, request) {
        fs.readFile (data_path + "/data.zip", function (err, data) {
          if (err) {
            console.log(err);
            renderer.err();
          }
          renderer.zip (data, fs.statSync(data_path+"/data.zip").size);
        });
      },
      json: function (params, renderer, request) {
        if (!params.name) return renderer.err();

        fs.readFile (json_path + params.name, 'utf8', function (err, data) {
          if (err) {
            console.log(err);
            renderer.err();
          }
          renderer.json (data, true); // do not stringfy (for app)
        });
      },

      asset: function (params, renderer, request) {
        if ((!params.name) || (!params.format)) return renderer.err();

        var path2 = "", asset_path = config[target].ROOT_ASSET_PATH;
        if (params.path2) path2 = params.path2 + "/";
        var path = path2 + params.name + '.' + params.format;
        var mime = "";

        if (params.format === "js") {
          path = asset_path + '/javascripts/' + path;
          mime = "text/javascript";
        }
        else if (params.format === "css") {
          path = asset_path + '/stylesheets/' + path;
          mime = "text/css";
        }
        else if (params.format === "jpg" || params.format === "png" || params.format === "gif") {
          path = asset_path + '/images/' + path;
          mime = "image/" + params.format;
        }
        else return renderer.err();
        
        fs.readFile (path, function (err, data) {
          if (err) {
            console.log(err);
            renderer.err();
          }
          renderer.generic(data, mime);
        });
      },

      show: function(params, renderer, request) {
        // 저장된 시간표 불러오기
        lectureModel.load(params.id, function (err, loaded_info) {
          if (err) {
            console.log('Error while showing table');
            renderer.text('ERROR');
          }
          else {
            renderer.text(timetable_header + payload_template(loaded_info) + timetable_footer);
          }
        });
      },

      export_cal: function (params, renderer, request) {
        // get parameters
        var serviceType = params.type
        var lectures = params.lectures

        var ical = new icalendar.iCalendar();
        // initialize icalendar
        ical.addProperty('TZID', 'Asia/Seoul');
        ical.addProperty('CALSCALE', 'GREGORIAN');
        ical.addProperty('METHOD', 'PUBLISH');
        var semesterEndedAt = "20160613T000000Z"
        // end initialize
        // constant
        var WEEKDAY = new Array(7);
        WEEKDAY[0]=  "SU";
        WEEKDAY[1] = "MO";
        WEEKDAY[2] = "TU";
        WEEKDAY[3] = "WE";
        WEEKDAY[4] = "TH";
        WEEKDAY[5] = "FR";
        WEEKDAY[6] = "SA";
        var DAYS = {"월":2, "화":3, "수":4, "목":5, "금":6, "토":7, "일":8};
        var NAVER_CATEGORIES = [
          89229342,
          89229343,
          89229344,
          89229345,
          89229346,
          89229347,
          89229348,
          89229349,
          89229350,
          89229351
        ]
        // end constant

        for(var i = 0; i < lectures.length; i++) {
          var lecture = lectures[i];
          var classTimes = lecture.class_time.split("/");
          var locations = lecture.location.split("/");
          
          var summary = lecture.course_title;
          var description = "";
          if(lecture.instructor != null && lecture.instructor != "") {
            description = lecture.instructor
          }

          for(var j = 0; j < classTimes.length; j++) {
            var classTime = classTimes[j]; // 시간 스트링
            var location = locations[j]; // 장소
            var day = DAYS[classTime[0]]; // 요일
            var times = classTime.substring(2, classTime.length - 1);
            var startHour = parseFloat(times.split("-")[0]) * 60;
            var runningMinutes = parseFloat(times.split("-")[1]) * 60;
            
            // NOTE : if sem starts at 2015 06 22 -> the zeroHour below should be 2015, 6-1, 20 + day, 8, 00
            var zeroHour = new Date(2016, 2 - 1, 29 - 2 + day, 8, 00); // 0교시
            var startedAt = new Date(zeroHour.getTime() + startHour * 60000);
            var endedAt = new Date(startedAt.getTime() + runningMinutes * 60000);
            var rrule = {FREQ: 'WEEKLY', UNTIL: semesterEndedAt, BYDAY: WEEKDAY[startedAt.getDay()]};

            var event = ical.addComponent('VEVENT');

            event.setSummary(summary);
            event.setDescription(description);
            event.setLocation(location);
            event.setDate(startedAt, endedAt); // Duration in seconds
            event.addProperty('RRULE', rrule);
            event.addProperty('CLASS', "PRIVATE");
            if(serviceType == "naver") {
              event.addProperty('X-NAVER-STICKER', "001");
              event.addProperty('X-NAVER-CATEGORY', NAVER_CATEGORIES[i % NAVER_CATEGORIES.length]);
            }
          }
        }

        //renderer.text(ical.toString());
        var filename = config[target].USER_ICS_PATH + '/' + serviceType + "_" + String((new Date()).getTime()) + "_" + Math.floor(Math.random() * 10000) + ".ics";
        fs.writeFile(filename, ical.toString(), function(err){
          if (err) {
            console.log(err);
            return renderer.err();
          }
          fs.readFile (filename, function (err, data) {
            if (err) {
              console.log(err);
              return renderer.err();
            }
            renderer.cal(data);
          });
        });
      },
    };
  }
};
