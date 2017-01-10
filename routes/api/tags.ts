/**
 * Created by north on 16. 2. 24.
 */
import express = require('express');
var router = express.Router();
import {TagListModel} from '../../model/tagList';
import errcode = require('../../lib/errcode');

router.get('/:year/:semester/update_time', function(req, res, next) {
  TagListModel.findOne({'year' : req.params.year, 'semester' : req.params.semester},'updated_at', function (err, doc) {
    if (err) return res.status(500).json({errcode: errcode.SERVER_FAULT, message: 'unknown error'});
    if (!doc) res.status(404).json({errcode: errcode.TAG_NOT_FOUND, message: 'not found'});
    else res.json({updated_at: doc.updated_at.getTime()});
  });
});

router.get('/:year/:semester/', function(req, res, next) {
  TagListModel.findOne({'year' : req.params.year, 'semester' : req.params.semester},'tags updated_at', function (err, doc) {
    if (err) return res.status(500).json({errcode: errcode.SERVER_FAULT, message: 'unknown error'});
    if (!doc) res.status(404).json({errcode: errcode.TAG_NOT_FOUND, message: 'not found'});
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

export = router;