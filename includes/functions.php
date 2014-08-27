<?php

/*
 * Google Maps functions
 * /

/* Output the JS for Google Maps */
function map_js($coord, $zoom = 15, $addl_code = "") {

?>
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD2I6hIV9yR7AV97_Tni5srwUcNKkURk98&sensor=true"></script>
<script type="text/javascript">
var infowindowCur, marker_cur, map;
var iwindows = new Array();
var markers = new Array();
function close_window(cur_window) {
	for (var i = 0; i < iwindows.length; i++) {
		if (iwindows[i] != cur_window) {
			iwindows[i].close();
		}
	}
}
function initialize_map() {
	var mapOptions = {
		center: new google.maps.LatLng(<?php echo implode(',', $coord); ?>),
		zoom: 15,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	<?php echo $addl_code; ?>
}
$(document).ready(function() {
	$('*').css({
		margin: 0,
		padding: 0
	});
	$('div#map-canvas').css({
		width: $(window).width(),
		height: $(window).height()
	});
	initialize_map();
});
<?php

}

/*
 * Miscellaneous functions
 * /
 
/* Redirect the browser, default is main page.
 * Uses header(), headers can't be called already. */
function redirect($url = "http://scyberia.org/projects/cornell-dining") {
	header('Location: ' . $url);
}

/* Get Google link for given JS lib directly from Google */
function get_google_snippet($lib_name) {
	$lib_name = str_replace(' ', '-', strtolower($lib_name));
	$page_contents = file_get_contents('https://developers.google.com/speed/libraries/devguide');
	$dom = new DOMDocument;
	@$dom->loadHTML($page_contents);
	$codes = $dom->getElementsByTagName('code');
	foreach ($codes as $code_tag) {
		if ($code_tag->getAttribute('class') == 'snippet') {
			if (strpos($code_tag->nodeValue, $lib_name) !== false) {
				return preg_replace('/\s+/', ' ', $code_tag->nodeValue );
			}
		}
	}
}

/* Searches $haystack to see if $needle is part of an element.
 * E.g. "hi" in ["hilo", "hello"] returns 0 */
function array_search_part($needle, $haystack) {
	foreach ($haystack as $key => $element) {
		if (strpos($element, $needle) !== false) {
			return $key;
		}
	}
	return false;
}

/* Separates $string by $delimiter and capitalizes first character of each separated string.
 * E.g. "hello_world" -> "Hello World" */
function capitalize($string, $delimiter = "_") {
	$separated = explode($delimiter, $string);
	foreach ($separated as $key => $phrase) {
		$separated[$key] = strtoupper(substr($phrase, 0, 1)) . substr($phrase, 1);
	}
	return implode(" ", $separated);
}

?>