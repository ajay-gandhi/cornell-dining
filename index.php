<?php
session_start();
if (isset($_SESSION['open_halls'])) {
	header('Location: map.php');
}

$_SESSION['password'] = "cornellbigredftw";

require('includes/functions.php');

?>
<!DOCTYPE HTML>
<html>
<head>
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<title>Where can I eat right now?</title>
<?php echo get_google_snippet('jquery'); ?>
<script type="text/javascript">
$(document).ready(function() {
/* Get the time */
var dateinfo = new Date();
var h = dateinfo.getHours();
var m = dateinfo.getMinutes();
var day = dateinfo.getDate();
var month = dateinfo.getMonth() + 1;
var year = dateinfo.getFullYear();
// Ensure time values are two digits long
if (h < 10) {
	h = "0" + h;
}
if (m < 10) {
	m = "0" + m;
}
// Format time for form submit
var currentTime = h + "" + m;

/* Pass the info to the analyzer */
$.ajax({
	type: "POST",
	url: "return.php",
	data: { "time": currentTime,
		"day": day,
		"month": month,
		"year": year
	}
}).done(function(msg) {
	// Redirect to the map
	window.location.href = "map.php";
});
});
</script>
</head>
<body>
<div id="wrapper">
<div id="loading">Working...</div>
</div>
</body>
</html>