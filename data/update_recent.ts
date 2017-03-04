const db = require('../db');
import {CourseBookModel} from '../model/courseBook';
import {import_txt} from './import_txt';
import * as cp from "child_process";

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

async function getUpdateCandidate():Promise<[[number, string]]> {
  try {
    let recentCoursebook = await CourseBookModel.getRecent();
    let year = recentCoursebook.year;
    let semester = recentCoursebook.semester;

    let nextYear = year;
    let nextSemester = semester + 1;
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
    let child = cp.spawn('ruby', ['fetch.rb', year.toString(), semester], {
      cwd: __dirname
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(`${data}`);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(`${data}`);
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
  let cands = await getUpdateCandidate();
  for (let i=0; i<cands.length; i++) {
    let year = cands[i][0];
    let semester = cands[i][1];
    try {
      await fetch_sugang_snu(year, semester);
      await import_txt(year, semester);
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
