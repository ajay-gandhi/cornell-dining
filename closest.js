/**
 * This module detects which dining hall is closest to the given location
 */

var request = require('request'),
    Promise = require('es6-promise').Promise;

// API Endpoint for Google Maps distance calculator
var api_url = 'https://maps.googleapis.com/maps/api/distancematrix/json'
  + '?key=AIzaSyC9yloXUk_-YFzljzoN1ee3Cu3YcXi0B7c'
  + '&sensor=false'
  + '&mode=walking'
  + '&language=en-US';

// json?origins=42.4447437452151,-76.48434111717543&destinations=42.446697,-76.485572

module.exports.closest = function (data, user_loc) {

  return new Promise(function (resolve, reject) {
    var halls = [];

    Object.keys(data).forEach(function(key) {
      var val = data[key];
      val.name = key;
      halls.push(val);
    });

    var closest_place;
    var dist = Number.MAX_VALUE;
    var c = 0, n = halls.length;

    // Loop through all the eateries and their locations and query the Google Maps
    // API to see which is nearest
    halls.forEach(function (place) {
      var req_url = api_url
        + '&origins=' + user_loc[0] + ',' + user_loc[1]
        + '&destinations=' + place.latlong[0] + ',' + place.latlong[1];

      // Make the request
      request(req_url, function (error, response, body) {
        if (error) {
          console.log(error);
        } else {
          // See if the distance is less than the current min
          var imp = JSON.parse(body).rows[0].elements;
          if (parseInt(imp[0].distance.value) < dist) {
            // console.log(place);
            dist = parseInt(imp[0].distance.value);
            closest_place = place;
            closest_place.distance = imp[0].duration.text;
          }

          // Another request has been completed, increment counter
          c++;

          // All the requests have been completed
          if (c == n) {
            resolve(closest_place);
          }
        }
      });
    });
  });
}