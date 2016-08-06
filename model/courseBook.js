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

module.exports = mongoose.model('CourseBook', CourseBookSchema);
