"use strict";

var mongoose = require('mongoose');

var CourseBookSchema = mongoose.Schema({
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
  var query = mongoose.model("CourseBook").find({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

CourseBookSchema.statics.getRecent = function(flags, callback) {
  var query = mongoose.model("CourseBook").findOne({}, '-_id year semester updated_at')
  .sort([["year", -1], ["semester", -1]]);
  if (flags && flags.lean === true) query = query.lean();
  return query.exec(callback);
};

module.exports = mongoose.model('CourseBook', CourseBookSchema);
