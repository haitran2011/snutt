import mongoose = require('mongoose');
import {UserLectureDocument, UserLectureModel, LectureDocument, LectureModel} from './lecture';
import Util = require('../lib/util');
import errcode = require('../lib/errcode');
import Color = require('../lib/color');

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
  add_lecture(lecture:UserLectureDocument, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
  update_lecture(lecture_id:string, lecture_raw, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
  delete_lecture(lecture_id:string, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
  get_lecture(lecture_id:string):UserLectureDocument;
  reset_lecture(lecture_id, cb?: (err:any, doc?:UserLectureDocument)=>void): Promise<UserLectureDocument>;
  available_color_legacy(): {fg:string, bg:string}[];
  available_color(): number[];
  get_new_color_legacy(): {fg:string, bg:string};
  get_new_color(): number;
  validateLectureTime(lecture_id:string, lecture:UserLectureDocument): boolean;
}

export interface _TimetableModel extends mongoose.Model<TimetableDocument> {
  getTimetables(user_id:string, flags, cb?:(err, docs:TimetableDocument[])=>void):Promise<TimetableDocument[]>;
  getTimetablesBySemester(user_id:string, year:number, semester:number, flags, cb?:(err, docs:TimetableDocument[])=>void):Promise<TimetableDocument[]>;
  getTimetable(user_id:string, timetable_id:string, flags, cb?:(err, docs:TimetableDocument)=>void):Promise<TimetableDocument>;
  getRecent(user_id:string, flags, cb?:(err, docs:TimetableDocument)=>void):Promise<TimetableDocument>;
  createTimetable(params, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
  update_lecture(timetable_id:string, lecture_id:string, lecture_raw, cb?:(err, doc:TimetableDocument)=>void):Promise<TimetableDocument>;
}

TimetableSchema.index({ year: 1, semester: 1, user_id: 1 });

TimetableSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

TimetableSchema.methods.checkDuplicate = function(next) {
  (function (timetable) {
    TimetableModel.findOne(
      {
        user_id : timetable.user_id,
        year : timetable.year,
        semester: timetable.semester,
        title: timetable.title
      }, function (err, doc) {
        if (err) return next(err);
        if (doc && !doc._id.equals(timetable._id)) {
          var new_err = errcode.DUPLICATE_TIMETABLE_TITLE;
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
  var query = TimetableModel.where('user_id', user_id).select('year semester title _id updated_at');
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getTimetablesBySemester = function(user_id, year, semester, flags, callback) {
  var query = TimetableModel.find({'user_id': user_id, 'year': year, 'semester': semester});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getTimetable = function(user_id, timetable_id, flags, callback) {
  var query = TimetableModel.findOne({'user_id': user_id, '_id' : timetable_id});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.getRecent = function(user_id, flags, callback) {
  var query = TimetableModel.findOne({'user_id': user_id}).sort({updated_at : -1});
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

TimetableSchema.statics.createTimetable = function(params, callback) {
  if (!callback) callback = function(){};
  return new Promise(function(resolve, reject) {
    if (!params || !params.user_id || !params.year || !params.semester || !params.title) {
      let err = errcode.NOT_ENOUGH_TO_CREATE_TIMETABLE;
      callback(err);
      return reject(err);
    }
    var timetable = new TimetableModel({
      user_id : params.user_id,
      year : params.year,
      semester : params.semester,
      title : params.title,
      lecture_list : []
    });
    timetable.checkDuplicate(function (err) {
      if (err) {
        let err = errcode.DUPLICATE_TIMETABLE_TITLE;
        callback(err);
        return reject(err);
      }
      timetable.save(function(err, doc) {
        if(err) {
          callback(err);
          return reject(err);
        }
        if(!doc) {
          let err = errcode.SERVER_FAULT;
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
    var new_err = errcode.DUPLICATE_TIMETABLE_TITLE;
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
TimetableSchema.methods.add_lecture = function(lecture:UserLectureDocument, next):Promise<TimetableDocument> {
  for (var i = 0; i<this.lecture_list.length; i++){
    if (lecture.is_equal(this.lecture_list[i])) {
      var err = errcode.DUPLICATE_LECTURE;
      if(next) next(err);
      return Promise.reject(err);
    }
  }
  if (!this.validateLectureTime(lecture._id, lecture)) {
    var err = errcode.LECTURE_TIME_OVERLAP;
    if(next) next(err);
    return Promise.reject(err);
  }

  if (!UserLectureModel.validate_color(lecture)) {
    var err = errcode.INVALID_COLOR;
    if(next) next(err);
    return Promise.reject(err);
  }

  lecture.created_at = new Date();
  lecture.updated_at = new Date();
  this.lecture_list.push(lecture);
  return this.save(next);
};

TimetableSchema.statics.update_lecture = function(timetable_id, lecture_id, lecture_raw, cb):Promise<TimetableDocument> {
  return TimetableModel.findOne({'_id': timetable_id}).exec().then(function(timetable){
    if (timetable) return timetable.update_lecture(lecture_id, lecture_raw, cb);
    else {
      var err = errcode.TIMETABLE_NOT_FOUND;
      if(cb) cb(err);
      return Promise.reject(err);
    }
  }).catch(function(err){
    if(cb) cb(err);
    return Promise.reject(err);
  });
};

/**
 * Timetable.update_lecture(lecture_raw, callback)
 * param =======================================
 * lecture : a partial update for lecture.
 *            If a same lecture doesn't exist, error.
 * callback : callback (err) when finished
 */
TimetableSchema.methods.update_lecture = function(lecture_id, lecture_raw, cb): Promise<TimetableDocument> {
  if (lecture_raw.course_number || lecture_raw.lecture_number) {
    var err = errcode.ATTEMPT_TO_MODIFY_IDENTITY;
    if(cb) cb(err);
    return Promise.reject(err);
  }

  if (lecture_raw['class_time_json']) {
    try {
      lecture_raw['class_time_mask'] = Util.timeJsonToMask(lecture_raw['class_time_json'], true);
    } catch (err) {
      if(cb) cb(err);
      return Promise.reject(err);
    }
  }

  if (lecture_raw['class_time_mask'] && !this.validateLectureTime(lecture_id, lecture_raw)) {
    var err = errcode.LECTURE_TIME_OVERLAP;
    if(cb) cb(err);
    return Promise.reject(err);
  }

  if (lecture_raw['color'] && !UserLectureModel.validate_color(lecture_raw)) {
    var err = errcode.INVALID_COLOR;
    if(cb) cb(err);
    return Promise.reject(err);
  }

  lecture_raw.updated_at = Date.now();

  var update_set = {};
  Util.object_del_id(lecture_raw);
  for (var field in lecture_raw) {
    update_set['lecture_list.$.' + field] = lecture_raw[field];
  }

  var promise = TimetableModel.findOneAndUpdate({ "_id" : this._id, "lecture_list._id" : lecture_id},
    {$set : update_set}, {new: true}).exec().then(function(doc){
      if (!doc) return Promise.reject(errcode.TIMETABLE_NOT_FOUND);
      else if (!doc.lecture_list.id(lecture_id)) return Promise.reject(errcode.LECTURE_NOT_FOUND)
      return Promise.resolve(doc);
    });

  promise = promise.then(function(timetable) {
      if(cb) cb(null, timetable);
      return Promise.resolve(timetable);
    }).catch(function(err) {
      if(cb) cb(err);
      return Promise.reject(err);
    });

  return promise;
};

TimetableSchema.methods.get_lecture = function(lecture_id): UserLectureDocument {
  var timetable:TimetableDocument = this;
  return timetable.lecture_list.id(lecture_id);
}

TimetableSchema.methods.reset_lecture = function(lecture_id,
      cb?: (err:any, doc?:UserLectureDocument)=>void): Promise<UserLectureDocument> {
    var timetable:TimetableDocument = this;
    var lecture:UserLectureDocument = timetable.get_lecture(lecture_id);
    if (lecture.is_custom()) {
      if (cb) cb(errcode.IS_CUSTOM_LECTURE);
      return Promise.reject(errcode.IS_CUSTOM_LECTURE);
    }
    
    var promise:Promise<any> = LectureModel.findOne({'year':this.year, 'semester':this.semester,
      'course_number':lecture.course_number, 'lecture_number':lecture.lecture_number}).lean()
      .exec().then(function(ref_lecture:LectureDocument){
        if (!ref_lecture) return Promise.reject(errcode.REF_LECTURE_NOT_FOUND);
        delete ref_lecture.lecture_number;
        delete ref_lecture.course_number;
        return timetable.update_lecture(lecture_id, ref_lecture);
      });

    promise = promise.then(function(timetable) {
      if(cb) cb(null, timetable);
      return Promise.resolve(timetable);
    }).catch(function(err) {
      if(cb) cb(err);
      return Promise.reject(err);
    });

    return promise;
  }

TimetableSchema.methods.available_color = function(): number[] {
  var checked:boolean[] = [];
  var timetable:TimetableDocument = this;
  for (var i=0; i<timetable.lecture_list.length; i++) {
    var lecture_color = timetable.lecture_list[i].colorIndex;
    checked[lecture_color] = true;
  }

  var ret:number[] = [];
  // colorIndex = 0 is custom color!
  for (var i=1; i<Color.numColor; i++) {
    if (!checked[i]) ret.push(i);
  }
  return ret;
}

TimetableSchema.methods.available_color_legacy = function(): {fg:string, bg:string}[] {
  var checked = [];
  var timetable:TimetableDocument = this;
  var colors = Color.getLegacyColors();
  for (var i=0; i<timetable.lecture_list.length; i++) {
    var lecture_color = timetable.lecture_list[i].color;
    for (var j=0; j<colors.length; j++) {
      if (lecture_color.fg == colors[j].fg && lecture_color.bg == colors[j].bg) {
        checked[j] = true;
        break;
      }
    }
  }

  var ret = [];
  for (var i=0; i<colors.length; i++) {
    if (!checked[i]) ret.push(colors[i]);
  }
  return ret;
}

TimetableSchema.methods.get_new_color = function(): number {
  var timetable:TimetableDocument = this;
  var available_colors = timetable.available_color();
  // colorIndex = 0 is custom color!
  if (available_colors.length == 0) return Math.floor(Math.random() * Color.numColor) + 1;
  else return available_colors[Math.floor(Math.random() * available_colors.length)]
}

TimetableSchema.methods.get_new_color_legacy = function(): {fg:string, bg:string} {
  var timetable:TimetableDocument = this;
  var available_colors = timetable.available_color_legacy();
  if (available_colors.length == 0) return Color.get_random_color_legacy();
  else return available_colors[Math.floor(Math.random() * available_colors.length)]
}

TimetableSchema.methods.validateLectureTime = function(lecture_id:string, lecture:UserLectureDocument): boolean {
  var tablemask = [0,0,0,0,0,0,0];
  for (var i=0; i<this.lecture_list.length; i++) {
    var tableLecture:LectureDocument = this.lecture_list[i];
    if (lecture_id == tableLecture._id) continue;
    for (var j=0; j<tableLecture.class_time_mask.length; j++)
      if ((tableLecture.class_time_mask[j] & lecture.class_time_mask[j]) != 0) return false;
  }
  return true;
}

TimetableSchema.methods.delete_lecture = function(lecture_id, callback): Promise<TimetableDocument> {
  return TimetableModel.findOneAndUpdate(
    {'_id' : this._id},
    { $pull: {lecture_list : {_id: lecture_id} } }, {new: true})
    .exec(callback);
};
export let TimetableModel = <_TimetableModel>mongoose.model<TimetableDocument>('Timetable', TimetableSchema);
