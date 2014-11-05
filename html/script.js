var map,
    markers = [],
    infowindows = [];

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

$(document).ready(function() {
  // Make an AJAX query to the server, providing the local time in ms
  $.ajax({
    url: 'open',
    data: { localTime: new Date().getTime() }
  }).done(function (data) {
    if (data.trim() == '{}') {
      // All dining halls are closed right now
      $('div#map-canvas').remove();
      $('div#loading h2').text('all eateries are closed right now');
      $('div#loading span').fadeTo('normal', 0, function () {
        $(this).remove();
      });
    } else {
      // Start adding the markers asap, they should be there when the cover
      // disappears
      var halls = JSON.parse(data);
      $.each(halls, function (name, hall) {
        var new_marker = add_marker(name, hall);
        add_infowindow(hall, new_marker, name);
      });

      // Received the data! Do some animations and then display the good stuff
      $('div#loading-wrapper')
        .css({
          width:  $(window).width() + 'px',
          height: $(window).height() + 'px'
        })
        .delay(500)
        .animate({
          top: '-' + ($(window).height() + 100)
        }, {
          duration: ($(window).height() * 2),
          complete: function() {
            // Remove the cover from the page
            $(this).remove();

            // Append the closest eatery button
            // $('body').append('<div id="where">Where<br />should<br />I eat?</div>');
            $('body').append('<div id="where">Find<br />me a place<br />to eat!</div>');
            $('div#where')
              // Hide it first
              .css({
                bottom: '-100px',
                left: ($(window).width() / 2) - 100
              })
              // Slide it up
              .animate({
                bottom: '0px'
              })
              // Slide it down on click and find the closest place
              .click(function () {
                find_closest(data);

                $(this).animate({
                  bottom: '-100px'
                }, {
                  complete: function () {
                    $(this).remove();
                  }
                });
              });
          }
        });
      }
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
    title:    n,
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
 *           [int] duration - The duration of the notification in ms
 */
var notify = function (msg, duration) {
  // Create a unique id for the notification
  var id = Math.floor((Math.random() * 10000) + 1).toString();

  // Default duration is 6 seconds
  if (!duration) {
    duration = 6000;
  }

  var new_html = '<div class="notification" id="notification-wrapper-' + id + '">'
    + '<div id="notification-' + id + '">' + msg + '</div>'
    + '</div>';
  $('body').append(new_html);

  // Remove the notification if it is clicked
  $('div#notification-' + id).click(function() {
    removeNotification(id);
  });

  // Slide the notification down
  $('div#notification-wrapper-' + id).animate({
    top: '0px'
  }, {
    duration: 1000,
    complete: function() {
      // Remove the notification after the given duration
      setTimeout(function() {
        removeNotification(id);
      }, duration);
    }
  });
}

/**
 * Removes the notification associated with the given id
 * Requires: [String] id - The unique id of the notification
 */
var remove_notification = function (id) {
  if ($('div#notification-wrapper-' + id).length != 0) {
    $('div#notification-wrapper-' + id).animate({
      top: '-100px'
    }, {
      duration: 1000,
      complete: function() {
        $(this).remove();
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
      var notif_msg = prettify_name(c.name) + ' is the only '
        + c.distance + ' away.';
      notify(notif_msg);

      // Animate the marker associated with the closest eatery
      markers.forEach(function (marker) {
        if (marker.getTitle() == c.name) {
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






