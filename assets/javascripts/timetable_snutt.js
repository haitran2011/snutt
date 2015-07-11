//강의계획서 보기
function course_detail_plan_button_handler(){
	var ele = $(this);
	show_course_detail({
		year:current_year,
		semester:current_semester,
		course_number:ele.attr('course-number'),
		lecture_number:ele.attr('lecture-number')
	});
}

function set_dropdown_handler(){
	//search type 설정
	//교과목명
	$('#stype_course_title').click(function(){
		$('#stype_dropdown_label').text("과목 이름");
		$('#search_query_text').attr('placeholder', "예) 수및연");
		search_type = "course_title";
		$('#search_query_text').focus().val("");
	});
	//교수명
	$('#stype_instructor').click(function(){
		$('#stype_dropdown_label').text("교수명");
		$('#search_query_text').attr('placeholder', "예) 아이유");
		search_type = "instructor";
		$('#search_query_text').focus().val("");
	});
	//교과목번호
	$('#stype_course_number').click(function(){
		$('#stype_dropdown_label').text("과목 번호");
		$('#search_query_text').attr('placeholder', "예) 4190.310 001");
		search_type = "course_number";
		$('#search_query_text').focus().val("");
	});
	//수업교시
	$('#stype_class_time').click(function(){
		$('#stype_dropdown_label').text("수업교시");
		$('#search_query_text').attr('placeholder', "예) 월1,5, 월6, 금");
		search_type = "class_time";
		$('#search_query_text').focus().val("");
	});
	//수업교시
	$('#stype_department').click(function(){
		$('#stype_dropdown_label').text("개설학과");
		$('#search_query_text').attr('placeholder', "예) 컴공");
		search_type = "department";
		$('#search_query_text').focus().val("");
	});
}

function get_filter()
{
	if ($('#search_filter_toggle_button').attr('state') == 'off') return null;
	var result = {};
	//학년
	var academic_year = [];
	$('#filter_academic_year .label-info').each(function(i){
		academic_year.push($(this).attr('value'));
	});
	if (academic_year.length > 0)
		result.academic_year = academic_year;

	//학점
	var credit = [];
	$('#filter_credit .label-info').each(function(i){
		credit.push($(this).attr('value'));
	});
	if (credit.length > 0)
		result.credit = credit;

	//학문의 기초
	var basics = [];
	$('#filter_basics .label-info').each(function(i){
		basics.push($(this).attr('value'));
	});
	if (basics.length > 0)
		result.basics = basics;

	//핵심 교양
	var core = [];
	$('#filter_core .label-info').each(function(i){
		core.push($(this).attr('value'));
	});
	if (core.length > 0)
		result.core = core;

	//기타
	var etc = [];
	$('#filter_etc .label-info').each(function(i){
		etc.push($(this).attr('value'));
	});
	if (etc.length > 0)
		result.etc = etc;

	return result;
}

function refresh_course_detail(selected_lecture)
{
	$('#course_detail_wrapper #course_detail_title').text(s(selected_lecture.course_title)+" "+s(selected_lecture.lecture_number)+" "+s(selected_lecture.instructor));
	$('#course_detail_wrapper .remark').text(s(selected_lecture.remark));
	$('#course_detail_plan_button').attr('course-number', selected_lecture.course_number);
	$('#course_detail_plan_button').attr('lecture-number', selected_lecture.lecture_number);
	$('#course_detail_wrapper').fadeIn();
}

function category_to_text(category)
{
	if (category == "basics") return "학문의 기초 - 학문의 기초";
	if (category == "basics_foreign") return "학문의 기초 - 외국어와 외국문화";
	if (category == "basics_korean") return "학문의 기초 - 국어와 작문";
	if (category == "basics_science") return "학문의 기초 - 기초과학";
	if (category == "core_art") return "핵심교양 - 문학과 예술";
	if (category == "core_biology") return "핵심교양 - 생명과 환경";
	if (category == "core_history") return "핵심교양 - 역사와 철학";
	if (category == "core_nature") return "핵심교양 - 자연의 이해";
	if (category == "core_society") return "핵심교양 - 사회와 이념";
	if (category == "core_technology") return "핵심교양 - 자연과 기술";
	if (category == "normal_art") return "일반교양 - 문학과 예술";
	if (category == "normal_exercise") return "일반교양 - 체육 및 기타";
	if (category == "normal_foreign") return "일반교양 - 외국어와 외국문화";
	if (category == "normal_history") return "일반교양 - 역사와 철학";
	if (category == "normal_korean") return "일반교양 - 국어와 작문";
	if (category == "normal_nature") return "일반교양 - 자연의 이해";
	if (category == "normal_science") return "일반교양 - 기초과학";
	if (category == "normal_society") return "일반교양 - 사회와 이념";
	if (category == "normal_special") return "일반교양 - 기초교육 특별프로그램";
	return category;
}

function refresh_my_courses_table()
{
	$('#my_courses_table tbody').children().remove();
	var credit = 0;
	for (var i=0;i<my_lectures.length;i++){
		var lecture = my_lectures[i];
		credit += parseInt(lecture.credit);
		var row = $('<tr></tr>').attr('course-number', lecture.course_number).attr('lecture-number', lecture.lecture_number);
		$('<td class="hidden-xs"></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		$('<td class="hidden-xs"></td>').addClass('lecture-number').appendTo(row).text(lecture.lecture_number);
		var course_title = $('<td class="hidden-xs"></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td class="hidden-xs"></td>').addClass('classification').appendTo(row).text(lecture.classification);
		$('<td class="hidden-xs"></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td class="hidden-xs"></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td class="hidden-xs"></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td class="hidden-xs"></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td class="hidden-xs"></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td class="hidden-xs"></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td class="hidden-xs"></td>').addClass('quota').appendTo(row).text(lecture.quota);
		
		//For mobile
		var mobile_str = "<b>"+lecture.course_title+"</b>";
		if (lecture.instructor) mobile_str+=" / <b>"+lecture.instructor+"</b>";
		//if (lecture.class_time) mobile_str+=" / "+lecture.class_time;
		//if (lecture.location) mobile_str+=" / "+simplify_location(lecture.location);
		mobile_str+=" / "+lecture.course_number+", "+lecture.lecture_number;
		mobile_str+=" / "+lecture.credit+"학점";
		mobile_str+=" / "+lecture.department+" "+lecture.academic_year+" "+lecture.classification;
		mobile_str+=" / 정원 "+lecture.quota+"명";
		$('<td class="mobile-info visible-xs"></td>').appendTo(row).html(mobile_str);

		row.appendTo($('#my_courses_table tbody'));
		//bind row click event
		row.click(my_courses_row_click_handler);
		//bind row dblclick event
		row.dblclick(function(){
			my_courses_row_dblclick_handler($(this));
		});
		row.addSwipeEvents().bind('doubletap', function(evt, touch) {
			my_courses_row_dblclick_handler($(this));
		})

	}

	if (my_lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#my_courses_table tbody'));
		$('<td colspan="13"><h2>선택된 강의가 없습니다.</h2></td>').appendTo(row).css('text-align', 'center');
	}
	//총 학점 갱신
	$('.badge-info').text(credit+"학점");
	my_courses_selected_row = null;
	if (selected_row) {
		selected_row.removeClass('selected');
		$("#course_detail_wrapper").fadeOut();
	}
}

//TODO : duplicate code
function set_result_table(data)
{
	$('#search_result_table tbody').children().remove();
	$('#lectures_content').scrollTop(0);
	if (selected_row) selected_row.removeClass('selected');
	selected_row = null;
	lectures = [];
	
	lectures = lectures.concat(data.lectures);
	for (var i=0;i<data.lectures.length;i++){
		var lecture = data.lectures[i];
		var row = $('<tr></tr>').attr('course-number', lecture.course_number).attr('lecture-number', lecture.lecture_number);
		$('<td class="hidden-xs"></td>').addClass('course-number').appendTo(row).text(lecture.course_number);
		$('<td class="hidden-xs"></td>').addClass('lecture-number').appendTo(row).text(lecture.lecture_number);
		var course_title = $('<td class="hidden-xs"></td>').addClass('course-title').appendTo(row).text(lecture.course_title+" ");
		$('<td class="hidden-xs"></td>').addClass('classification').appendTo(row).text(lecture.classification);
		$('<td class="hidden-xs"></td>').addClass('department').appendTo(row).text(lecture.department);
		$('<td class="hidden-xs"></td>').addClass('academic-year').appendTo(row).text(lecture.academic_year);
		$('<td class="hidden-xs"></td>').addClass('credit').appendTo(row).text(lecture.credit);
		$('<td class="hidden-xs"></td>').addClass('class-time').appendTo(row).text(simplify_class_time(lecture.class_time));
		$('<td class="hidden-xs"></td>').addClass('location').appendTo(row).html(simplify_location(lecture.location));
		$('<td class="hidden-xs"></td>').addClass('instructor').appendTo(row).text(lecture.instructor);
		$('<td class="hidden-xs"></td>').addClass('quota').appendTo(row).text(lecture.quota);
		
		//For mobile
		var mobile_str = "<b>"+lecture.course_title+"</b>";
		if (lecture.instructor) mobile_str+=" / <b>"+lecture.instructor+"</b>";
		//if (lecture.class_time) mobile_str+=" / "+lecture.class_time;
		//if (lecture.location) mobile_str+=" / "+simplify_location(lecture.location);
		mobile_str+=" / "+lecture.course_number+", "+lecture.lecture_number;
		mobile_str+=" / "+lecture.credit+"학점";
		mobile_str+=" / "+lecture.department+" "+lecture.academic_year+" "+lecture.classification;
		mobile_str+=" / 정원 "+lecture.quota+"명";
		$('<td class="mobile-info visible-xs"></td>').appendTo(row).html(mobile_str);

		row.appendTo($('#search_result_table tbody'));
		//bind row click event
		row.click(row_click_handler);
		//bind row dblclick event
		row.dblclick(function(){
			row_dblclick_handler($(this));
		});
		row.addSwipeEvents().bind('doubletap', function(evt, touch) {
			row_dblclick_handler($(this));
		})
	}
	if (data.lectures.length == 0){
		var row = $('<tr></tr>').appendTo($('#search_result_table tbody'));
		$('<td colspan="13"><h2>검색 결과가 없습니다 :(</h2></td>').appendTo(row).css('text-align', 'center');
	}
}

function show_course_detail(options)
{
	var year = options.year;
	var semester = options.semester;
	var course_number = options.course_number;
	var lecture_number = options.lecture_number;

  var openShtmFg = null, openDetaShtmFg = null;
  if (semester == "1"){
    openShtmFg = "U000200001";
    openDetaShtmFg = "U000300001";
  } else if (semester == "2"){
    openShtmFg = "U000200002";
    openDetaShtmFg = "U000300001";
  } else if (semester == "S"){
    openShtmFg = "U000200001";
    openDetaShtmFg = "U000300002";  
  } else if (semester == "W"){
    openShtmFg = "U000200002";
    openDetaShtmFg = "U000300002";
  }

  var url = "http://sugang.snu.ac.kr/sugang/cc/cc103.action?openSchyy="+year+"&openShtmFg="+openShtmFg+"&openDetaShtmFg="+openDetaShtmFg+"&sbjtCd="+course_number+"&ltNo="+lecture_number+"&sbjtSubhCd=000";

	window.open(url);
}
