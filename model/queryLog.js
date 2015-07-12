var db = require('../db')

var queryLogSchema = db.Schema ({
  lastQueryTime: { type: Date, default: Date.now },
  count: { type: Number, min: 1, default: 1 },
  year: { type: Number, min: 2000, max: 2999 },
  semester: { type: String },
  type: { type: String },
  body: String
});

module.exports = db.model('QueryLog', queryLogSchema);
