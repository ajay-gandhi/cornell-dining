<?php

/*
 * Google Maps functions
 */

/* Output the JS for Google Maps
 * Requires: $coord: An array of the coordinates to focus on
 			 $zoom: The numerical value of initial map zoom (default 15)
 			 $addl_code: Any additional JS to run once the map is initialized
 * Returns: The complete HTML-wrapped code for including Google Maps
 */
function gmaps_js($coord, $zoom = 15, $addl_code = "") {

?>
<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyD2I6hIV9yR7AV97_Tni5srwUcNKkURk98&sensor=true"></script>
<script type="text/javascript">
var currentInfoWindow, currentMarker, map;
var infoWindows = new Array(); // Array of popup info windows
var markers = new Array(); // Array of map markers

/* Closes the given window and reflects it in array */
function close_window(cur_window) {
	for (var i = 0; i < infoWindows.length; i++) {
		if (infoWindows[i] != cur_window) {
			infoWindows[i].close();
		}
	}
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

	// Initialize the embedded Google Map
	var mapOptions = {
		center: new google.maps.LatLng(<?php echo implode(',', $coord); ?>),
		zoom: <?php echo $zoom; ?>,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map($("#map-canvas").get(0), mapOptions);
	<?php echo $addl_code; ?>
});
<?php

}

/*
 * Miscellaneous functions
 */
 
/* Redirect the browser, default is main page.
 * Requires: That headers haven't been sent yet
 			 $url: The url to be redirected to
 * Returns: (nothing)
 */
function redirect($url = "http://scyberia.org/projects/cornell-dining") {
	header('Location: ' . $url);
}

/* Get link for Google-hosted library given JS lib name
 * Requires: $lib_name: The name of a common JS library
 * Returns: The complete HTML snippet to include the JS lib
 */
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
	exit("Library not found.");
}

/* Searches $haystack to see if $needle is part of an element.
 * Requires: $needle: A string
 *			 $haystack: An array of strings
 * Returns: The index of the first element of $haystack that contains $needle
 */
function array_search_part($needle, $haystack) {
	foreach ($haystack as $key => $element) {
		if (strpos($element, $needle) !== false) {
			return $key;
		}
	}
	return false;
}

/* Converts an underscore-delimited string to title case
 * Requires: $string: A string
 * Returns: A string with spaces instead of underscores in title case
 */
function capitalize($string) {
	$separated = explode("_", $string);
	foreach ($separated as $key => $phrase) {
		$separated[$key] = strtoupper(substr($phrase, 0, 1)) . substr($phrase, 1);
	}
	return implode(" ", $separated);
}

?>