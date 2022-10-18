var trimDay = (dt) => {
	var wdate = new Date(dt);
	var wday = ("0" + wdate.getDate()).slice(-2);
	var wmonth = ("0" + (wdate.getMonth() + 1)).slice(-2);
	var wtoday = wdate.getFullYear() + "-" + wmonth + "-" + wday;

	return wtoday;
};

var getDaysArray = function (start, end) {
	for (
		var arr = [], dt = new Date(start);
		dt <= new Date(end);
		dt.setDate(dt.getDate() + 1)
	) {
		arr.push(trimDay(dt));
	}
	return arr;
};

function remove_duplicates_safe(arr) {
	var seen = {};
	var ret_arr = [];
	for (var i = 0; i < arr.length; i++) {
		if (!(arr[i] in seen)) {
			ret_arr.push(arr[i]);
			seen[arr[i]] = true;
		}
	}
	return ret_arr;
}

function getMonday(d) {
	d = new Date(d);
	var day = d.getDay(),
		diff = d.getDate() - day + (day == 0 ? -6 : 1);
	var newdate = new Date(d.setDate(diff));
	newdate.setUTCHours(0, 0, 0);
	return newdate.toISOString();
}

function getWeekFromDay(d) {
	var monday = getMonday(d);
	d = new Date(getMonday(d));
	d.setDate(d.getDate() + 4);
	d = d.toISOString();

	return getDaysArray(monday, d);
}

function populateDay(data, day) {
	const day_cal = $(`#cal_${day}`);
	day_cal.empty();

	if (data.element.length > 0) {
		data.element.sort((a, b) =>
			a.start > b.start ? 1 : b.start > a.start ? -1 : 0
		);

		data.element.forEach((lecture) => {
			day_cal.append(`
                <li>
                    <div class="card">
                        <div class="container">
                            <h4 class="lecture-title"><b>${lecture.title}</b></h4>
                            <h4 class="lecture-time"><b>${lecture.time}</b></h4>
                            <p class="lecture-location">${lecture.aule[0].des_edificio}</p>
                            <p>${lecture.aule[0].des_ubicazione}</p>
                        </div>
                    </div> 
                </li>
            `);
		});
	} else {
		day_cal.append(`
            <li>
                <div class="card">
                    <div class="container">
                        <h4 class="lecture-location"><b>Spare Day!</b></h4>
                    </div>
                </div> 
            </li>
        `);
	}
}

function populateWeek(data) {
	populateDay(data[0], "mon");
	populateDay(data[1], "tue");
	populateDay(data[2], "wed");
	populateDay(data[3], "thu");
	populateDay(data[4], "fri");
}

function getOffset(el) {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
  }

$(document).ready(() => {
	var cks = new Array();

	var now = new Date();
	var day = ("0" + now.getDate()).slice(-2);
	var month = ("0" + (now.getMonth() + 1)).slice(-2);
	var today = now.getFullYear() + "-" + month + "-" + day;

	var days = [];

	lessons = [];
	$("#date_start").val(today);

	const loadContent = () => {
		lessons = [];
		$.getJSON("src/courses_data.json", function (json) {
			const row = $("#courses_list");
			row.empty();

			json.Curricula.forEach((curricula) => {
				curricula.url.forEach((url) => {
					if (url.uri) {
						$.get(url.uri, (data, status, xhr) => {
							var tmp = data;
							lessons = lessons.concat(tmp);
						});
					}
				});
				row.append(`
                    <li id="${curricula.name}"><br></li>
                `);
			});

			json.Curricula.forEach((curricula) => {
				const curricula_row = $(`#${curricula.name}`);

				curricula_row.append(`
                <details>
                    <summary>
                        <input
                            type="checkbox"
                            id="${curricula.name}_check"
                            name="${curricula.name}_check"  
                            value="${curricula.name}" 
                            class="curricula-check checker" 
                        />
                        <label for="#${curricula.name}_check">Curricula ${curricula.name}</label>
                    </summary>

					<div class="curricula-courses">
                        <ul id="curricula_${curricula.name}_ul"></ul>
                    </div>
                </details>`);
				const curr_ul = $(`#curricula_${curricula.name}_ul`);

				curricula.courses.forEach((el) => {
					curr_ul.append(`
                        <li>
                        <input
                        type="checkbox"
                        id="curricula_${curricula.name}_${el.cod_modulo}"
                        name="${el.cod_modulo}"
                        value="${el.cod_modulo}"
                        class="course-check checker"
                        />
                        <label for="${el.cod_modulo}">${el.cod_modulo} - ${el.name}</label>
                        </li>`);
				});
			});
		});
	};

	$("body").on("change", "input[type=checkbox]", function (ev) {
		if (ev.currentTarget.classList.toString().includes("curricula-check")) {
			console.log("blbl");
			const lista = $(
				`#curricula_${ev.currentTarget.value.toString()}_ul`
			);

			for (let item of lista[0].children) {
				const check_item = $(`#${item.children[0].id}`);
				check_item.prop("checked", ev.currentTarget.checked);
			}
		}
	});

	$("#btn").on("click", (ev) => {
		cks = [];

		const course_checks = $(".course-check");

		course_checks.each((element) => {
			if (course_checks[element].checked) {
				cks.push(course_checks[element].value);
			}
		});

		days = [];
		var data_filter = [];
		cks.forEach((check) => {
			data_filter = data_filter.concat(
				lessons.filter((element) => element.cod_modulo.includes(check))
			);
		});

		const arrUniq = [
			...new Map(data_filter.map((v) => [JSON.stringify(v), v])).values(),
		];

		var week = getWeekFromDay($("#date_start").val());

		week.forEach((element) => {
			days.push({
				element: arrUniq.filter((lecture) =>
					lecture.start.includes(element)
				),
			});
		});

		populateWeek(days);

        const current_day = $(`.cal-label`)
        window.scrollTo(getOffset(current_day[now.getDay()-1]));
	});

	loadContent();
});
