/**
 * This module controls the server itself, including dynamic and static data.
 */

var express = require('express'),
    closest = require('./closest'),
    what    = require('./menu');

var app = express();

/**
 * Starts an http server.
 * Requires: [Module] An instance of the eatery module
 */
module.exports.start_server = function(eatery_object) {
  app.set('port', (process.env.PORT || 5000));

  // Serve up static files from html subdir if requested
  app.use(express.static(__dirname + '/html'));

  app.get('/open', function (req, res) {
    // This is the AJAX request for which halls are open
    // Using the eatery module, find out which ones are open given the time

    // First get the time in ms from the query and convert it to a date obj
    var local_ms = req.query.localTime;
    var local_time = new Date(parseInt(local_ms));

    // Pass it to the eatery module to get which places are open
    eatery_object.are_open(local_time, true)
      .then(function (results) {
        console.log(local_time);
        res.send(JSON.stringify(results));
      })
      .catch(console.error);
  });

  app.get('/closest', function (req, res) {
    // Requesting the closest dining hall

    // Parse the data into event data and user latlong
    var evt_data = JSON.parse(req.query.events);
    var ll = [req.query.lat, req.query.lng];

    // Ask the Closest module which place is closest
    closest.closest(evt_data, ll)
      .then(function (c) {
        // Received a result, send it back to the client
        res.send(JSON.stringify(c));
      })
      .catch(console.error);
  });

  app.get('/menu', function (req, res) {
    // Requesting the menu

    // Get the hall and meal
    var hall = req.query.hall;
    var time = req.query.time;

    what.get_menu(time, hall)
      .then(function (menu) {
        res.send(JSON.stringify(menu));
      });
  });

  // Actually start the server
  app.listen(app.get('port'), function() {
    console.log('Server running on port ' + app.get('port'));
  });
}
