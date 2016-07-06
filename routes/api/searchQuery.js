var router = require('express').Router();
var LectureModel = require('../../model/lecture');
var Lecture = LectureModel.Lecture;
var Util = require('../../lib/util');

//something similar to LIKE query in SQL
function like(str, option) {
  if (option === undefined)
    option = { fromFirstChar: false };
  //replace every character(eg. 'c') to '.+c', except for first character
  var reg = str.replace(/(?!^)(.)/g, '.*$1');
  if (option.fromFirstChar)
    reg = '^' + reg;
  return reg
}

// deprecated
/*
function timeRangesToBinaryConditions(timeJson) {
  return Util.timeJsonToMask(timeJson).map(function(bit, idx) {
    return {$bitsAllClear : ~bit<<1>>>1};
  })
}
*/


module.exports = router.post('/', function(req, res, next) {
  if (!req.body.year || !req.body.semester) {
    return res.status(400).send('no year and semester');
  }
  var query = {};
  query.year = req.body.year;
  query.semester = req.body.semester;
  if (req.body.title)
    query.course_title = { $regex: like(req.body.title), $options: 'i' };
  if (req.body.credit && req.body.credit.length)
    query.credit = { $in: req.body.credit };
  if (req.body.instructor && req.body.instructor.length)
    query.instructor = { $in : req.body.instructor };
  if (req.body.academic_year && req.body.academic_year.length)
    query.academic_year = { $in : req.body.academic_year };
  if (req.body.classification && req.body.classification.length)
    query.classification = { $in : req.body.classification };
  if (req.body.category && req.body.category.length)
    query.category = { $in : req.body.category };
  if (req.body.department && req.body.department.length) // in this case result should be sorted by departments
    query.department = { $in : req.body.department };
  if (req.body.time_mask && req.body.time_mask.length == 6) {
    var conditions = Util.timeMasksToBinaryConditions(req.body.time_mask);
    conditions.forEach(function(condition, idx) {
      console.log(condition);
      query['class_time_mask.' + idx] = condition;
    })
  }

  Lecture.find(query).sort('course_number').lean().exec(function (err, lectures) {
    if (err) {
      console.log(err);
      return res.status(500).send("search error");
    }
    return res.json(lectures);
  })
});
