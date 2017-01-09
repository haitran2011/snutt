import express = require("express");
const db = require('./db');
import logger = require("morgan");
import cookieParser = require("cookie-parser");
import bodyParser = require("body-parser");
import cors = require("cors");
import path = require("path");

import routes = require('./routes/routes');
import http = require('http');
import https = require('https');
import fs = require('fs');

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if (app.get('env') !== 'mocha')
  app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// only for development server
app.use(cors());

app.use('/', routes);
// catch 404 and forward to error handler
/*
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});
*/

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development' ||
  app.get('env') === 'mocha') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});

import config = require('./config/config');
var debug = require('debug')('snutt:server');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(config.port || '3000');
var host = config.host || 'localhost';
app.set('port', port);
app.set('host', host);

if (process.env.NODE_ENV != 'mocha') {
    var server = createServer();
    serverListen(server);
}


/**
 * Create server.
 */
function createServer() {
  if (config.protocol == "https")
    var protocol = "https";
  else
    var protocol = "http";

  var server:any;

  if (protocol == "https") {
    var ssl_options = {
      key: fs.readFileSync(config.ssl_key),
      cert: fs.readFileSync(config.ssl_cert)
    };
    server = https.createServer(ssl_options, app);
  } else {
    server = http.createServer(app);
  }

  return server;
}

/**
 * Listen on provided port, on all network interfaces.
 */
function serverListen(server) {
  server.listen(port, host, function() {
    console.log("Server listening on " + config.protocol + "://" + host + ":" + port);
  });
  server.on('error', onError);
  server.on('listening', onListening);
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

export = app;
