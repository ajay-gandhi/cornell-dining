/* Display a temporary notification at the top of the screen */
function notify(msg, id, delaytime) {
	if (delaytime == null) {
		delaytime = 6000;
	}
	$('html, body').css({
		padding: 0,
		margin: 0
	});
	$('body').append('<div id="notification-wrapper' + id + '"><div id="notification' + id + '">' + msg + '</div></div>');
	$('div#notification-wrapper' + id).css({
		position: "absolute",
		width: "100%",
		top: "-56px",
		left: "50%",
		"z-index": 1000
	});

	$('div#notification' + id).css({
		cursor: "pointer",
		color: "#ffffff",
		"font-size": "16px",
		"font-family": "Helvetica Neue, Helvetica, Arial",
		position: "relative",
		left: "-50%",
		"text-align": "center",
		height: "auto",
		width: ($(window).width() - 30) + "px",
		padding: "15px",
		"background-color": "#5fc297",
		"-moz-box-shadow": "0px 0px 10px #000000",
		"-webkit-box-shadow": "0px 0px 10px #000000",
		"box-shadow": "0px 0px 10px #000000"
	}).click(function() {
		removeNotification(id);
	});

	$('div#notification-wrapper' + id).animate({
		top: "0px"
	}, 1000, "swing", function() {
		setTimeout(function() {
			removeNotification(id);
		}, delaytime);
	});
}

/* Remove the notification */
function removeNotification(identifier) {
	if ($('div#notification-wrapper' + identifier).length != 0) {
		$('div#notification-wrapper' + identifier).animate({
			top: "-56px"
		}, 1000, "swing", function() {
			$(this).remove();
		});
	}
}

/* Display info for "Where should I eat?" */
function showInfo(go, m) {
	if (go == true) {
		close_window(1000);
		$('div#where-to-eat').fadeTo("fast", 0, function () {
			$(this).hide();
			m.setAnimation(google.maps.Animation.BOUNCE);
			$('div#info-wrapper').animate({
				bottom: "0px"
			}, 1000);
		});
	} else {
		if ($('div#notification-wrapper-wait').length == 0) {
			notify("Waiting for location...", "-wait", 2000);
		}
	}
}