//timetable header & footer
var timetable_header = fs.readFileSync(ROOT_VIEW_PATH + "/timetable_header.htm");
var timetable_footer = fs.readFileSync(ROOT_VIEW_PATH + "/timetable_footer.htm");
var user_timetable_header = fs.readFileSync(ROOT_VIEW_PATH + "/user_timetable_header.htm");
var user_timetable_footer = fs.readFileSync(ROOT_VIEW_PATH + "/user_timetable_footer.htm");

module.exports = {
    home: function(params, renderer, request){
        // 시간표 짜기
        if (params.user){
            fs.readFile(USER_TIMETABLE_PATH + "/" + params.user, function(err, content){
                if (err){
                    renderer.text('ERROR');
                }
                else {
                    renderer.text(timetable_header + content + timetable_footer);
                }
            });
        } else {
            renderer.text(timetable_header + timetable_footer);
        }
    },

    show: function(params, renderer, request){
        // 저장된 시간표 불러오기 (보기모드)
        fs.readFile(USER_TIMETABLE_PATH + "/" + params.id, function(err, content){
            if (err){
                renderer.text('ERROR');
            }
            else {
                renderer.text(user_timetable_header + content + user_timetable_footer);
            }
        });

    }
};