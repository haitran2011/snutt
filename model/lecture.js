/*
 * model/lecture.js
 * Lecture는 수강편람 상의 강의
 * UserLecture는 유저 시간표 상의 강의
 */

var mongoose = require('mongoose');
function BaseSchema(add){
  var schema = mongoose.Schema({
    classification: String,                           // 교과 구분
    department: String,                               // 학부
    academic_year: String,                            // 학년
    course_title: { type: String, required: true },   // 과목명
    credit: Number,                                   // 학점
    class_time: String,
    class_time_json: [
      { day : Number, start: Number, len: Number, place : String }
    ],
    class_time_mask: { type: [ Number ], required: true, default: [0,0,0,0,0,0] },
    instructor: String,                               // 강사
    quota: Number,                                    // 정원
    enrollment: Number,                               // 신청인원
    remark: String,                                   // 비고
    category: String
  });

  /*
   * Lecture.add_lecture(lecture)
   * 연도, 학기, 교과목 번호와 강좌 번호를 비교하여 같은 강좌인지 판단.
   * param =======================================
   * lecture : target for comparison
   */
  schema.methods.is_equal = function(lecture) {
    var ret = true;
    if (this.year && lecture.year)
      ret &= this.year == lecture.year;
    if (this.semester && lecture.semester)
      ret &= this.semester  == lecture.semester;
    return (ret &&
    this.course_number == lecture.course_number &&
    this.lecture_number == lecture.lecture_number);
  };

  schema.statics.is_equal = function(lecture1, lecture2) {
    if (!lecture1.is_equal) return false;
    return lecture1.is_equal(lecture2);
  };

  schema.index({ year: 1, semester: 1, course_number: 1, lecture_number: 1});

  if (add) {
    schema.add(add);
  }

  return schema;
}

var Lecture = mongoose.model('Lecture', BaseSchema({
  year: { type: Number, required: true },           // 연도
  semester: { type: Number, required: true },       // 학기
  course_number: { type: String, required: true},   // 교과목 번호
  lecture_number: { type: String, required: true},  // 강좌 번호
}));

var UserLecture = mongoose.model('UserLecture', BaseSchema({
  course_number: String,
  lecture_number: String,
  created_at: Date,
  updated_at: Date,
  color: {fg : String, bg : String}
}));

module.exports = {
  Lecture : Lecture,
  UserLecture : UserLecture
};
