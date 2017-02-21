var Lecture = require('../../model/_lecture')
var QueryLog = require('../../model/queryLog')
module.exports = function(params, renderer, request) {

	//something similar to LIKE query in SQL
	function like(str, first_char) {
		//replace every character(eg. 'c') to '.+c', except for first character
		var reg = str.replace(/(?!^)(.)/g, '.*$1');
		if (first_char)
			reg = '^' + reg;
		return new RegExp(reg, 'i');
	}

	var query = new Object();
	query.year = params.year;
	query.semester = params.semester;
	if (params.type == 'course_title') {
		query.course_title = like(params.query_text, false);
	} else if (params.type == 'department') {
		query.department = like(params.query_text, false);
	} else if (params.type == 'instructor') {
		query.instructor = new RegExp(params.query_text, 'i');
	} else if (params.type == 'class_time') {
		query.class_time = new RegExp(params.query_text);
	} else if (params.type == 'course_number') {
		var time_query = params.query_text.split(" ");
		query.course_number = time_query[0];
		if (time_query.length > 1)
			query.lecture_number = time_query[1];
	}

	// save query
	var queryLog = new QueryLog({ year: query.year, semester: query.semester, type: params.type, body: params.query_text })
	queryLog.save();

	Lecture.find(query).sort('course_number').lean().exec(function (err, lectures) {
		if (err)
			console.log(err)

		var res = new Object();
		res.lectures = lectures;
		return renderer.json(res);
	})
}
