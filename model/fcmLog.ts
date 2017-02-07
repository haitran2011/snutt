import mongoose = require('mongoose');

export interface FcmLogDocument extends mongoose.Document {
  date: Date,
  author: string,
  to: string,
  message: string,
  cause: string,
  response: string
}

var FcmLogSchema = new mongoose.Schema({
  date: {type:Date, default: Date.now()},
  author: String,
  to: String,
  message: String,
  cause: String,
  response: String
});

export let FcmLogModel = mongoose.model<FcmLogDocument>('FcmLog', FcmLogSchema);
