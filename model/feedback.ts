import mongoose = require('mongoose');

export interface FeedbackDocument extends mongoose.Document {
  date: Date,
  email: string,
  message: string
}

var FeedbackSchema = new mongoose.Schema({
  date: {type:Date, default: Date.now()},
  email: String,
  message: String
});

export let FeedbackModel = mongoose.model<FeedbackDocument>('Feedback', FeedbackSchema);
