var mongoose = require('mongoose');
var assert = require('assert');
var _ = require('lodash');

function timeAndPlaceToJson(timesString, locationsString) {
  if (timesString == '')
    return [];

  var locations = locationsString.split('/');
  var times = timesString.split('/');
  assert.equal(locations.length, times.length, "locations does not match with times")

  var classes = times.map(function(time, idx) {
    return {
      day: ['월', '화', '수', '목', '금', '토'].indexOf(time.charAt(0)),
      start: Number(time.split('-')[0].slice(2)),
      len: Number(time.split('-')[1].slice(0, -1)),
      place: (locationsString == '/' ? '' : locations[idx])
    }
  });

  //merge if splitted
  //(eg: 목(9-2)/목(11-2) && 220-317/220-317 => 목(9-4) '220-317')
  //(eg2: 금(3-2)/금(3-2) && 020-103/020-104 => 금(3-2) && '020-103/020-104')
  for (var i = 1; i < classes.length; i++) {
    var prev = classes[i-1];
    var curr = classes[i];
    if (prev.day == curr.day && prev.place == curr.place && curr.start == (prev.start + prev.len)) {
      prev.len += curr.len;
      classes.splice(i--, 1)
    } else if (prev.day == curr.day && prev.start == curr.start && prev.len == curr.len) {
      prev.place += '/' + curr.place;
      classes.splice(i--, 1)
    }
  }
  return classes;
}

function timeJsonToMask(timeJson) {
  var i,j;
  var bitTable2D = [];
  for (i = 0; i < 6; i++)
    bitTable2D.push(_.fill(new Array(26), 0))

  timeJson.forEach(function(lecture, lectureIdx) {
    var dayIdx = lecture.day;
    for (var i = lecture.start * 2; i < (lecture.start + lecture.len)*2; i++)
      bitTable2D[dayIdx][i] = 1
  });

  var timeMasks = [];
  for (i = 0; i < 6; i++) {
    var mask = 0;
    for (j = 0; j < 25; j++) {
      if (bitTable2D[i][j] === 1)
        mask = mask + 1;
      mask = mask << 1
    }
    timeMasks.push(mask)
  }
  return timeMasks
}

  /*
   * Delete '_id' prop of the object and its sub-object recursively
   */
var object_del_id = function(object) {
  if (object != null && typeof(object) != 'string' &&
    typeof(object) != 'number' && typeof(object) != 'boolean') {
    //for array length is defined however for objects length is undefined
    if (typeof(object.length) == 'undefined') {
      delete object._id;
      for (var key in object) {
        if (object.hasOwnProperty(key) && object[key]._id) object_del_id(object[key]); //recursive del calls on object elements
      }
    } else {
      for (var i = 0; i < object.length; i++) {
        object_del_id(object[i]);  //recursive del calls on array elements
      }
    }
  }
};

/*
 * New '_id' prop of the object and its sub-object recursively
 * for deep-copying a mongoose document.
 * Then save the object.
 * http://www.connecto.io/blog/deep-copyingcloning-of-mongoose-object/
 */
var object_new_id = function(object) {
  if (object != null && typeof(object) != 'string' &&
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
module.exports = {
  object_del_id: object_del_id,
  object_new_id: object_new_id,
  timeAndPlaceToJson: timeAndPlaceToJson,
  timeJsonToMask: timeJsonToMask };