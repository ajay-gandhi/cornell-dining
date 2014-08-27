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
$('*').css({
	"-webkit-user-select": "none",
	"-khtml-user-select": "none",
	"-moz-user-select": "none",
	"-o-user-select": "none",
	"-ms-user-select": "none",
	"user-select": "none"
});
$('body').css({
	"background-color": "#5fc297",
	overflow: "none"
});

$('div#wrapper').css({
	position: "absolute",
	left: "50%"
});

$('div#open').css({
	color: "#ffffff",
	"font-size": "40pt",
	"font-family": "Helvetica Neue, Helvetica, Arial",
	position: "relative",
	left: "-50%",
	"text-align": "center",
	height: $(window).height(),
	"line-height": $(window).height() + "px"
});

/* Get the time */
var dateinfo = new Date();
var h = dateinfo.getHours();
var m = dateinfo.getMinutes();
var day = dateinfo.getDate();
var month = dateinfo.getMonth() + 1;
var year = dateinfo.getFullYear();
if (h < 10) {
	h = "0" + h;
}
if (m < 10) {
	m = "0" + m;
}
var currentTime = h + "" + m; //Format time for the form

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
	window.location.href = "map.php";
});
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
<div id="wrapper">
<div id="open">Working...</div>
</div>
</body>
</html>