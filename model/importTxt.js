var fs = require('fs');
var async = require('async');
var config = require('../config')
var Lecture = require('./_lecture')

if (process.argv.length != 4) {
	console.log("Invalid arguments")
	console.log("usage: $ node importTxt.js 2015 S");
	process.exit(1);
}

var year = Number(process.argv[2])
var semester = process.argv[3]
var datapath = config.snutt.ROOT_DATA_PATH + "/txt/"+year+"_"+semester+".txt";

fs.readFile(datapath, function (err, data) {
	if (err) {
		console.log('DATA LOAD FAILED: ' + year + '_' + semester);
		process.exit(1);
	}
	console.log("Importing " + year + " " + semester)

	var lines = data.toString().split("\n");
	var header = lines.slice(0, 3);
	var courses = lines.slice(3);

	if (year != header[0].split("/")[0].trim() || 
		semester != header[0].split("/")[1].trim()) {
		console.log("Textfile does not match with given parameter")
		process.exit(1);
	}
	var updated_time = header[1];

	//delete existing courserbook of input semester before update
	Lecture.remove({ year: year, semester: semester}, function(err) {
		if (err) 
			console.log(err)
		else {
			console.log("removed existing coursebook for this semester")
			insert_course(courses, year, semester, function(){
				process.exit(0);
			})
		}
	});
})

//TODO
function parse_class_time(str)
{
	var ret = new Object();
}

function insert_course(lines, year, semester, next)
{
	var cnt = 0, err_cnt = 0;
	/*For those who are not familiar with async.each
	async.each(elements, 
		funcForEachElement,
		funcEverythingIsDone
		)
	*/
	async.each(lines, function(line, callback) {
		var components = line.split(";");
		if (components.length == 1) {
			callback();
			return;
		}
		var lecture = new Lecture({
			year: Number(year),
			semester: semester,
			classification: components[0],
			department: components[1],
			academic_year: components[2],
			course_number: components[3],
			lecture_number: components[4],
			course_title: components[5],
			credit: Number(components[6]),
			class_time: components[7],
			location: components[8],
			instructor: components[9],
			quota: Number(components[10]),
			enrollment: Number(components[11]),
			remark: components[12],
			category: components[13]
		})
		lecture.save(function (err, lecture) {
			cnt++
			if (err) {
				console.log("Error with " + components)
				console.log(err)
				err_cnt++
			}
			process.stdout.write("Inserting " + cnt + "th course\r");
			callback();
		})
	}, function(err) {
		console.log("INSERT COMPLETE with " + eval(cnt-err_cnt) + " success and "+ err_cnt + " errors")
		next();
	})
}


