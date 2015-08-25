var assert = require('assert');
var f = require('../data/snutt/import_txt_utils').time_str_to_array;

var empty_schedule = [];
for(var i = 0; i < 6; i++) {
	empty_schedule.push({ start: 0, len: 0});
}

var fri1_3 = JSON.parse(JSON.stringify(empty_schedule));
var mon6_3 = JSON.parse(JSON.stringify(empty_schedule));

fri1_3[4] = {start: 1, len: 3};
mon6_3[0] = {start: 6, len: 3};


describe('timeConvert', function() {
	it("금(1-2)/금(3-1) => 금1-3", function() {
		assert.equal(JSON.stringify(fri1_3), 
			JSON.stringify(f("금(1-2)/금(3-1)")));
	});
	it("월(6-3) => 금6-3", function() {
	assert.equal(JSON.stringify(mon6_3), 
		JSON.stringify(f("월(6-3)")));
	});
});
