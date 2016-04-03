/**
 * Created by north on 16. 2. 24.
 */
var express = require('express');
var router = express.Router();
var TagList = require('../../model/tagList');

router.get('/:year/:semester/update_time', function(req, res, next) {
  TagList.findOne({'year' : req.params.year, 'semester' : req.params.semester},'updated_at', function (err, doc) {
    if (err) return res.status(500).send('unknown error');
    if (!doc) res.status(404).send('not found');
    else res.send(doc.updated_at.getTime().toString());
  });
});

router.get('/:year/:semester/', function(req, res, next) {
  TagList.findOne({'year' : req.params.year, 'semester' : req.params.semester},'tags updated_at', function (err, doc) {
    if (err) return res.status(500).send('unknown error');
    if (!doc) res.status(404).send('not found');
    else {
      var ret = {
        classification : doc.tags.classification,
        department : doc.tags.department,
        academic_year : doc.tags.academic_year,
        credit : doc.tags.credit,
        instructor : doc.tags.instructor,
        category : doc.tags.category,
        updated_at : doc.updated_at.getTime()
      };
      res.json(ret);
    }
  });
});

module.exports = router;