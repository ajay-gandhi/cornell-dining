<?php
session_start();
require('includes/functions.php');
require('includes/data.php');

if (isset($_POST['time']) && is_numeric($_POST['time']) && intval($_POST['time']) <= 2359 && $_SESSION['password'] == "cornellbigredftw") {

$where = "";
$open_halls = array();
$open_times = array();
$close_times = array();
$halls = array("104west","amit_bhatia_libe_cafe","atrium_cafe","bear_necessities","bears_den","becker_house_dining_room","big_red_barn",
	"cafe_jennie","carols_cafe","cascadeli","cascadeli_delivers","cook_house_dining_room","cornell_dairy_bar","goldies","green_dragon",
	"ivy_room","jansens_dining_room,_bethe_house","jansens_market","keeton_house_dining_room","marthas_cafe","mattins_cafe","north_star",
	"okenshields","one_world_cafe","risley_dining","robert_purcell_marketplace_eatery","rose_house_dining_room","rustys","synapsis_cafe",
	"trillium","trillium_express","west_side_express");
foreach ($halls as $hall) {
	/* Which eatery, get the mealtime data. Soon to be dynamic :) */
	$json = file_get_contents("http://api-mrkev.rhcloud.com/redapi/cal?" . $hall);
	$decoded = json_decode($json, true);
	$events = $decoded["events"];

	/* Get the day, month, year for which the user wants the data.
	 * Default values are current day. */
	$day = intval($_POST['day']);
	$month = intval($_POST['month']);
	$year = intval($_POST['year']);

	/* Find matching data in the parsed JSON. */
	$results = array();
	$times = array();
	$days = array("SU", "MO", "TU", "WE", "TH", "FR", "SA");
	$cur_day = $days[date('w', mktime(0, 0, 0, $month, $day, $year))];
	foreach ($events as $event) {
		$cur_date = $year . $month . $day;
		$start_date = str_replace('-', '', substr($event["start"], 0, 10));
		$end_date = str_replace('-', '', substr($event["end"], 0, 10));
	
		if ($cur_date >= $start_date && $cur_date <= $end_date) { //Is date included in a span?
			$results[$hall][] = $event["summary"] . "<br />";
			$times[$hall][] = $event["start"];
			$times[$hall][] = $event["end"];
		} else if (array_key_exists("rrule", $event)) {
			if ($event["rrule"]["FREQ"] == "DAILY") {
				$rep_days = $days;
			} else {
				$rep_days = explode(',', $event["rrule"]["BYDAY"]);
			}
			if (array_search($cur_day, $rep_days) !== false) { //Is day of the week included in a repetition?
				if (isset($event["rrule"]["UNTIL"])) { //If "UNTIL" is included, is the day included in the span?
					$end_date = substr($event["rrule"]["UNTIL"], 0, 8);
					$formatted_date = $year . "-" . $month . "-" . $day;
					if (isset($event["rexcept"])) {
						$excepted = array_search_part($formatted_date, $event["rexcept"]);
					} else {
						$excepted = false;
					}
					if ($cur_date >= $start_date && $cur_date <= $end_date && $excepted == false) {
						$results[$hall][] .= $event["summary"] . "<br />";
						$times[$hall][] = $event["start"];
						$times[$hall][] = $event["end"];
					}
					$cont = true;
				} else { //If no "UNTIL" exists, assume it's the right one :)
					$results[$hall][] = $event["summary"] . "<br />";
					$times[$hall][] = $event["start"];
					$times[$hall][] = $event["end"];
				}
			}
		}
	}

	foreach ($results as $hall => $halldata) {
		$temp_info = "";
		foreach ($halldata as $rkey => $summary) {
			if (strpos($summary, "Closed") === false) {
				/* Format times from given data,
				 * then check if current time is inside any intervals. */

				//Get the actual time from the data and sep into hours and mins
				$open = intval(str_replace(':', '', substr(reset(explode('.', end(explode('T', $times[$hall][$rkey * 2])))), 0, 5)));
				$close = intval(str_replace(':', '', substr(reset(explode('.', end(explode('T', $times[$hall][($rkey * 2) + 1])))), 0, 5)));

				/* UGH
				 * Have to edit times dynamically (not hardcoded to 4 hrs) */
				$open_num = time_to_number($open);
				$close_num = time_to_number($close);
				$end_time = time_to_number(intval(preg_replace("/[^0-9]/", "", $summary)));
				if (empty($end_time)) {
					$end_time = $close_num - 300;
				}
				if ($end_time < 12) {
					$end_time *= 100;
				}
				if (strpos($summary, "pm") !== false) {
					$end_time += 1200;
				}
				$open_num -= $close_num - $end_time;
				$close_num = $end_time;

				$open = number_to_time($open_num);
				$close = number_to_time($close_num);
				/* End time edits */

				/* Finished getting and formatting time,
				 * now check if current time is in interval. */
				$current_time = intval($_POST['time']);
				if ($current_time <= $close && $current_time >= $open) {
					$open_halls[] = $hall;
					$open_times[] = sanitize_time($open);
					$close_times[] = sanitize_time($close);
				} else {
					if ($close < $open) {
						if ($current_time <= $close || $current_time >= $open) {
							$open_halls[] = $hall;
							$open_times[] = sanitize_time($open);
							$close_times[] = sanitize_time($close);
						}
					}
				}

				/* Add the info to output */
				$temp_info .= $summary . $open . " - " . $close . "<br /><br />";
			}
		}
		if ($temp_info != "") {
			$temp_info = "<h3>" . $pretty_names[$hall] . ":</h3>" . $temp_info;
			$where .= $temp_info;
		}
	}
}

$_SESSION['password'] = "";
$_SESSION['open_halls'] = implode(";", $open_halls);
$_SESSION['open_halls_open_times'] = implode(";", $open_times);
$_SESSION['open_halls_close_times'] = implode(";", $close_times);
foreach ($open_halls as $index => $open_hall) {
	$open_halls[$index] = $pretty_names[$open_hall];
}
if (empty($open_halls)) {
	echo "All of the eateries on campus are closed right now.";
} else {
	echo "Right now, you can eat at:<br />" . implode(", ", $open_halls);// . "<br /><br /><br /><hr /><br />" . $where;
}

} else {
	redirect();
}

/* Functions to conver from time to number.
 * E.g. 4:30 -> 450
 *      650  -> 6:30 */
function time_to_number($time) {
	$time = str_replace(":", "", $time);
	if (substr($time, strlen($time) - 2) == "30") {
		return ((intval($time / 100) * 100) + 50);
	} else {
		return $time;
	}
}

function number_to_time($number) {
	if ($number % 100 == 0) {
		$time = $number;
	} else {
		$time = ((intval($number / 100) * 100) - 70);
	}

	while ($time < 0) {
		$time += 2400;
	}
	while ($time > 2400) {
		$time -= 2400;
	}
	return $time;
}

function sanitize_time($time) {
	$hour = substr($time, 0, strlen($time) - 2);
	$min = substr($time, strlen($time) - 2);
	if ($hour > 12) {
		$hour -= 12;
		$suffix = "pm";
	} else {
		$suffix = "am";
	}
	return ($hour . ":" . $min . $suffix);
}

?>