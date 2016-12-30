/*
 * model/lecture.js
 * Lecture는 수강편람 상의 강의
 * UserLecture는 유저 시간표 상의 강의
 */
"use strict";
var mongoose = require('mongoose');
function BaseSchema(add) {
    var schema = mongoose.Schema({
        classification: String,
        department: String,
        academic_year: String,
        course_title: { type: String, required: true },
        credit: Number,
        class_time: String,
        class_time_json: [
            { day: Number, start: Number, len: Number, place: String }
        ],
        class_time_mask: { type: [Number], required: true, default: [0, 0, 0, 0, 0, 0] },
        instructor: String,
        quota: Number,
        enrollment: Number,
        remark: String,
        category: String
    });
    /*
     * Lecture.add_lecture(lecture)
     * 연도, 학기, 교과목 번호와 강좌 번호를 비교하여 같은 강좌인지 판단.
     * param =======================================
     * lecture : target for comparison
     */
    schema.methods.is_equal = function (lecture) {
        /* User-created lectures are always different */
        if (!this.course_number && !this.lecture_number)
            return false;
        var ret = true;
        if (this.year && lecture.year)
            ret = ret && (this.year == lecture.year);
        if (this.semester && lecture.semester)
            ret = ret && (this.semester == lecture.semester);
        return (ret &&
            this.course_number == lecture.course_number &&
            this.lecture_number == lecture.lecture_number);
    };
    schema.statics.is_equal = function (lecture1, lecture2) {
        if (!lecture1.is_equal)
            return false;
        return lecture1.is_equal(lecture2);
    };
    schema.index({ year: 1, semester: 1, course_number: 1, lecture_number: 1 });
    if (add) {
        schema.add(add);
    }
    return schema;
}
var Lecture = mongoose.model('Lecture', BaseSchema({
    year: { type: Number, required: true },
    semester: { type: Number, required: true },
    course_number: { type: String, required: true },
    lecture_number: { type: String, required: true },
}));
var UserLecture = mongoose.model('UserLecture', BaseSchema({
    course_number: String,
    lecture_number: String,
    created_at: Date,
    updated_at: Date,
    color: { fg: String, bg: String }
}));
module.exports = {
    Lecture: Lecture,
    UserLecture: UserLecture
};
