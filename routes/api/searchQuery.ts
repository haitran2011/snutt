import express = require('express');
var router = express.Router();
import {LectureModel} from '../../model/lecture';
import Util = require('../../lib/util');
import errcode = require('../../lib/errcode');

//something similar to LIKE query in SQL
function like(str, option) {
  //replace every character(eg. 'c') to '.+c', except for first character
  var reg = str.replace(/(?!^)(.)/g, '.*$1');
  if (option && option.fromFirstChar) reg = '^' + reg;
  return reg;
}

// deprecated
/*
function timeRangesToBinaryConditions(timeJson) {
  return Util.timeJsonToMask(timeJson).map(function(bit, idx) {
    return {$bitsAllClear : ~bit<<1>>>1};
  })
}
*/

router.post('/', function(req, res, next) {
  if (!req.body.year || !req.body.semester) {
    return res.status(400).json({errcode:errcode.NO_YEAR_OR_SEMESTER, message: 'no year and semester'});
  }
  var query = {};
  query["year"] = req.body.year;
  query["semester"] = req.body.semester;
  if (req.body.title)
    query["course_title"] = { $regex: like(req.body.title, null), $options: 'i' };
  if (req.body.credit && req.body.credit.length)
    query["credit"] = { $in: req.body.credit };
  if (req.body.instructor && req.body.instructor.length)
    query["instructor"] = { $in : req.body.instructor };
  if (req.body.academic_year && req.body.academic_year.length)
    query["academic_year"] = { $in : req.body.academic_year };
  if (req.body.course_number && req.body.course_number.length)
    query["course_number"] = { $in : req.body.course_number };
  if (req.body.classification && req.body.classification.length)
    query["classification"] = { $in : req.body.classification };
  if (req.body.category && req.body.category.length)
    query["category"] = { $in : req.body.category };
  if (req.body.department && req.body.department.length) // in this case result should be sorted by departments
    query["department"] = { $in : req.body.department };
  if (req.body.time_mask) {
    if (req.body.time_mask.length != 7) return res.status(400).json({errcode:errcode.INVALID_TIMEMASK, message: "invalid timemask"})
    query["$where"] = "";
    req.body.time_mask.forEach(function(bit, idx) {
      if (idx > 0) query["$where"] += " && ";
      query["$where"] += "((this.class_time_mask["+idx+"] & "+(~bit<<1>>>1)+") == 0)";
    });
  }

  var offset, limit;
  if (!req.body.offset) offset = 0;
  else offset = Number(req.body.offset);
  if (!req.body.limit) limit = 20;
  else limit = Number(req.body.limit);

  LectureModel.find(query).sort('course_number').lean()
    .skip(offset)
    .limit(limit)
    .exec(function (err, lectures) {
      if (err) {
        console.log(err);
        return res.status(500).json({errcode:errcode.SERVER_FAULT, message: "search error"});
      }
      return res.json(lectures);
  });
});

export = router;