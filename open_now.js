var request = require('request'),
    Promise = Promise   = require('es6-promise').Promise,
    is_open = require('./is_open');

// Fetch the name of every eatery
var api_url = 'http://api-mrkev.rhcloud.com/redapi/cal';
request(api_url, function (error, response, body) {
  if (error) {
    console.log(error);
  } else if (!error && response.statusCode == 200) {
    // Good to go!
    var eateries = JSON.parse(body).dining;
    eateries.forEach(function (eatery) {
      is_open(eatery)
        .then(function (results) {
          console.log(eatery);
          console.log(results);
          console.log('\n');
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