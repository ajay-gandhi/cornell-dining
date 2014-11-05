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
      console.log(data);
      $.each(halls, function (name, hall) {
        console.log(name, hall);
        add_marker(name, hall);
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
          }
        });
      }
  });
});

/**
 * Adds a marker to a Google Maps map by parsing a given object
 * Requires: [String] n - The `ugly` name of the eatery
 *           [Object] e - An object containing information about the marker
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
}