var db = require('../db')

var timetableSchema = db.Schema({
  nameid: Number,
  contents: String
});

module.exports = db.model('Timetable', timetableSchema);