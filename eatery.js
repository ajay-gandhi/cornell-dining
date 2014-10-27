/**
 * This module handles eatery data. This includes fetching the data and parsing
 * it to see if a given eatery is open.
 *
 * Because many methods make API calls or could take time to compute, they
 * return Promises rather than actual content.
 */

var request = require('request'),
    Promise = require('es6-promise').Promise;

// RedAPI Endpoint
var api_url = 'http://redapi-tious.rhcloud.com/dining';

// These locally available variable will be set by the getter methods below to
// save time if the method is called numerous times on the same parameters
var num_eateries,
    eatery_names,
    eatery_events = {};

var e_latlongs  = {},
    e_buildings = {},
    e_payments  = {};


/******************************* Module Exports *******************************/

/**
 * Returns an array of the names of every eatery on campus and sets the local
 *   variable to save time next time the function is called.
 * Returns [Promise] A list of the name of each on-campus eatery
 */
var get_eatery_names = function() {
  return new Promise(function (resolve, reject) {
    // If the local variable is already set, just return that data
    if (!is_empty(eatery_names)) {
      resolve(eatery_names);

    } else {
      // The local var is not set, we have to query the API
      request(api_url, function (error, response, body) {
        if (error) {
          reject(error);
        } else if (response.statusCode == 200) {
          // Set the local variable then return the data
          eatery_names = JSON.parse(body);
          resolve(eatery_names);
        } else {
          // Some other error occured, return the response object as an error
          reject(response);
        }
      });
    }
  });
}

/**
 * Returns the number of eateries.
 * Returns [Promise] The number of eateries
 */
var get_num_eateries = function() {
  return new Promise(function(resolve, reject) {
    if (num_eateries) {
      resolve(num_eateries);
    } else {
      get_eatery_names()
        .then(function (names) {
          num_eateries = names.length;
          resolve(num_eateries);
        })
        .catch(console.error);
    }
  });
}

/**
 * Fetches the event data from RedAPI about the given eatery.
 * Requires: [string] eatery - The name of the eatery
 * Returns: [Promise] An object containing all the event data for eatery
 */
var get_eatery_events = function(eatery) {
  return new Promise(function (resolve, reject) {
    // If the local variable is alredady set, just return that data
    if (!is_empty(eatery_events) && eatery_events[eatery]) {
      resolve(eatery_events[eatery]);

    } else {
      // The local var is not set, we have to query the API
      request(api_url + '/' + eatery, function (error, response, body) {
        if (error) {
          reject(error);
        } else if (response.statusCode == 200) {
          // Parse the result and return only the event data
          // Set the local variable first.
          eatery_events[eatery] = JSON.parse(body).events;
          resolve(eatery_events[eatery]);
        } else {
          // Some other error occured, return the response object as an error
          reject(response);
        }
      });
    }
  });
}

/**
 * Fetches the event data from RedAPI for each eatery in the given list.
 * Returns: [Promise] An object containing the event data for the given eateries
 */
var all_eatery_events = function() {
  return new Promise(function (resolve, reject) {
    if (!is_empty(eatery_events)) {
      resolve(eatery_events);
    } else {
      // First get a list of all the eateries
      var eateries;
      get_eatery_names()
        .then(function (e) {
          eateries = e;
          // Get the number of eateries
          return get_num_eateries();
        }).then(function (num) {

          // Loop through all the eateries, finding out if they are open
          eateries.forEach(function (eatery_name) {

            // Now get the event data for this eatery
            get_eatery_events(eatery_name)
              .then(function (results) {

                // Set the information
                eatery_events[eatery_name] = results;

                // When all the eatery data has been set, return the data
                if (num == Object.keys(eatery_events).length) {
                  resolve(eatery_events);
                }
              })
              .catch(console.error);
          });
        })
        .catch(console.error);
    }
  });
}

/**
 * Given a Date object, returns a mapping of each eatery to its status. If the
 *   eatery is open at the given time, the mapping will contain, information
 *   about the eatery's summary, open, and closing times, otherwise false. If
 *   parameter open_only is true, the mapping only includes eateries that are
 *   open.
 * Requires: [Date]    currently - The time to check
 *           [boolean] open_only - Whether to only include open eateries
 * Returns: [Promise] A mapping of every given eatery to its current status.
 */
var are_open = function(currently, open_only) {
  return new Promise(function (resolve, reject) {
    var places = {},
        all_events;

    // Get all the event data
    all_eatery_events().then(function (a) {
      all_events = a;
      return get_num_eateries();
    }).then(function (num) {
      var done = 0;

      // Loop through each set of events
      // Each key is the name of a eatery and each value is the set of events
      // associated with that eatery
      for (var name in all_events) {
        events = all_events[name];

        // Get the status of the place and add it to the mapping
        is_open(name, events, currently).then(function (ret) {
          // Increment a counter so that when the last request completes,
          // the entire set of data can be resolved
          done++;

          // Add the returned data to the accumulator, if appropriate
          if (!open_only || ret[1] != false) {
            places[ret[0]] = ret[1];
          }
          if (done == num) {
            resolve(places);
          }
        });
      }
    });
  });
}

/**
 * Checks whether an eatery is open at the given time.
 * Requires: [String]     name        - The name of the eatery
 *           [Event Data] eatery_data - The event data for the eatery
 *           [Date]       currently   - The time to check
 * Returns: [Promise] An array of the eatery's name, and relevant data about the
 *   eatery if it is open, and false if it is closed at the given time
 */
var is_open = function(name, eatery_data, currently) {
  return new Promise(function (resolve, reject) {
    // Loop through all the events
    eatery_data.forEach(function (elm) {
      // Only want events about hall being open
      if (elm.summary.toLowerCase().indexOf('closed') == -1) {
        // Repeating event?
        if (elm.rrule) {
          // It's a repeating event

          // Get the start and end time
          var start_time = parse_time(elm.start);
          var end_time   = parse_time(elm.end);

          // If there is an UNTIL property of the returned repeat rule
          // then that is the actual end time for the event
          var last_time = end_time;
          if (elm.rrule.UNTIL) {
            last_time = parse_time(elm.rrule.UNTIL, elm.start);
          }

          if (elm.rrule.BYDAY) {
            // The event contains info about which days the even repeats
            // Only continue if given day is one of those and it is in range
            dow = day_of_week(currently);
            if (
              elm.rrule.BYDAY.split(',').indexOf(dow) >= 0
              && start_time.getTime() <= currently.getTime()
              && currently.getTime()  <= last_time.getTime()
            ) {
              if (elm.rexcept) {
                // The event contains a parameter defining exceptions to the
                // repeat rule. We need to ensure that the given date does not
                // fall into any of these excluded dates
                var is_okay = true;

                elm.rexcept.forEach(function (no_go) {
                  var no_go_date = parse_time(no_go);
                  if (
                    no_go_date.getFullYear() == currently.getFullYear()
                    && no_go_date.getMonth() == currently.getMonth()
                    && no_go_date.getDate()  == currently.getDate()
                  ) {
                    is_okay = false;
                  }
                });

                if (is_okay) {
                  // Given range is valid, now check hours
                  var this_time = (currently.getHours() * 100)
                    + currently.getMinutes();

                  var min_time = (start_time.getHours() * 100)
                    + end_time.getMinutes();

                  var max_time = (end_time.getHours() * 100)
                    + end_time.getMinutes();

                  if (end_time.getHours() <= start_time.getHours()) {
                    // This means the event overlaps to the following day
                    // If this is the case, add 24 hours to interval end
                    max_time += 2400;
                  }

                  // Now check if the time is in the interval
                  if (min_time <= this_time && this_time <= max_time) {
                    resolve([name, relevant_data(name, elm)]);
                  }
                }
              } else {
                // Given range is valid, now check hours
                var this_time = (currently.getHours() * 100)
                  + currently.getMinutes();

                var min_time = (start_time.getHours() * 100)
                  + end_time.getMinutes();

                var max_time = (end_time.getHours() * 100)
                  + end_time.getMinutes();

                if (end_time.getHours() <= start_time.getHours()) {
                  // This means the event overlaps to the following day
                  // If this is the case, add 24 hours to interval end
                  max_time += 2400;
                }

                // Now check if the time is in the interval
                if (min_time <= this_time && this_time <= max_time) {
                  resolve([name, relevant_data(name, elm)]);
                }
              }
            }
          }
        } else {
          // One-time event

          // Get the start and end time
          var start_time = parse_time(elm.start);
          var end_time   = parse_time(elm.end);

          // Check if the place is open between those times
          if (start_time.getTime() <= currently.getTime()
            && currently.getTime() <= end_time.getTime()) {
            resolve([name, relevant_data(name, elm)]);
          }
        }
      }
    });

    // If nothing has been returned at this point,
    // return false (eatery is closed at the given time)
    resolve([name, false]);
  });
}

// Add everything to module exports
module.exports.get_eatery_names  = get_eatery_names;
module.exports.get_num_eateries  = get_num_eateries;
module.exports.get_eatery_events = get_eatery_events;
module.exports.all_eatery_events = all_eatery_events;
module.exports.are_open          = are_open;
module.exports.is_open           = is_open;

/******************************* Local Functions ******************************/

/**
 * Parses a time string from Google Calendar into a time represented by
 *   milliseconds since the Unix timestamp
 * Requires: [String] time - A string representing a time.
 *           [String] ref  - If the given time does not follow a common time
 *   representation standard, a reference time must be passed to allow proper
 *   formatting of the given time
 * Returns: [Date] A Date object representing the given time
 */
var parse_time = function(time, ref) {
  // Google Calendar returns time in one of two formats
  // One is acceptable by the Date() constructor
  if (time.indexOf(':') == -1) {
    // time does not have :
    ref  = ref.substr(-5, 5);
    time = time.substr(0, 4)
      + '-' + time.substr(4, 2)
      + '-' + time.substr(6, 5)
      + ':' + time.substr(11, 2)
      + ':' + time.substr(13, 2)
      + ref;
  }
  return new Date(time);
}

/**
 * Given a Date object, returns the day of the week as an uppercase two-letter
 *   string
 * Requires: [Date] date_obj - A valid Date object
 * Returns: [String] The two-letter uppercase representation of the day of the week
 *   represented by the Date object
 */
var day_of_week = function(date_obj) {
  var days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  return days[date_obj.getUTCDay()];
}

/**
 * Given a Date object, returns the day of the year as an integer from 1 to 366
 * Requires: [Date] date_obj - A valid date object
 * Returns: [int] An integer from 1 to 366 representing the day of the year
 */
var day_of_year = function(date_obj) {
  var first = new Date(date_obj.getFullYear(), 0, 1);
  return Math.round(((date_obj - first) / 1000 / 60 / 60 / 24) + .5, 0);
}

/**
 * Returns only relevant data about an eatery. This entails:
 *   { opening time, closing time, summary, lat/long, building, payment type }
 * Requires: [String] n   - The name of the eatery
 *           [Object] evt - A Google calendar event
 * Returns: [Object] The data of an eatery as listed above.
 */
var relevant_data = function(n, evt) {
  // This data is available from the inputted event data
  var s = parse_time(evt.start);
  var e = parse_time(evt.end);
  var return_obj = {
    start: (s.getHours() * 100) + s.getMinutes(),
    end: (e.getHours() * 100) + e.getMinutes(),
    summary: evt.summary
  }

  // The following data needs to taken from the hardcoded eatery data
  if (e_latlongs[n]) {
    // The local vars are set, use those
    return_obj.latlong  = e_latlongs[n];
    return_obj.building = e_buildings[n];
    return_obj.payment  = e_payments[n];

    return return_obj;

  } else {
    // The local vars are not set, so get the information, set the vars, then
    // return the data
    var e_info = require('./eatery_information.json');

    e_latlongs[n]  = e_info.latlongs[n];
    e_buildings[n] = e_info.buildings[n];
    e_payments[n] = e_info.payments[n];

    return_obj.latlong  = e_latlongs[n];
    return_obj.building = e_buildings[n];
    return_obj.payment = e_payments[n];

    return return_obj;
  }
}

/**
 * Given any object, returns whether the object is empty ({}).
 * Requires: [Object] An object
 * Returns: [boolean] True if the object is empty
 */
var is_empty = function(obj) {
  if (JSON.stringify(obj) == '{}' || obj == undefined) {
    return true;
  } else {
    return false;
  }
}