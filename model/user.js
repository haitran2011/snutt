var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = new mongoose.Schema({
  local            : {
    // id should not be unique, because non-active user can have same id
    id          : String,
    password    : String
  },
  facebook         : {
    id           : String,
    token        : String
  },
	isAdmin: {type: Boolean, default: false},
	regDate: {type: Date, default: Date.now()},

  // if the user remove its account, active status becomes false
  // Should not remove user object, because we must preserve the user data and its related objects
  active: {type: Boolean, default: true}
});

UserSchema.pre('save', function (callback) {
	var user = this;

  if (user.id.replace(/[a-z0-9]{3,32}/i, '') !== '')
		return callback(new Error("ID rule violated"));

	if (!user.isModified('local.password')) return callback();

	bcrypt.hash(user.local.password, 4, function (err, hash) {
		if (err) return callback(err);

		user.local.password = hash;
		callback();
	});
});

UserSchema.methods.verify_password = function(password, cb) {
	bcrypt.compare(password, this.local.password, function(err, isMatch) {
		if (err) return cb(err);
		cb(null, isMatch);
	});
};

UserSchema.statics.get_local = function(id, callback) {
  mongoose.model('User').findOne({'local.id' : id }, callback);
};

UserSchema.statics.create_local = function(id, password, callback) {
  var User = mongoose.model('User');
  User.get_local(id, function(err, user) {
    if (err) return callback(err);
    if (user) return callback(new Error("same id already exists"));
    user = new User({
      local : {
        id : id,
        password: password
      }
    });
    user.save(callback);
  });
};

module.exports = mongoose.model('User', UserSchema);