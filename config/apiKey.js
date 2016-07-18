/**
 * apiKey.js
 * Jang Ryeol, ryeolj5911@gmail.com
 *
 * credential field for making tokens
 * thus, magic_number means nothing
 *
 * --- To reissue token for specific platform
 *    (e.g. platform api-key stolen),
 * just change the magic number to invalidate all tokens from the platform.
 *
 * --- To issue api tokens,
 * $ node apiKey.js list
 */
var jwt = require('jsonwebtoken');
var secretKey = require('./secretKey');

var api_list = {
    ios : {
      string : "ios",
      magic_number : "0"
    },
    web : {
      string : "web",
      magic_number : "0"
    },
    android : {
      string : "android",
      magic_number : "0"
    },
    test : {
      string : "test",
      magic_number : "0"
    }
};

var issueKey = function(api_obj) {
  return jwt.sign(api_obj, secretKey.jwtSecret);
};

/**
 * validate api key
 * @param api_key
 * @returns {Promise}
 */
var validateKey = function(api_key) {
  return new Promise(function(resolve, reject){
    jwt.verify(api_key, secretKey.jwtSecret, function(err, decoded) {
      if (err) return reject("invalid key");
      if (!decoded.string || !decoded.magic_number) return reject("invalid key");
      if (api_list[decoded.string] &&
        api_list[decoded.string].magic_number == decoded.magic_number)
        return resolve();
    });
  })
};

if (process.argv.length != 3 || process.argv[2] != "list") {
  console.log("Invalid arguments");
  console.log("usage: $ node apiKey.js list");
  process.exit(1);
}

for (var api in api_list) {
  if (api_list.hasOwnProperty(api)) {
    console.log(api_list[api].string);
    console.log("\n"+issueKey(api_list[api])+"\n");
  }
}

module.exports = {validateKey : validateKey};