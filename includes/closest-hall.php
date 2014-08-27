<?php

session_start();
require('data.php');

if ($_SESSION['password'] == "cornellbigredftw" && isset($_POST['latitude']) && isset($_POST['longitude'])) {
	$open_halls = explode(';', $_SESSION['open_halls']);

	$distance = 1000000000;
	$hall = "";
	foreach ($open_halls as $index => $open_hall) {
		$url = "http://maps.googleapis.com/maps/api/distancematrix/json?origins=";
		$url .= $_POST['latitude'] . "," . $_POST['longitude'] . "&destinations=";
		$url .= $lat_long[$open_hall][0] . "," . $lat_long[$open_hall][1];
		$url .= "&mode=walking&sensor=true";
		$contents = json_decode(file_get_contents($url), true)["rows"][0]["elements"][0];
		if (intval($contents["distance"]["value"]) < $distance) {
			$distance = intval($contents["distance"]["value"]);
			$hall = $open_hall;
		}
	}

	echo implode(',', $lat_long[$hall]) . "," . $pretty_names[$hall] . "," . (round((($distance / 1000) * 0.621371192) * 100) / 100);
}

?>