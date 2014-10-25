/**
 * This module handles eatery data. This includes fetching the data and parsing
 * it to see if a given eatery is open.
 */

var request = require('request'),
    Promise = require('es6-promise').Promise;

/**
 * Fetches the event data from RedAPI about the given eatery
 * Requires: The name of the eatery
 * Returns: An object containing all the event data for eatery
 */
module.exports.get_eatery_events = function(eatery) {
  var api_url = 'http://redapi-tious.rhcloud.com/dining/' + eatery;

  return new Promise(function (resolve, reject) {
    request(api_url, function (error, response, body) {

      // Return errors if they occur
      if (error) {
        reject(error);
      } else if (!error && response.statusCode == 200) {
        // Parse the result and return only the event data
        resolve(JSON.parse(body).events);
      } else {
        reject('Some other error occured. Status: ' + response.statusCode);
      }
    });
  });
}

/**
 * Checks whether an eatery is open at the given time.
 * Requires: The event data for the eatery and a date object representing the
 *   time to check
 * Returns: Relevant data about the eatery if it is open, and false if it is
 *   closed at the given time
 */
module.exports.is_open = function(eatery_data, currently) {
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
                  resolve(relevant_data(elm));
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
                resolve(relevant_data(elm));
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
          resolve(relevant_data(elm));
        }
      }
    }
  });

  // If nothing has been returned at this point,
  // return false (eatery is closed at the given time)
  resolve(false);
}

/**
 * Parses a time string from Google Calendar into a time represented by
 *   milliseconds since the Unix timestamp
 * Requires: A time string taken from Google Calendar. If the time does not
 *   follow a common time representation standard, a reference time must be
 *   passed to allow proper formatting of the time
 * Returns: The number of milliseconds since the Unix timestamp that is equal
 *   to the given time
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
 * Requires: A valid Date object
 * Returns: The two-letter uppercase representation of the day of the week
 *   represented by the Date object
 */
var day_of_week = function(date_obj) {
  var days = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  return days[date_obj.getUTCDay()];
}

/**
 * Given a Date object, returns the day of the year as an integer from 1 to 366
 * Requires: A valid date object
 * Returns: An integer from 1 to 366 representing the day of the year
 */
var day_of_year = function(date_obj) {
  var first = new Date(date_obj.getFullYear(), 0, 1);
  return Math.round(((date_obj - first) / 1000 / 60 / 60 / 24) + .5, 0);
}

/**
 * Returns only relevant data of a Google calendar event. This entails:
 *
 * Requires: A Google calendar event, such as one returned from RedAPI
 * Returns: The relevanat data of a Google calendar event as listed above.
 */
var relevant_data = function(evt) {
  var s = parse_time(evt.start);
  var e = parse_time(evt.end);
  return {
    start: (s.getHours() * 100) + s.getMinutes(),
    end: (e.getHours() * 100) + e.getMinutes(),
    summary: evt.summary,
  }
}