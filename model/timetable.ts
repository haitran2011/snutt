import mongoose = require('mongoose');
import {UserLectureDocument, UserLectureModel} from './lecture';
import Util = require('../lib/util');

var TimetableSchema = new mongoose.Schema({
  user_id : { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  year : {type : Number, required : true },
  semester : {type : Number, required : true, min:1, max:4 },
  title : {type : String, required : true },
  lecture_list: [UserLectureModel.schema],
  updated_at : Date
});

export interface TimetableDocument extends mongoose.Document {
  user_id: string;
  year: number;
  semester: number;
  title: string;
  lecture_list: mongoose.Types.DocumentArray<UserLectureDocument>;
  updated_at: number;

  checkDuplicate(cb?:(err)=>void):void;
  copy(new_title:string, cb?:(err, doc:TimetableDocument)=>void):void;
  add_lecture(lecture:UserLectureDocument, cb?:(err, doc:TimetableDocument)=>void):void;
  update_lecture(lecture_id:mongoose.Types.ObjectId, lecture_raw, cb?:(err, doc:TimetableDocument)=>void):void;
  delete_lecture(lecture_id:mongoose.Types.ObjectId, cb?:(err, doc:TimetableDocument)=>void):void;
}

export interface _TimetableModel extends mongoose.Model<TimetableDocument> {
  getTimetables(user_id:mongoose.Types.ObjectId, flags, cb?:(err, docs:TimetableDocument[])=>void):Promise<TimetableDocument[]>;
  getTimetablesBySemester(user_id:mongoose.Types.ObjectId, year:number, semester:number, flags, cb?:(err, docs:TimetableDocument[])=>void):Promise<TimetableDocument[]>;
  getTimetable(user_id:mongoose.Types.ObjectId, timetable_id:mongoose.Types.ObjectId, flags, cb?:(err, docs:TimetableDocument)=>void):Promise<TimetableDocument>;
  getRecent(user_id:mongoose.Types.ObjectId, flags, cb?:(err, docs:TimetableDocument)=>void):Promise<TimetableDocument>;
  createTimetable(params, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
  update_lecture(timetable_id:mongoose.Types.ObjectId, lecture_id:mongoose.Types.ObjectId, lecture_raw, cb?:(err, doc:TimetableDocument)=>void);
}

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

TimetableSchema.statics.getTimetablesBySemester = function(user_id, year, semester, flags, callback) {
  var query = mongoose.model("Timetable").find({'user_id': user_id, 'year': year, 'semester': semester});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getTimetable = function(user_id, timetable_id, flags, callback) {
  var query = mongoose.model("Timetable").findOne({'user_id': user_id, '_id' : timetable_id});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getRecent = function(user_id, flags, callback) {
  var query = mongoose.model("Timetable").findOne({'user_id': user_id}).sort({updated_at : -1});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.createTimetable = function(params, callback) {
  var Timetable = <_TimetableModel>mongoose.model("Timetable");
  if (!callback) callback = function(){};
  return new Promise(function(resolve, reject) {
    if (!params || !params.user_id || !params.year || !params.semester || !params.title) {
      let err = "not enough parameter";
      callback(err);
      return reject(err);
    }
    var timetable = new Timetable({
      user_id : params.user_id,
      year : params.year,
      semester : params.semester,
      title : params.title,
      lecture_list : []
    });
    timetable.checkDuplicate(function (err) {
      if (err) {
        let err = "duplicate title";
        callback(err);
        return reject(err);
      }
      timetable.save(function(err, doc) {
        if(err || !doc) {
          let err = "insert timetable failed";
          callback(err);
          return reject(err);
        }
        callback(null, doc);
        resolve(doc);
      });
    });
  });
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
    (<_TimetableModel>mongoose.model('Timetable')).findOneAndUpdate({ "_id" : timetable_id, "lecture_list._id" : lecture_id},
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
  (<_TimetableModel>mongoose.model('Timetable')).update_lecture(this._id, lecture_id, lecture_raw, next);
};



TimetableSchema.methods.delete_lecture = function(lecture_id, callback) {
  return mongoose.model("Timetable").findOneAndUpdate(
    {'_id' : this._id},
    { $pull: {lecture_list : {_id: lecture_id} } }, {new: true})
    .exec(callback);
};
export let TimetableModel = <_TimetableModel>mongoose.model<TimetableDocument>('Timetable', TimetableSchema);
