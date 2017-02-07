import mongoose = require('mongoose');
import assert = require('assert');
import _ = require('lodash');

class TimePlace {
  day: number;
  start: number;
  len: number;
  place: string;

  constructor(obj:Object) {
    this.day = obj["day"];
    this.start = obj["start"];
    this.len = obj["len"];
    this.place = obj["place"];
  }
}

export function timeAndPlaceToJson(timesString: string, locationsString: string): Array<TimePlace> {
  if (timesString === '')
    return [];

  var locations = locationsString.split('/');
  var times = timesString.split('/');
  assert.equal(locations.length, times.length, "locations does not match with times");

  var classes = times.map(function(time, idx) { 
    return new TimePlace({
      day: ['월', '화', '수', '목', '금', '토', '일'].indexOf(time.charAt(0)),
      start: Number(time.split('-')[0].slice(2)),
      len: Number(time.split('-')[1].slice(0, -1)),
      place: (locationsString == '/' ? '' : locations[idx])
    });
  });

  for (let i = 0; i< classes.length; i++) {
    // If the day of the week is not the one we expected
    if (classes[i].day < 0) {
      return null;
    }
  }

  //merge if splitted
  //(eg: 목(9-2)/목(11-2) && 220-317/220-317 => 목(9-4) '220-317')
  //(eg2: 금(3-2)/금(3-2) && 020-103/020-104 => 금(3-2) && '020-103/020-104')
  //But do not merge when both time and places are different
  for (var i = 1; i < classes.length; i++) {
    var prev = classes[i-1];
    var curr = classes[i];
    if (prev.day == curr.day && prev.place == curr.place && curr.start == (prev.start + prev.len)) {
      prev.len += curr.len;
      classes.splice(i--, 1);
    } else if (prev.day == curr.day && prev.start == curr.start && prev.len == curr.len) {
      prev.place += '/' + curr.place;
      classes.splice(i--, 1);
    }
  }
  return classes;
}

export function equalTimeJson(t1:Array<TimePlace>, t2:Array<TimePlace>) {
  if (t1.length != t2.length) return false;
  for (var i=0; i<t1.length; i++) {
    if (t1[i].day != t2[i].day ||
      t1[i].start != t2[i].start ||
      t1[i].len != t2[i].len ||
      t1[i].place != t2[i].place)
      return false;
  }
  return true;
}

export function timeJsonToMask(timeJson) {
  var i,j;
  var bitTable2D = [];
  for (i = 0; i < 7; i++)
    bitTable2D.push(_.fill(new Array(30), 0));

  timeJson.forEach(function(lecture, lectureIdx) {
    var dayIdx = lecture.day;
    for (var i = lecture.start * 2; i < (lecture.start + lecture.len)*2; i++)
      bitTable2D[dayIdx][i] = 1;
  });

  var timeMasks = [];
  for (i = 0; i < 7; i++) {
    var mask = 0;
    for (j = 0; j < 30; j++) {
      mask = mask << 1;
      if (bitTable2D[i][j] === 1)
        mask = mask + 1;
    }
    timeMasks.push(mask);
  }
  return timeMasks;
}

/**
 * Delete '_id' prop of the object and its sub-object recursively
 * This is for copying mongo objects or sanitizing json objects by removing all _id properties
 */
export function object_del_id(object) {
  if (object && typeof(object) != 'string' &&
    typeof(object) != 'number' && typeof(object) != 'boolean') {
    //for array length is defined however for objects length is undefined
    if (typeof(object.length) == 'undefined' && '_id' in object) {
      delete object._id;
      for (var key in object) {
        if (object.hasOwnProperty(key)) object_del_id(object[key]); //recursive del calls on object elements
      }
    } else {
      for (var i = 0; i < object.length; i++) {
        object_del_id(object[i]);  //recursive del calls on array elements
      }
    }
  }
};

/**
 * New '_id' prop of the object and its sub-object recursively
 * for deep-copying a mongoose document.
 * Then save the object.
 * http://www.connecto.io/blog/deep-copyingcloning-of-mongoose-object/
 */
export function object_new_id(object) {
  if (object && typeof(object) != 'string' &&
    typeof(object) != 'number' && typeof(object) != 'boolean') {
    //for array length is defined however for objects length is undefined
    if (typeof(object.length) == 'undefined' && '_id' in object) {
      object._id = mongoose.Types.ObjectId();
      for (var key in object) {
        if (object.hasOwnProperty(key)) object_new_id(object[key]); //recursive del calls on object elements
      }
    } else {
      for (var i = 0; i < object.length; i++) {
        object_new_id(object[i]);  //recursive del calls on array elements
      }
    }
  }
};

export function compareLecture(oldl, newl) {
  var updated = {
    before:{},
    after:{}
  };
  var keys = [
    'classification',
    'department',
    'academic_year',
    'course_title',
    'credit',
    'instructor',
    'quota',
    //'enrollment',
    'remark',
    'category'
    ];
  for (var i=0; i<keys.length; i++) {
    if (oldl[keys[i]] != newl[keys[i]]) {
      updated.before[keys[i]] = oldl[keys[i]];
      updated.after[keys[i]] = newl[keys[i]];
    }
  }

  if (!equalTimeJson(oldl.class_time_json, newl.class_time_json)) {
    updated.before["class_time_json"] = oldl.class_time_json;
    updated.after["class_time_json"] = newl.class_time_json;
  }

  if (Object.keys(updated.after).length === 0) updated = null;
  return updated;
};
