import mongoose = require('mongoose');

export interface CourseBookDocument extends mongoose.Document{
  year: number,
  semester: number,
  updated_at: Date,
  start_date: Date,
  end_date: Date
}

interface _CourseBookModel extends mongoose.Model<CourseBookDocument>{
  getAll(flags?, cb?:(err, docs:mongoose.Types.DocumentArray<CourseBookDocument>)=>void)
      :Promise<mongoose.Types.DocumentArray<CourseBookDocument>>;
  getRecent(flags?, cb?:(err, doc:CourseBookDocument)=>void):Promise<CourseBookDocument>;
}

var CourseBookSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  updated_at: {type: Date, default: Date.now()},
  start_date: {type: Date },
  end_date: {type: Date }
});

CourseBookSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

CourseBookSchema.statics.getAll = function(flags, callback) {
  var query = CourseBookModel.find({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

CourseBookSchema.statics.getRecent = function(flags, callback) {
  var query = CourseBookModel.findOne({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

export let CourseBookModel = <_CourseBookModel>mongoose.model<CourseBookDocument>('CourseBook', CourseBookSchema);
