import 'whatwg-fetch';

import * as types from './actionTypes';
import { CALL_API } from '../middleware/api';
import { FETCH_TAG, GET_TAG, FAIL_TAG } from './actionTypes';
import { baseUrl, apiKey } from '../samples/sampleKey';
import { fetchTableList } from './tableActions';
import { loginWithToken } from './userActions';
import request from './request';

// Entry point of all fetching actions
export function updateCoursebook() {
  return function (dispatch) {
    request('course_books', {
      method: 'get',
    })
    .then(json => dispatch(fetchCoursebook(json)));
  };
}

// Not sure whether dispatching multiple actions at once is good practice...
export function fetchCoursebook(courseBooks) {
  return function (dispatch) {
    const recentBook = courseBooks[0];
    dispatch(changeCoursebook(recentBook));
    dispatch({ type: types.FETCH_COURSEBOOK, courseBooks });
  };
}

// Set of actions that should be along with new coursebook
export function changeCoursebook(newCourseBook) {
  return function (dispatch, getState) {
    const { year: newYear, semester: newSemester } = newCourseBook;
    dispatch(updateTag(newYear, newSemester));
    dispatch({ type: types.CHANGE_COURSEBOOK, newCourseBook });

    if (getState().user.loggedIn) { dispatch(fetchTableList(newYear, newSemester)); } else {
      // If not logged in, check existing token or get temporary one
      loginWithToken(dispatch);
    }
  };
}

export function updateTag(year, semester) {
  return {
    [CALL_API]: {
      endpoint: `tags/${year}/${semester}`,
      config: { method: 'get' },
      types: [FETCH_TAG, GET_TAG, FAIL_TAG],
    },
  };
}