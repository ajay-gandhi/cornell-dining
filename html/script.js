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
    // Start adding the markers asap, they should be there when the cover
    // disappears
    var halls = JSON.parse(data);
    $.each(halls, function (name, hall) {
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

  // Now the info window
  // This contains the actual HTML content of the window
  var contentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h1 id="firstHeading" class="firstHeading">Uluru</h1>'+
    '<div id="bodyContent">'+
    '<p><b>Uluru</b>, also referred to as <b>Ayers Rock</b>, is a large ' +
    'sandstone rock formation in the southern part of the '+
    'Northern Territory, central Australia. It lies 335&#160;km (208&#160;mi) '+
    'south west of the nearest large town, Alice Springs; 450&#160;km '+
    '(280&#160;mi) by road. Kata Tjuta and Uluru are the two major '+
    'features of the Uluru - Kata Tjuta National Park. Uluru is '+
    'sacred to the Pitjantjatjara and Yankunytjatjara, the '+
    'Aboriginal people of the area. It has many springs, waterholes, '+
    'rock caves and ancient paintings. Uluru is listed as a World '+
    'Heritage Site.</p>'+
    '</div>'+
    '</div>';

  // Create the window itself
  var infowindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 300
  });

  // Display the infowindow when a marker is clicked
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.open(map, marker);
  });

  infowindows.push(infowindow);
}