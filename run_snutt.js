var url = require('url');
var path = require('path');
var fs = require('fs');
var deparam = require('node-jquery-deparam');
var Router = require('routes');
var mkdirp = require('mkdirp');
var _ = require("underscore");
var Cookies = require("cookies");
// config
var config = require('./config.js');

// make directories if not exist
mkdirp.sync(config.snutt.USER_IMAGE_PATH);
mkdirp.sync(config.snutt.USER_TIMETABLE_PATH);
mkdirp.sync(config.snutt.USER_ICS_PATH);

// load model
var NaiveLectureModel = require('./model/naive_snutt_data.js').NaiveLectureModel;
var lectureModel = new NaiveLectureModel();
lectureModel.init();
var cookies;
// load controllers
var controllers = require('./controllers/controllers.js').functor(config, "snutt", lectureModel);

// define application
var port = process.env.PORT || 3784;
var app = require('http').createServer(handler);
app.listen(port);
console.log("Listening on " + port);

// register router
var router = Router();
// api
router.addRoute("/api/init_client", controllers.api_controller.initClient);
router.addRoute("/api/search_query?", controllers.api_controller.searchQuery);
router.addRoute("/api/search_query_db?", require('./controllers/api/lecture'));
router.addRoute("/api/export_timetable?", controllers.api_controller.exportTimetable);
router.addRoute("/api/publish_to_facebook", controllers.api_controller.publishToFacebook)
// view
router.addRoute("/", controllers.home_controller.home);
router.addRoute("/member", controllers.home_controller.member);
router.addRoute("/user/:id", controllers.home_controller.show);
router.addRoute("/calendar/export", controllers.home_controller.export_cal);
// asset
router.addRoute("/asset/:name.:format", controllers.home_controller.asset);
router.addRoute("/asset/:path2/:name.:format", controllers.home_controller.asset);
router.addRoute("/user/asset/:name.:format", controllers.home_controller.asset);
router.addRoute("/user/asset/:path2/:name.:format", controllers.home_controller.asset);
// data for the mobile app - this is just a temporal fix
router.addRoute("/data/snutt/:name", controllers.home_controller.app_data);
router.addRoute("/api/:name", controllers.home_controller.json);

//http server handler
function handler (req, res) {
  req.url = req.url.replace("//","/"); // app is requesting /api//sugang.json... 
  var uri = url.parse(req.url).pathname;
  var params = deparam(url.parse(req.url).query);
  cookies = new Cookies(req,res);
  var renderer = {
    json:  function(hash, nostringfy) {
      res.writeHead(200, {"Content-Type": "application/json"});
      if (nostringfy) res.end(hash); 
      else res.end(JSON.stringify(hash)); //app doesn't work when JSON is stringfied...
    },
    zip: function(data, size) {
      res.writeHead(200, 
          {'Content-Type' : "application/zip",
           'Content-Length' : size }
      );
      res.end(data);
    },
    // TODO : deprecated, use generic instead
    text: function(data, mime) {
      if (mime) res.writeHead(200, {'Content-Type' : mime});
      else res.writeHead(200, {'Content-Type' : "text/html"});
      res.end(data);
    },
    generic: function(data, mime) {
      if (mime) res.writeHead(200, {'Content-Type' : mime});
      else res.writeHead(200, {'Content-Type' : "text/html"});
      res.end(data);
    },
    image: function (img, extension) { 
      res.writeHead(200, {'Content-Type' : "image/"+extension});
      res.end(img);
    },
    cal: function (ics) {
      res.writeHead(200, {
        'Content-Type' : "application/octet-stream",
        "Content-Disposition": "attachment; filename=snutt-calendar.ics"
      });
      res.end(ics);
    },
    cookies: cookies,
    err: function () {
      res.writeHead(404, {'Content-Type' : "text/html"});
      res.end("<h1>SNUTT</h1><br/><h5>페이지를 찾을 수 없습니다! 주소를 확인해주세요.</h5>");
    }
  };

  // router
  var route = router.match(uri);
  if (route) {
    _.extend(params, route.params);
    route.fn.apply(null, [params, renderer, req]);
  } 
  else renderer.err();
}
