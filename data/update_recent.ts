const db = require('../db');
import {CourseBookModel, CourseBookDocument} from '../model/courseBook';
import {import_txt} from './import_txt';
import cp = require('child_process');

function semesterToString(semester:number):string {
  switch(semester) {
    case 1:
    return '1';
    case 2:
    return 'S';
    case 3:
    return '2';
    case 4:
    return 'W';
    default:
    return '?';
  }
}

async function getUpdateCandidate():Promise<any[]> {
  try {
    var recentCoursebook = await CourseBookModel.getRecent();
    var year = recentCoursebook.year;
    var semester = recentCoursebook.semester;

    var nextYear = year;
    var nextSemester = semester + 1;
    if (nextSemester > 4) {
      nextYear++;
      nextSemester = 0;
    }

    return [[year, semesterToString(semester)],
    [nextYear, semesterToString(nextSemester)]];
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function fetch_sugang_snu(year:number, semester:string):Promise<void> {
  return new Promise<void>(function(resolve, reject) {
    let child = cp.spawn('ruby', ['fetch.rb', year.toString(), semester]);

    child.stdout.on('data', (data) => {
      console.log(`${data}`);
    });

    child.stderr.on('data', (data) => {
      console.error(`${data}`);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(`Child process exit with ${code}`);
      }
      resolve();
    });
  })
}

async function main() {
  var cands = await getUpdateCandidate();
  for (let i=0; i<cands.length; i++) {
    try {
      console.log("Fetching", cands[i][0], cands[i][1])
      await fetch_sugang_snu(cands[i][0], cands[i][1]);
      console.log("Importing", cands[i][0], cands[i][1])
      await import_txt(cands[i][0], cands[i][1]);
    } catch (err) {
      console.error(err);
      console.log("Failed");
      continue;
    }
  }
  process.exit(0);  
}

if (!module.parent) {
  main();
}
