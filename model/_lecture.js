var db = require('../db')

var Lecture = db.model('Lecture', {
	year: { type: Number, required: true },
	semester: { type: String, required: true },
	classification: { type: String, required: true },
	department: String,
	academic_year: String,
	course_number: { type: String, required: true },
	lecture_number: String,
	course_title: { type:String, required: true },
	credit: Number,
	class_time: String,
	location: String,
	instructor: String,
	quota: Number,
	enrollment: Number,
	remark: String,
	category: String
})

module.exports = Lecture
