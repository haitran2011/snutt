/**
 * Created by north on 16. 2. 24.
 */
"use strict";

var mongoose = require('mongoose');

var TagListSchema = mongoose.Schema({
    year: {type: Number, required: true},
    semester: {type: Number, required: true},
    updated_at: {type: Date, default: Date.now()},
    tags: {
        classification: {type: [String]},
        department: {type: [String]},
        academic_year: {type: [String]},
        credit: {type: [String]},
        instructor: {type: [String]},
        category: {type: [String]}
    }
});

TagListSchema.index({year: 1, semester: 1});

module.exports = mongoose.model('TagList', TagListSchema);
