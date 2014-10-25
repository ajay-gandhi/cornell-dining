var request = require('request'),
    Promise = require('es6-promise').Promise,
    em = require('./eatery'),
    server = require('./server');

var all_eateries = [];
var open_now = [];
var num_eateries = 0;

// Fetch the name of every eatery
var api_url = 'http://redapi-tious.rhcloud.com/dining';
request(api_url, function (error, response, body) {
  console.log('Fetched eatery names.');

  if (error) {
    // Output the error if one occurs
    console.log(error);
  } else if (!error && response.statusCode == 200) {
    // Good to go!
    var eateries = JSON.parse(body);
    num_eateries = eateries.length;

    console.log('Fetching eatery data...');
    // Loop through all the eateries, finding out if they are open
    eateries.forEach(function (eatery_name) {

      // Returns a promise
      em.get_eatery_events(eatery_name)
        .then(function (results) {

          // Now that we have the event data for the eatery, check if it's open
          em.is_open(results, new Date()).then(function (status) {

            // Add the result to an array, regardless of what it is
            all_eateries.push({
              eatery: eatery_name,
              status: status
            });

            if (status != false) {
              open_now.push({
                eatery: eatery_name,
                status: status
              });
            }

            if (num_eateries == all_eateries.length) {
              console.log('Done.\n');
              server.start_server(JSON.stringify(all_eateries));
            }
          });
        })
        .catch(console.error);
    });

  } else {
    console.log('Returned an unknown error.');
    console.log(error);
    console.log(response);
    console.log(body);
  }
});

/**
 * Given a string containing underscores rather than spaces, such as
 *   'hello_world' replaces the underscore with a space and capitalizes the
 *   first letter of each word.
 * Requires: A symbol-delimited string
 * Returns: A display-able version of the input string.
 */
var prettify_name = function(e_name) {
  return e_name[0].toUpperCase()
    + e_name.substr(1).replace(/_([a-z])/ig, function(all, letter) {
    return ' ' + letter.toUpperCase();
  });
}