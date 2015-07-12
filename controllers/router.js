var Router = require('routes');
var config = require('./../config.js');

// load model
var NaiveLectureModel = require('./../model/naive_snutt_data.js').NaiveLectureModel;
var lectureModel = new NaiveLectureModel();
lectureModel.init();

// load controllers
var controllers = require('./../controllers/controllers.js').functor(config, "snutt", lectureModel);

// register router
var router = Router();
// api
router.addRoute("/api/init_client", controllers.api_controller.initClient);
router.addRoute("/api/search_query?", controllers.api_controller.searchQuery);
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

module.exports = router;