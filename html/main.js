var map,
    markers = [],
    infowindows = [];

var user_marker;

var data;

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
  // Make an AJAX query to the server, providing the local time in ms
  $.ajax({
    url: 'open',
    data: { localTime: today.getTime() }
  }).done(function (returned) {
    console.log(returned);
    data = returned;
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
    }
  });

  var options_panel = $('div#options, div#options-background');

  // Click event to open the options panel
  $('button#show-options')
    .stop()
    // Slide it up
    .animate({
      right: '-5px'
    })
    // Slide it out on click and display the options panel
    .click(function () {
      $(this).animate({
        right: '-50px'
      }, {
        complete: function () {
          options_panel.animate({
            right: '-10px'
          });
        }
      });
    });

  // Click event to close the options panel
  $('button#hide-options').click(function (e) {
    e.preventDefault();
    options_panel.stop().animate({
      right: '-220px'
    }, {
      complete: function () {
        $('button#show-options').animate({
          right: '-5px'
        });
      }
    });
  });

  // Click event to close menu tool
  $('button#close-menu-tool').click(function (e) {
    e.preventDefault();
    $('div#menu-tool, div#menu-background').animate({
      top: '-' + ($('div#menu-tool').outerHeight() + 50)
    });
  });

  // Set the input to local time
  update_input();

  // Ensure preceding 0 on minute input
  $('input#min').change(function () {
    while ($('input#min').val().length < 2) {
      $('input#min').val( '0' + $('input#min').val() );
    }
  });

  // Find the closest eatery
  $('button#where').click(function () {
    find_closest(data);

    options_panel.stop().animate({
      right: '-220px'
    }, {
      complete: function () {
        $('button#show-options').animate({
          right: '-5px'
        });
      }
    });
  });

  // They clicked on the time update button
  $('button#update-time').click(function (e) {
    // Stop the form from submitting
    e.preventDefault();

    // Remove any existing markers
    markers.forEach(function (marker) {
      marker.setMap(null);
    });
    markers = [];
    infowindows = [];

    // Hide options panel
    options_panel.stop().animate({
      right: '-220px'
    }, {
      complete: function () {
        $('button#show-options').animate({
          right: '-5px'
        });
      }
    });

    // Parse the inputs
    var inp_hour = parseInt($('input#hour').val());
    if (inp_hour <= 12 && inp_hour >= 1) {
      time.hour = inp_hour;
    }

    var inp_min = parseInt($('input#min').val());
    if (inp_min <= 59 && inp_min >= 1) {
      time.min = inp_min;
    }

    time.ap = $('select#ampm').val();

    // Update the Date object that will be passed
    if (time.ap == 'pm' && time.hour != 12) {
      today.setHours(time.hour + 12);
    } else {
      today.setHours(time.hour);
    }
    today.setMinutes(time.min);

    // Remove any existing notifications
    remove_all_notifications();

    // Open a new loading notification
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
      }
    });
  });
});


/****************************** Local Functions *******************************/

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
  // First check if the place is All You Can Eat or BRBs
  var hall_ids = [
    'cook_house_dining_room',
    'becker_house_dining_room',
    'keeton_house_dining_room',
    'rose_house_dining_room',
    'jansens_dining_room,_bethe_house',
    'robert_purcell_marketplace_eatery',
    'north_star',
    'risley_dining',
    '104west',
    'okenshields'
  ];
  var is_brb = (hall_ids.indexOf(n) == -1) ? true : false;

  var contentString = '<div id="content" class="infowindow">'
    + '<h2>' + prettify_name(n) + '</h2>'
    + '<div class="summary">' + e.summary + '</div>';
  if (!is_brb) {
    contentString += '<div class="menu" id="' + n +
      '">What\'s there to eat?</div>';
  }
  contentString += '</div>';

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

    // Click event for menu
    $('div.infowindow div.menu').click(function () {
      remove_all_notifications();
      $('div#menu-tool, div#menu-background')
        .animate({
          top: '-' + ($('div#menu-tool').outerHeight() + 50)
        }, {
          complete: function () {
            find_menu(n);
          }
        });
    });
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
  console.log('Going to notify with message: ', msg);
  // Create a unique id for the notification
  var id = Math.floor((Math.random() * 10000) + 1).toString();

  // Default duration is 6 seconds
  if (!duration) {
    duration = 6000;
  }

  var new_html = '<div class="notification no-select" id="notification-' + id
    + '"><div class="notification-background"></div>'
    + '<div class="notification-message">' + msg + '</div>'
    + '</div>';
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
 * Removes all notifications. This method should primarily be used when
 *   notifications with unknown IDs need to be removed.
 */
var remove_all_notifications = function () {
  $('div.notification').each(function () {
    $(this).animate({
      top: '-60px'
    }, {
      complete: function () {
        $(this).remove();
      }
    });
  });
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
      // Create the notification
      notify(notif_msg, -1, function () {
        // If the notification ever goes away, stop bouncing the marker
        markers.forEach(function (marker) {
          marker.setAnimation(null);
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
 * Gets the menu for the given dining hall at the current time object and
 *   displays it
 * Requires: [String] name - The name of the dining hall
 */
var find_menu = function (name) {
  var finding_menu = notify('Getting the menu...', -1);

  $.ajax({
    url: 'menu',
    data: {
      hall: name,
      time: today.getTime()
    }
  }).done(function (menu) {
    // Set the content
    menu = JSON.parse(menu);
    menu.forEach(function (station) {
      // Add the heading (station name)
      if (station.station) {
        $('div#menu-content').append(
          '<p><div class="menu-station">' +
          '<h2>' + station.station + '</h2>'
        );
      }

      station.items.forEach(function (item) {
        $('div#menu-content')
          .append('<span class="item">' + item + '</span><br />');
      });
      $('div#menu-content').append('<br /></div></p>');
    });

    // Set the width and height of the background to that of the content
    $('div#menu-background').css({
      height: $('div#menu-tool').outerHeight()
    });

    var menu_tool = $('div#menu-tool, div#menu-background');
    // The user may have already removed the notification
    if ($('div#notification-' + finding_menu).length == 0) {
      // Slide it down
      menu_tool.animate({
        top: '15px'
      });
    } else {
      remove_notification(finding_menu, function () {
        // Slide it down
        menu_tool.animate({
          top: '15px'
        });
      });
    }
  });
}

/**
 * Updates the input text box with the time
 */
var update_input = function () {
  $('input#hour').val(time.hour);

  // Ensure preceding 0s for minute
  var right_now = time.min.toString();
  while (right_now.length < 2) {
      right_now = '0' + right_now;
  }
  $('input#min').val(right_now);

  $('select#ampm').val(time.ap)
}