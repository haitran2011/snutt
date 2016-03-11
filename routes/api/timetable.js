var express = require('express');
var router = express.Router();

var timeJsonToMask = require('../../data/update_lectures.js').timeJsonToMask;

var Timetable = require('../../model/timetable');
var Lecture = require('../../model/lecture');

router.get('/', function(req, res, next) { //timetable list
  Timetable.find({'user_id' : req.user._id}).select('year semester title _id')
  .exec(function(err, timetables) {
    if(err) return res.status(500).send('fetch timetable list failed');
    res.json(timetables);
  });
});

router.get('/:id', function(req, res, next) { //get
  Timetable.findOne({'user_id': req.user._id, '_id' : req.params.id})
  .exec(function(err, timetable) {
    if(err) return res.status(500).send("find table failed");
    if(!timetable) return res.status(404).send('timetable not found');
    res.json(timetable);
  });
});

router.post('/', function(req, res, next) { //create
  var timetable = new Timetable({
    user_id : req.user._id, 
    year : req.body.year,
    semester : req.body.semester,
    title : req.body.title,
    lecture_list : []
  });
  timetable.save(function(err, doc) {
    if(err) return res.status(500).send('insert timetable failed');
    res.send(doc._id);
  });
});

/*
 * POST /tables/:id/lecture
 * add a lecture into a timetable
 * param ===================================
 * lecture : json object of lecture to add
 */
router.post('/:id/lecture', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      var json = req.body['lecture'];
      json.class_time_mask = timeJsonToMask(json.class_time_json);
      var lecture = new Lecture(json);
      lecture.save(function(err, doc){
        timetable.add_lecture(doc, function(err){
          if(err) return res.status(500).send("insert lecture failed");
          res.send("ok");
        });
      });
    })
});

/*
 * POST /tables/:id/lectures
 * add lectures into a timetable
 * param ===================================
 * lectures : array of lectures to add
 */
router.post('/:id/lectures', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      var lectures = [];
      var lectures_raw = req.body['lectures'];
      for (var lecture_raw in lectures_raw) {
        lecture_raw.class_time_mask = timeJsonToMask(lecture_raw.class_time_json);
        var lecture = new Lecture(lecture_raw);
        lectures.push(lecture);
      }
      timetable.add_lectures(lectures, function(err){
        if(err) return res.status(500).send("insert lecture failed");
        res.send("ok");
      });
  })
});

/*
 * PUT /tables/:id/lecture
 * update a lecture of a timetable
 * param ===================================
 * lecture : json object of lecture to update
 */
router.put('/:id/lecture', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      var lecture_raw = req.body['lecture'];
      timetable.update_lecture(lecture_raw, function(err){
        if(err) return res.status(500).send("update lecture failed");
        res.send("ok");
      });
    })
});

/*
 * DELETE /tables/:id/lecture
 * delete a lecture from a timetable
 * param ===================================
 * lecture_id :id of lecture to delete
 */
router.delete('/:id/lecture', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      timetable.delete_lecture(req.body.lecture_id, function(err){
        if(err) return res.status(500).send("delete lecture failed");
        res.send("ok");
      });
    })
});

/*
 * DELETE /tables/:id
 * delete a timetable
 */
router.delete('/:id', function(req, res, next) { // delete
  Timetable.findOneAndRemove({'user_id': req.user._id, '_id' : req.params.id})
  .exec(function(err) {
    if(err) return res.status(500).send("delete timetable failed");
    res.send("ok");
  });
});

/*
 * POST /tables/:id/copy
 * copy a timetable
 */
router.post('/:id/copy', function(req, res, next) {
  Timetable.findOne({'user_id': req.user_id, '_id' : req.params.id})
    .exec(function(err, timetable){
      if(err) return res.status(500).send("find table failed");
      if(!timetable) return res.status(404).send("timetable not found");
      timetable.copy(timetable.title, function(err, doc) {
        if(err) return res.status(500).send("timetable copy failed");
        else res.send(doc._id);
      });
    })
});

router.put('/:id', function(req, res, next) {
  Timetable.findOneAndUpdate({'user_id': req.user._id, '_id' : req.params.id},
    {
      title : req.body.title
    }
    , function(err, timetable) {
      if(err) return res.status(500).send("update timetable title failed");
      res.json(timetable);
    });
  
});

module.exports = router;
