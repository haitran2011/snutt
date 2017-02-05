class ErrorCode {
  /* 500 - Server fault */
  static SERVER_FAULT = 0x0000;

  /* 400 - Request was invalid */
  static NO_FB_ID_OR_TOKEN = 0x1001;
  static NO_YEAR_OR_SEMESTER = 0x1002;
  static NOT_ENOUGH_TO_CREATE_TIMETABLE = 0x1003;
  static NO_LECTURE_INPUT = 0x1004;
  static NO_LECTURE_ID = 0x1005;
  static ATTEMPT_TO_MODIFY_IDENTITY = 0x1006;
  static NO_TIMETABLE_TITLE= 0x1007;
  static NO_REGISTRATION_ID = 0x1008;
  static INVALID_TIMEMASK = 0x1009;

  /* 401, 403 - Authorization-related */
  static WRONG_API_KEY = 0x2000;
  static NO_USER_TOKEN = 0x2001;
  static WRONG_USER_TOKEN = 0x2002;
  static NO_ADMIN_PRIVILEGE = 0x2003;
  static WRONG_ID = 0x2004;
  static WRONG_PASSWORD = 0x2005;
  static WRONG_FB_TOKEN = 0x2006;
  static UNKNOWN_APP = 0x2007;

  /* 403 - Restrictions */
  static INVALID_ID = 0x3000;
  static INVALID_PASSWORD = 0x3001;
  static DUPLICATE_ID = 0x3002;
  static DUPLICATE_TIMETABLE_TITLE = 0x3003;
  static DUPLICATE_LECTURE= 0x3004;
  static ALREADY_LOCAL_ACCOUNT = 0x3005;
  static ALREADY_FB_ACCOUNT = 0x3006;
  static NOT_LOCAL_ACCOUNT = 0x3007;
  static NOT_FB_ACCOUNT = 0x3008;
  static FB_ID_WITH_SOMEONE_ELSE = 0x3009;
  static WRONG_SEMESTER = 0x300A;
  static NOT_CUSTOM_LECTURE = 0x300B;
  static LECTURE_TIME_OVERLAP = 0x300C;
  static IS_CUSTOM_LECTURE = 0x300D;

  /* 404 - Not found */
  static TAG_NOT_FOUND = 0x4000;
  static TIMETABLE_NOT_FOUND = 0x4001;
  static LECTURE_NOT_FOUND = 0x4002;
  static REF_LECTURE_NOT_FOUND = 0x4003;
}

export = ErrorCode;