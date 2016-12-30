/**
 * Created by north on 16. 3. 24.
 */

var LectureModel = require('../model/lecture').LectureModel;

if (process.argv.length != 4) {
  console.log("Invalid arguments");
  console.log("usage: $ node check_duplicate.js 2016 1");
  process.exit(1);
}

var year = Number(process.argv[2]);
var semester = process.argv[3];

LectureModel.find({year : year, semester : semester}, "year semester course_number lecture_number course_title", function(err, docs) {
  for (var i=0; i<docs.length; i++){
    process.stdout.write(i+"th lecture...\r");
    for (var j=0; j<i; j++) {
      if (LectureModel.is_equal(docs[i],docs[j])) {
        process.stdout.write(docs[i].course_title + ", " + docs[j].course_title + "\n");
      }
    }
  }
});

process.exit(0);