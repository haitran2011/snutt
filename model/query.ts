import {LectureModel, LectureDocument} from './lecture';
import errcode = require('../lib/errcode');

//something similar to LIKE query in SQL
function like(str, option) {
  //replace every character(eg. 'c') to '.+c', except for first character
  var reg = str.replace(/(?!^)(.)/g, '.*$1');
  if (option && option.fromFirstChar) reg = '^' + reg;
  return reg;
}

export class LectureQuery {
  year:number;
  semester:number;
  title:string;
  classification:[string];
  credit:[number];
  course_number:[string];
  academic_year:[string];
  instructor:[string];
  department:[string];
  category:[string];
  time_mask:[number];
  offset:number;
  limit:number;
}

export function search(lquery: LectureQuery): Promise<[LectureDocument]> {
  var mquery = {}; // m for Mongo
  mquery["year"] = lquery.year;
  mquery["semester"] = lquery.semester;
  if (lquery.title)
    mquery["course_title"] = { $regex: like(lquery.title, null), $options: 'i' };
  if (lquery.credit && lquery.credit.length)
    mquery["credit"] = { $in: lquery.credit };
  if (lquery.instructor && lquery.instructor.length)
    mquery["instructor"] = { $in : lquery.instructor };
  if (lquery.academic_year && lquery.academic_year.length)
    mquery["academic_year"] = { $in : lquery.academic_year };
  if (lquery.course_number && lquery.course_number.length)
    mquery["course_number"] = { $in : lquery.course_number };
  if (lquery.classification && lquery.classification.length)
    mquery["classification"] = { $in : lquery.classification };
  if (lquery.category && lquery.category.length)
    mquery["category"] = { $in : lquery.category };
  if (lquery.department && lquery.department.length) // in this case result should be sorted by departments
    mquery["department"] = { $in : lquery.department };
  if (lquery.time_mask) {
    if (lquery.time_mask.length != 7) return Promise.reject(errcode.INVALID_TIMEMASK);
    mquery["$where"] = "";
    lquery.time_mask.forEach(function(bit, idx) {
      if (idx > 0) mquery["$where"] += " && ";
      mquery["$where"] += "((this.class_time_mask["+idx+"] & "+(~bit<<1>>>1)+") == 0)";
    });
  }

  var offset, limit;
  if (!lquery.offset) offset = 0;
  else offset = lquery.offset;
  if (!lquery.limit) limit = 20;
  else limit = lquery.limit;

  return LectureModel.find(mquery).sort('course_number').lean()
    .skip(offset)
    .limit(limit)
    .exec().catch(function(err){
      console.error(err);
      return Promise.reject(errcode.SERVER_FAULT);
    });
}