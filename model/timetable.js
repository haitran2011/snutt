"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var LectureModel = require('./lecture');
var UserLecture = LectureModel.UserLecture;
var Util = require('../lib/util');

var TimetableSchema = mongoose.Schema({
  user_id : { type: Schema.Types.ObjectId, ref: 'User' },
  year : {type : Number, required : true },
  semester : {type : Number, required : true, min:1, max:4 },
  title : {type : String, required : true },
  lecture_list: [UserLecture.schema],
  updated_at : Date
});

TimetableSchema.index({ year: 1, semester: 1, user_id: 1 });

TimetableSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

TimetableSchema.methods.checkDuplicate = function(next) {
  (function (timetable) {
    mongoose.model('Timetable').findOne(
      {
        user_id : timetable.user_id,
        year : timetable.year,
        semester: timetable.semester,
        title: timetable.title
      }, function (err, doc) {
        if (err) return next(err);
        if (doc && !doc._id.equals(timetable._id)) {
          var new_err = new Error('A timetable with the same title already exists');
          return next(new_err);
        }
        return next(null);
      });
  } )(this);
};

/**
 * Timetable.getTimetables(user_id, flags, callback)
 * @callback (err, timetables)
 * @flags {lean}
 */
TimetableSchema.statics.getTimetables = function(user_id, flags, callback) {
  var query = mongoose.model("Timetable").where('user_id', user_id).select('year semester title _id updated_at');
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getTimetable = function(user_id, timetable_id, flags, callback) {
  var query = mongoose.model("Timetable").findOne({'user_id': user_id, '_id' : timetable_id});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getRecentTimetable = function(user_id, flags, callback) {
  var query = mongoose.model("Timetable").findOne({'user_id': user_id}).sort({updated_at : -1});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

/**
 * Timetable.copy(new_title, callback)
 * param =======================================
 * new_title : New title.
 * callback : callback for timetable.save()
 */
TimetableSchema.methods.copy = function(new_title, next) {
  if (new_title == this.title) {
    var new_err = new Error('A timetable with the same title already exists');
    next(new_err);
  } else {
    /**
     * Sanitize json object, then save it
     * -> Cannot recognize existing entry
     * -> Create new entry
     * -> Copy!!
     */
    Util.object_new_id(this);
    this.title = new_title;
    this.save(next);
  }
};

/**
 * Timetable.add_lecture(lecture, callback)
 * param =======================================
 * lecture : a UserLecture to add.
 *            If a same lecture already exist, error.
 * callback : callback for timetable.save()
 */
TimetableSchema.methods.add_lecture = function(lecture, next) {
  for (var i = 0; i<this.lecture_list.length; i++){
    if (lecture.is_equal(this.lecture_list[i])) {
      var err = new Error("Same lecture already exists in the timetable.");
      next(err);
      return;
    }
  }
  lecture.created_at = Date.now();
  lecture.updated_at = Date.now();
  this.lecture_list.push(lecture);
  this.save(next);
};

/**
 * Timetable.add_lectures(lectures, callback)
 * param =======================================
 * lectures : an array of lectures to merge.
 *            If a same lecture already exist, skip it.
 * callback : callback for timetable.save()
 */
/*
TimetableSchema.methods.add_lectures = function(lectures, next) {
  for (var i = 0; i<lectures.length; i++){
    var is_exist = false;
    for (var j = 0; j<this.lecture_list.length; j++){
      if (lectures[i].is_equal(this.lecture_list[j])) {
        is_exist = true;
        break;
      }
    }
    if (!is_exist) this.lecture_list.push(lectures);
  }
  this.save(next);
};
*/

TimetableSchema.statics.update_lecture = function(timetable_id, lecture_id, lecture_raw, next) {
  if (lecture_raw.course_number || lecture_raw.lecture_number)
    return next(new Error("modifying identities forbidden"));

  lecture_raw.updated_at = Date.now();

  var update_set = {};
  Util.object_del_id(lecture_raw);
  for (var field in lecture_raw) {
    update_set['lecture_list.$.' + field] = lecture_raw[field];
  }

  (function (timetable_id, lecture_id, lecture, patch) {
    mongoose.model("Timetable").findOneAndUpdate({ "_id" : timetable_id, "lecture_list._id" : lecture_id},
      {$set : patch}, {new: true}, function (err, doc) {
        if (err) return next(err);
        if (!doc) err = new Error("timetable not found");
        else if (!doc.lecture_list.id(lecture_id)) err = new Error("lecture not found");
        return next(err, doc);
      });
  }) (timetable_id, lecture_id, lecture_raw, update_set);
};

/**
 * Timetable.update_lecture(lecture_raw, callback)
 * param =======================================
 * lecture : a partial update for lecture.
 *            If a same lecture doesn't exist, error.
 * callback : callback (err) when finished
 */
TimetableSchema.methods.update_lecture = function(lecture_id, lecture_raw, next) {
  mongoose.model('Timetable').update_lecture(this._id, lecture_id, lecture_raw, next);
};



TimetableSchema.methods.delete_lecture = function(lecture_id, callback) {
  return mongoose.model("Timetable").findOneAndUpdate(
    {'_id' : this._id},
    { $pull: {lecture_list : {_id: lecture_id} } }, {new: true})
    .exec(callback);
};
module.exports = mongoose.model('Timetable', TimetableSchema);
