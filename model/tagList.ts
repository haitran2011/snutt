/**
 * Created by north on 16. 2. 24.
 */
import mongoose = require('mongoose');

export interface TagListDocument extends mongoose.Document {
  year: number,
  semester: number,
  updated_at: Date,
  tags: {
    classification: string[],
    department: string[],
    academic_year: string[],
    credit: string[],
    instructor: string[],
    category: string[]
  }
}

var TagListSchema = new mongoose.Schema({
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

export let TagListModel = mongoose.model<TagListDocument>('TagList', TagListSchema);
