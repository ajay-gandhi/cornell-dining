<?php

session_start();
require('includes/functions.php');
require('includes/data.php');

//Array of coordinates for center of map, 0 => lat
//$coord = array(42.451724, -76.482074);
$coord = array(42.449856, -76.481946);
$_SESSION['password'] = "cornellbigredftw";

if (isset($_SESSION['open_halls'])) {
	$open_halls = explode(';', $_SESSION['open_halls']);
	$open_times = explode(';', $_SESSION['open_halls_open_times']);
	$close_times = explode(';', $_SESSION['open_halls_close_times']);

	$code = "";
	foreach ($open_halls as $index => $open_hall) {
		/* Marker */
		$marker = 'var marker' . $index . ' = new google.maps.Marker({
	position : new google.maps.LatLng(' . implode(',', $lat_long[$open_hall]) . '),
	map : map,
	title : "' . addslashes($pretty_names[$open_hall]) . '"
});
markers[' . $index . '] = marker' . $index . ';';

		/* Info window */
		$info_window = "var contentString = '<div id=\"content\">'+
		'<h2 id=\"firstHeading\" class=\"firstHeading\">" . addslashes($pretty_names[$open_hall]) . "</h2>'+
		'<p>" . addslashes($payment[$open_hall]) . "<br />" .
		addslashes($buildings[$open_hall]) . ", " . $open_times[$index] . " - " . $close_times[$index] . "</div>';
	var infowindow" . $index . " = new google.maps.InfoWindow({
		content : contentString,
		maxWidth : 400
	});
	iwindows[" . $index . "] = infowindow" . $index . ";";

		/* Add listener to marker */
		$listener = "google.maps.event.addListener(marker" . $index . ", 'click', function() {
		close_window(infowindow" . $index . ");
		infowindow" . $index . ".open(map, marker" . $index . ");
		marker" . $index . ".setAnimation(null);
	});";
		$code .= $marker . $info_window . $listener;
	}
?>
<!DOCTYPE HTML>
<html>
<head>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<title>Map - Where can I eat right now?</title>
<?php echo get_google_snippet('jquery'); ?>
<script type="text/javascript" src="includes/func.js"></script>
<?php map_js($coord, 15, $code); ?>
var closestHall;
var foundLocation = false;
var gotData = false;
$(document).ready(function() {
setTimeout(function() {
	notify('This gadget was created by Ajay Gandhi (aag255@cornell.edu) and Kevin Chavez (keh222@cornell.edu).', "-credits", 30000);
}, 10000);
$('*').css("overflow", "hidden");
$('div#where-to-eat').css({
	cursor: "pointer",
	color: "#ffffff",
	"font-family": "Helvetica Neue, Helvetica, Arial",
	"text-align": "center",
	height: "100px",
	width: "200px",
	position: "absolute",
	bottom: "0px",
	left: (($(window).width() / 2) - 100) + "px",
	"z-index": 1001,
	margin: 0,
	padding: 0,
	"background-color": "#5fc297",
	"-moz-box-shadow": "0px 0px 10px #000000",
	"-webkit-box-shadow": "0px 0px 10px #000000",
	"box-shadow": "0px 0px 10px #000000",
	"border-top-right-radius": "100px",
	"border-top-left-radius": "100px",
}).click(function() {
	if (gotData && foundLocation) {
		showInfo(true, closestHall);
	} else {
		showInfo(false);
	}
});

$('body').append('<div id="info-wrapper"><div id="info">Test information</div></div>');
$('div#info').css({
	cursor: "pointer",
	color: "#ffffff",
	"font-family": "Helvetica Neue, Helvetica, Arial",
	"font-size": "30px",
	position: "relative",
	left: "-50%",
	"text-align": "center",
	height: "auto",//"40px",//($(window).height() / 4) + "px",
	width: ($(window).width() - 30) + "px",
	padding: "15px",
	"background-color": "#5fc297",
	"box-shadow": "0px 0px 10px #000000"
}).click(function() {
	closestHall.setAnimation(null);
	$('div#info-wrapper').animate({
		bottom: (($('div#info').height() * -1) - 30) + "px"//(($(window).height() / -4) - 50) + "px"
	}, 1000, "swing", function() {
		$('div#where-to-eat').show();
		$('div#where-to-eat').fadeTo("fast", 1);
	});
});

$('div#info-wrapper').css({
	position: "absolute",
	width: "100%",
	bottom: (($('div#info').height() * -1) - 30) + "px",//(($(window).height() / -4) - 50) + "px",
	left: "50%",
	"z-index": 1000
});

$('div#bottom').css({
	"margin-top": "25px",
	"font-size": "24px"
});
});

navigator.geolocation.getCurrentPosition(
	function (position) {
		var marker_cur = new google.maps.Marker({
			position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
			map: map,
			icon: 'images/current.png',
			title: "My Location"
		});
		marker_cur.setMap(map);
		notify("Found your location!", "-found", 4000);
		foundLocation = true;
		$.ajax({
			/* Get nearest eatery */
			type: "POST",
			url: "includes/closest-hall.php",
			data: {
				"latitude": position.coords.latitude,
				"longitude": position.coords.longitude
			}
		}).done(function(msg) {
			var returnData = msg.split(",");
			gotData = true;
			/* Bounce marker */
			for (var n = 0; n < markers.length; n++) {
				if (markers[n].title == returnData[2]) {
					closestHall = markers[n];
				}
			}
			$('div#info').html(returnData[2] + " is " + returnData[3] + " miles away.");
			$('div#info').height('auto');
			$('div#info-wrapper').css("bottom", (($('div#info').height() * -1) - 30) + "px");
		});
	}, function (error) {
		notify("Sorry, we couldn't find your location. Try refreshing the page.", "-lost");
		$('div#where-to-eat').animate({
			bottom: '-100px'
		}, 1000, "swing", function() {
			$('div#where-to-eat').remove();
		});
	}, {
		timeout: (5 * 1000),
		maximumAge: (1000 * 60 * 15),
		enableHighAccuracy: true
	}
);

/* Refresh if resized */
$(window).resize(function() {
	setTimeout(function() {
		window.location.href = window.location.href;
	}, 500);
});
</script>
<script>
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-45199951-1', 'scyberia.org');
ga('send', 'pageview');
</script>
</head>
<body>
<div id="where-to-eat"><div id="bottom">Where<br />should I eat?</div></div>
<div id="map-canvas"></div>
</body>
</html>
<?php
} else {
	redirect();
}

?>