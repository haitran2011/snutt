var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/snuttdb', function () {
	console.log('mongodb connected')
})
module.exports = mongoose
