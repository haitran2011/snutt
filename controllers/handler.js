var Cookies = require("cookies");
var deparam = require('node-jquery-deparam');
var url = require('url');
var _ = require("underscore");
var router = require('./router');

//http server handler
function handler (req, res) {
  req.url = req.url.replace("//","/"); // app is requesting /api//sugang.json... 
  var uri = url.parse(req.url).pathname;
  var params = deparam(url.parse(req.url).query);
  var cookies = new Cookies(req,res);
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

module.exports = handler;