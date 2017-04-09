/*
 * model/lecture.js
 * Lecture는 수강편람 상의 강의
 * UserLecture는 유저 시간표 상의 강의
 */
import mongoose = require('mongoose');
import errcode = require('../lib/errcode');
import Util = require('../lib/util');

interface BaseLectureDocument extends mongoose.Document {
  classification: string,                           // 교과 구분
  department: string,                               // 학부
  academic_year: string,                            // 학년
  course_title: string,   // 과목명
  credit: number,                                   // 학점
  class_time: string,
  class_time_json: [
    { day : number, start: number, len: number, place : string }
  ],
  class_time_mask: number[],
  instructor: string,                               // 강사
  quota: number,                                    // 정원
  enrollment: number,                               // 신청인원
  remark: string,                                   // 비고
  category: string

  is_equal(lecture:BaseLectureDocument):boolean;
  is_custom():boolean;
}

export interface LectureDocument extends BaseLectureDocument {
  year: number,           // 연도
  semester: number,       // 학기
  course_number: string,   // 교과목 번호
  lecture_number: string,  // 강좌 번호
}

export interface UserLectureDocument extends BaseLectureDocument {
  course_number: string,
  lecture_number: string,
  created_at: Date,
  updated_at: Date,
  color: {fg : string, bg : string}
}

export interface _UserLectureModel extends mongoose.Model<UserLectureDocument> {
  validate_color(lecture:any):boolean;
}

function BaseSchema(add){
  var schema = new mongoose.Schema({
    classification: String,                           // 교과 구분
    department: String,                               // 학부
    academic_year: String,                            // 학년
    course_title: { type: String, required: true },   // 과목명
    credit: Number,                                   // 학점
    class_time: String,
    class_time_json: [
      { day : Number, start: Number, len: Number, place : String }
    ],
    class_time_mask: { type: [ Number ], required: true, default: [0,0,0,0,0,0,0] },
    instructor: String,                               // 강사
    quota: Number,                                    // 정원
    enrollment: Number,                               // 신청인원
    remark: String,                                   // 비고
    category: String
  });

  schema.methods.is_custom = function() {
    return !this.course_number && !this.lecture_number;
  }

  /*
   * Lecture.add_lecture(lecture)
   * 연도, 학기, 교과목 번호와 강좌 번호를 비교하여 같은 강좌인지 판단.
   * param =======================================
   * lecture : target for comparison
   */
  schema.methods.is_equal = function(lecture) {
    /* User-created lectures are always different */
    if (this.is_custom()) return false;
    var ret = true;
    if (this.year && lecture.year)
      ret = ret && (this.year == lecture.year);
    if (this.semester && lecture.semester)
      ret = ret && (this.semester  == lecture.semester);
    return (ret &&
    this.course_number == lecture.course_number &&
    this.lecture_number == lecture.lecture_number);
  };

  schema.statics.is_equal = function(lecture1, lecture2) {
    if (!lecture1.is_equal) return false;
    return lecture1.is_equal(lecture2);
  };

  schema.statics.validate_color = function(lecture:any):boolean {
    if (!lecture.color) return true;
    var resultFg = !lecture.color.fg || Util.isColor(lecture.color.fg);
    var resultBg = !lecture.color.bg || Util.isColor(lecture.color.bg);
    return resultFg && resultBg;
  }

  schema.index({ year: 1, semester: 1, course_number: 1, lecture_number: 1});

  if (add) {
    schema.add(add);
  }

  return schema;
}

export let LectureModel = mongoose.model<LectureDocument>('Lecture', BaseSchema({
  year: { type: Number, required: true },           // 연도
  semester: { type: Number, required: true },       // 학기
  course_number: { type: String, required: true},   // 교과목 번호
  lecture_number: { type: String, required: true},  // 강좌 번호
}));

export let UserLectureModel = <_UserLectureModel>mongoose.model<UserLectureDocument>('UserLecture', BaseSchema({
  course_number: String,
  lecture_number: String,
  created_at: Date,
  updated_at: Date,
  color: {fg : String, bg : String},
  colorIndex: { type: Number, required: true, default: 0 }
}));
