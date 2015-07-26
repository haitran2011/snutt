var db = require('../db')

var queryLogSchema = db.Schema ({
  time: { type: Date, default: Date.now },
  year: { type: Number, min: 2000, max: 2999 },
  semester: { type: String },
  type: { type: String },
  body: String
});

module.exports = db.model('QueryLog', queryLogSchema);
