import fs = require('fs');
import {insert_course} from './update_lectures';

export async function importFromString(str_txt:string, year:number, semester:string,
    fcm_enabled:boolean):Promise<void> {
	var lines = str_txt.split("\n");
	var header = lines.slice(0, 3);
	var courses = lines.slice(3);

	if ((year && year != parseInt(header[0].split("/")[0].trim())) ||
			(semester && semester != header[0].split("/")[1].trim())) {
		return Promise.reject("Textfile does not match with given parameter");
	}
	var semesterIndex = ['1', 'S', '2', 'W'].indexOf(semester) + 1;
	await insert_course(courses, year, semesterIndex, fcm_enabled);
	return;
}

export function importFromFile(year:number, semester:string, fcm_enabled:boolean):Promise<void> {
	var datapath = __dirname + "/txt/"+year+"_"+semester+".txt";
	return new Promise<void>(function(resolve, reject) {
		fs.readFile(datapath, function (err, data) {
			if (err) {
				return reject(err);
			}
			return importFromString(data.toString(), year, semester, fcm_enabled).then(function(result) {
				resolve(result);
			}).catch(function(reason) {
				reject(reason);
			});
		});
	});
}

if (!module.parent) {
	if (process.argv.length != 4) {
		console.log("Invalid arguments");
		console.log("usage: $ node import_txt.js 2016 1");
		process.exit(1);
	}
	var year = Number(process.argv[2]);
	var semester = process.argv[3];
	console.log("Importing " + year + " " + semester);
	importFromFile(year, semester, true).then(function(){
		process.exit();
	}).catch(function(reason){
		console.error(reason);
		process.exit(1);
	});
}
