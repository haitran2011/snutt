var mkdirp = require('mkdirp');

// config
var config = require('./config.js');

// make directories if not exist
mkdirp.sync(config.snutt.USER_IMAGE_PATH);
mkdirp.sync(config.snutt.USER_TIMETABLE_PATH);
mkdirp.sync(config.snutt.USER_ICS_PATH);

var handler = require('./controllers/handler');

// define application
var port = process.env.PORT || 3784;
var app = require('http').createServer(handler);
app.listen(port);
console.log("Listening on " + port);
