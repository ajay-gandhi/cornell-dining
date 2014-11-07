var map,
    markers = [],
    infowindows = [];

var user_marker;

var today = new Date();

// Object representing current time.
// Invariant:
//   1 <= hour <= 12
//   0 <= min <= 59
//   ap == 'am' | 'pm'
var time = {
  min:   today.getMinutes(),
  hour: (today.getHours() >= 13) ? (today.getHours() - 12) : today.getHours(),
  ap:   (today.getHours() <= 11) ? 'am' : 'pm'
}
if (time.hour == 0) {
  time.hour = 12;
}

// Load the Google Maps map
function initialize() {
  // Center the map on Ithaca zoomed into Cornell's campus
  var mapOptions = {
    center: { lat: 42.449856, lng: -76.481946 },
    zoom: 15
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);

$(document).ready(function () {
  // Loader notification
  var finding_opens = notify('Finding open places...', -1);

  // Make an AJAX query to the server, providing the local time in ms
  $.ajax({
    url: 'open',
    data: { localTime: today.getTime() }
  }).done(function (data) {
    // Remove the loader notification
    remove_notification(finding_opens);

    if (data.trim() == '{}') {
      // All dining halls are closed right now
      notify('Everything is closed. Sorry!', -1);

    } else {
      // Drop the animations in succession
      var halls = JSON.parse(data);
      var index = 0;
      setTimeout(function () {
        $.each(halls, function (name, hall) {
          index++;
          setTimeout(function () {
            var new_marker = add_marker(name, hall);
            add_infowindow(hall, new_marker, name);
          }, index * 50);
        });
      }, 500);

      // Append the closest eatery button
      $('body').append('<div id="where">Find me a<br />place to eat!</div>');
      $('div#where')
        // Hide it first
        .css({
          bottom: '-100px'
        })
        // Slide it up
        .animate({
          bottom: '15px'
        })
        // Slide it down on click and find the closest place
        .click(function () {
          find_closest(data);

          $(this).animate({
            bottom: '-100px'
          });
        });
    }
  });

  // Set the input to local time
  update_input();

  // Click events for the time increment and decrement buttons
  $('button#up').click(function () {
    // The minutes are increasing and > 60, so next hour
    if (time.min == 59) {
      time.min = 0;
      // The hour cannot exceed 12
      if (time.hour == 12) {
        time.hour = 1;
      } else {
        time.hour = time.hour + 1;
      }

      // If the hour went from 11 -> 12, toggle am/pm
      if (time.hour == 12) {
        time.ap = (time.ap == 'am') ? 'pm' : 'am';
      }
    } else {
      time.min = time.min + 1;
    }

    // Update the input box
    update_input();
  });

  $('button#down').click(function () {
    // The minutes are decreasing and < 1, so prev hour
    if (time.min == 0) {
      time.min = 59;
      // The hour cannot be < 1
      if (time.hour == 1) {
        time.hour = 12;
      } else {
        time.hour = time.hour - 1;
      }

      // If the hour went from 12 -> 11, toggle am/pm
      if (time.hour == 11) {
        time.ap = (time.ap == 'am') ? 'pm' : 'am';
      }
    } else {
      time.min = time.min - 1;
    }

    // Update the input box
    update_input();
  });

  // They clicked on update
  $('button#update').click(function () {
    // Remove any existing markers
    markers.forEach(function (marker) {
      marker.setMap(null);
    });
    markers = [];

    // Hide the closest place button
    $('div#where').animate({
      bottom: '-100px'
    });

    // Attempt to parse what is in the time input field
    var inputted_time = $('input#time').val().toString();
    var time_format = /([0-9]{1,2})((:)?)([0-9]{2})(am|pm)?/;
    var parts = time_format.exec(inputted_time);

    // First elem of parts is the entire string, don't need that
    parts.shift();

    // Try to parse the hour, which is the first piece
    var hour = parseInt(parts.shift());
    if (hour <= 24 && hour >= 0) {
      // The hour is valid
      if (hour >= 13) {
        // We want to maintain am/pm instead of 0-23 hours
        time.hour = hour - 12;
        time.ap = 'pm';
      } else if (hour == 0) {
        time.hour = 12;
        time.ap = 'am';
      } else {
        time.hour = hour;
        time.ap = 'am';
      }
    }

    // The next two elements are the `:` separator
    parts.shift();
    parts.shift();

    // Try to parse the minutes
    var min = parseInt(parts.shift());
    if (min >= 0 && min <= 59) {
      // The minute is valid
      time.min = min;
    }

    // Try to parse am/pm
    var ap = parts.shift().toLowerCase();
    if (ap === 'am' || ap === 'pm') {
      // The am/pm is valid
      time.ap = ap;
    }
    update_input();

    // Update the Date object that will be passed
    if (time.ap == 'pm' && time.hour != 12) {
      today.setHours(time.hour + 12);
    } else {
      today.setHours(time.hour);
    }
    today.setMinutes(time.min);

    // Loading notification
    var finding_opens = notify('Finding open places...', -1);

    // Make an AJAX query to the server, providing the local time in ms
    $.ajax({
      url: 'open',
      data: { localTime: today.getTime() }
    }).done(function (data) {

      // Remove the loader notification
      remove_notification(finding_opens);

      if (data.trim() == '{}') {
        // All dining halls are closed right now
        notify('Everything is closed. Sorry!', -1);

      } else {
        // Start adding the markers asap, they should be there when the cover
        // disappears
        var halls = JSON.parse(data);
        var index = 0;
        setTimeout(function () {
          $.each(halls, function (name, hall) {
            index++;
            setTimeout(function () {
              var new_marker = add_marker(name, hall);
              add_infowindow(hall, new_marker, name);
            }, index * 50);
          });
        }, 1000);

        // Append the closest eatery button
        $('div#where')
          .stop()
          // Slide it up
          .animate({
            bottom: '15px'
          })
          // Slide it down on click and find the closest place
          .click(function () {
            find_closest(data);

            $(this).animate({
              bottom: '-100px'
            });
          });
      }
    });
  });
});

/**
 * Adds a marker to a Google Maps map by parsing a given object
 * Requires: [String] n - The name of the eatery
 *           [Object] e - An object containing information about the marker
 * Returns: [Google Maps marker] The newly created marker
 */
var add_marker = function (n, e) {
  // Get the lat and long
  var loc = new google.maps.LatLng(e.latlong[0], e.latlong[1]);

  // Create and add the marker to the map with a drop animation
  var marker = new google.maps.Marker({
    map:      map,
    title:    prettify_name(n),
    animation: google.maps.Animation.DROP,
    position: loc
  });
  markers.push(marker);

  return marker;
}

/**
 * Adds an infowindow to a Google Maps marker
 * Requires: [Object] e - An object containing data to put in the infowindow
 *           [Google Maps marker] m - A Google Maps marker
 *           [String] n - The name of the eatery
 */
var add_infowindow = function (e, m, n) {
  // The HTML content of the infowindow
  var contentString = '<div id="content" class="infowindow">'
    + '<h2>' + prettify_name(n) + '</h2>'
    + e.summary
    + '</div>';

  // Create the infowindow and add it to the global array
  var infowindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 300
  });
  infowindows.push(infowindow);

  // Click event for the marker associated with this infowindow
  google.maps.event.addListener(m, 'click', function() {
    // Stop the marker's animation
    m.setAnimation(null);

    // Close all other infowindows
    for (var i = 0; i < infowindows.length; i++) {
      infowindows[i].close();
    }
    // Animate the map to the current infowindow
    var this_position = [m.getPosition().lat(), m.getPosition().lng()];
    map.panTo(new google.maps.LatLng(this_position[0], this_position[1]));

    // Open the infowindow
    infowindow.open(map, m);
  });
}

/**
 * Prettifies dining hall names
 * Requires: [String] n - The ugly name of the dining hall
 * Returns: [String] A more readable version of the name
 */
var prettify_name = function (n) {
  // Replace underscores with spaces and capitalize first letter of words
  n = n
    .replace(/_/g, ' ')
    .replace(/(?: |\b)(\w)/g, function(key) {
      return key.toUpperCase();
    });
  // Make first letter uppercase
  return n.substr(0, 1).toUpperCase() + n.substr(1);
}

/**
 * Display a temporary notification at the top of the screen
 * Requires: [String] msg   - The content of the notification
 *           [int] duration - The duration of the notification in ms. If the
 *             duration is negative, the notification will never remove itself
 *           [function] callback - A function that is called when the
 *             notification disappears, either by user interaction or timeout
 */
var notify = function (msg, duration, callback) {
  // Create a unique id for the notification
  var id = Math.floor((Math.random() * 10000) + 1).toString();

  // Default duration is 6 seconds
  if (!duration) {
    duration = 6000;
  }

  var new_html = '<div class="notification no-select" id="notification-' + id
    + '">' + msg + '</div>';
  $('body').append(new_html);

  // Remove the notification if it is clicked
  $('div#notification-' + id).click(function() {
    remove_notification(id, callback);
  });

  // Slide the notification down
  $('div#notification-' + id).animate({
    top: '0px'
  }, {
    duration: 1000,
    complete: function() {
      if (duration > 0) {
        // Remove the notification after the given duration
        setTimeout(function() {
          remove_notification(id, callback);
        }, duration);
      }
    }
  });

  // Return the id so that a notification can be closed in some other fashion
  return id;
}

/**
 * Removes the notification associated with the given id
 * Requires: [String] id - The unique id of the notification
 *           [function] callback - A function to call after the notif is gone
 */
var remove_notification = function (id, callback) {
  if ($('div#notification-' + id).length != 0) {
    $('div#notification-' + id).stop().animate({
      top: '-60px'
    }, {
      duration: 1000,
      complete: function() {
        $(this).remove();
        if (callback) {
          callback();
        }
      }
    });
  }
}

/**
 * Given the list of which eateries are currently open, finds the closest one
 * Requires: [Object] data - A mapping of eatery names to their relevant data
 * Returns: [Object] An object containing the same eatery data that was inputted
 *   for the closest eatery, along with a summary of how far it is
 */
var find_closest = function (data) {
  // Ask for the user's location
  navigator.geolocation.getCurrentPosition(function (position) {
    // Add a marker representing the user's location
    var pos = new google.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude
    );
    var image = 'images/current.png';
    if (user_marker) {
      // The marker already exists, just update its location
      user_marker.setPosition(pos);

    } else {
      // Create the marker on the map
      user_marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: 'My Location',
        icon: image,
        zIndex: 0
      });
    }

    // Got the position, now query the server for closest eatery
    // Pass the user's location and the currently open places
    $.ajax({
      url: 'closest',
      data: {
        events: data,
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
    }).done(function (c) {
      // c is the nearest dining hall, notify the user
      c = JSON.parse(c);
      var notif_msg = prettify_name(c.name) + ' is only '
        + c.distance + ' away.';
      notify(notif_msg, -1, function () {
        markers.forEach(function (marker) {
          marker.setAnimation(null);
        });
        $('div#where').animate({
          bottom: '15px'
        });
      });

      // Animate the marker associated with the closest eatery
      markers.forEach(function (marker) {
        if (marker.getTitle() == prettify_name(c.name)) {
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      });
    });
  }, function (err) {
    // There was some error (see geolocation docs)
    if (err.code != 1) {
      notify('Unable to find your location.');
    }
  });
}

/**
 * Updates the input text box with the time
 */
var update_input = function () {
  var right_now = time.min.toString();
  while (right_now.length < 2) {
      right_now = '0' + right_now;
  }
  right_now = time.hour + ':' + right_now + time.ap;
  $('input#time').val(right_now);
}