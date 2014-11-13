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


/******************************* Module Exports *******************************/

module.exports = (function () {

  function Eateries() {
    // Create a local cache that will be filled by the getter methods below
    this.cache = {
      eatery_names:  null,
      num_eateries:  null,
      eatery_events: {},
      latlongs:      {}
    }
  }

  Eateries.prototype.init = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
      // Get all the event data, including names, latlong, and open/close times
      // Running this single method will call all the other getters and set the
      // cached values for later
      self.get_all_events()
        .then(function () {
          // Return this object
          resolve(self);
        })
        .catch(console.error);
    });
  }

  /**
   * Returns an array of the names of every eatery on campus and caches the list
   * Returns [Promise] A list of the name of each on-campus eatery
   */
  Eateries.prototype.get_eatery_names = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
      // Return cached value if it exists
      if (self.cache.eatery_names) {
        resolve(self.cache.eatery_names);

      } else {
        request(api_url, function (error, response, body) {
          if (error) {
            reject(error);
          } else {
            // Store the data in the cache then return
            self.cache.eatery_names = JSON.parse(body);
            resolve(self.cache.eatery_names);
          }
        });
      }
    });
  }

  /**
   * Returns the number of eateries on campus.
   * Returns [Promise] The number of eateries
   */
  Eateries.prototype.get_num_eateries = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
      // Return cached value if it exists
      if (self.cache.num_eateries) {
        resolve(self.cache.num_eateries);

      } else {
        // Get the list of names, then calculate its length
        self.get_eatery_names()
          .then(function (names) {
            // Cache and return
            self.cache.num_eateries = names.length;
            resolve(self.cache.num_eateries);
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
  Eateries.prototype.get_eatery_events = function (name) {
    var self = this;

    return new Promise(function (resolve, reject) {
      // Return cached value if it exists
      if (!is_empty(self.cache.eatery_events)
        && self.cache.eatery_events[name]) {
        resolve(self.cache.eatery_events[name]);

      } else {
        // Make an API request for the event data
        request(api_url + '/' + name, function (error, response, body) {
          if (error) {
            reject(error);
          } else {
            // Cache and return
            var coords = JSON.parse(body).coordinates.split(',');
            self.cache.latlongs[name]      = coords;
            self.cache.eatery_events[name] = JSON.parse(body).events;
            resolve(self.cache.eatery_events[name]);
          }
        });
      }
    });
  }

  /**
   * Fetches the event data from RedAPI for each on-campus eatery.
   * Returns: [Promise] An object containing the event data for every eatery
   */
  Eateries.prototype.get_all_events = function () {
    var self = this;

    return new Promise(function (resolve, reject) {
      // Return cached value if it exists
      if (!is_empty(self.cache.eatery_events)) {
        resolve(self.cache.eatery_events);

      } else {
        // First get a list of all the eateries
        var eateries;
        self.get_eatery_names()
          .then(function (e) {
            eateries = e;
            // Then get the number of eateries
            return self.get_num_eateries();
          })
          .then(function (num) {

            // Loop through all the eateries
            eateries.forEach(function (eatery_name) {

              // Now get the event data for this eatery
              self.get_eatery_events(eatery_name)
                .then(function (results) {

                  // Cache the data
                  self.cache.eatery_events[eatery_name] = results;

                  // When all the eatery data has been set, return the data
                  if (num == Object.keys(self.cache.eatery_events).length) {
                    resolve(self.cache.eatery_events);
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
   * Checks whether an eatery is open at the given time.
   * Requires: [String]     name        - The name of the eatery
   *           [Event Data] eatery_data - The event data for the eatery
   *           [Date]       currently   - The time to check
   * Returns: [Promise] An array of the eatery's name, and relevant data about
   *   the eatery if it is open (see local function relevant_data() below), and
   *   false if it is closed at the given time
   */
  Eateries.prototype.is_open = function(name, eatery_data, currently) {
    var self = this;

    return new Promise(function (resolve, reject) {
      var answer = false;

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

            // If there is an end property of the returned repeat rule
            // then that is the actual end time for the event
            var last_time = end_time;
            if (elm.rrule.end) {
              last_time = parse_time(elm.rrule.end);
            }

            if (elm.rrule.weekdays) {
              // The event contains info about which days the even repeats
              // Only continue if given day is one of those and it is in range
              dow = day_of_week(currently);
              if (elm.rrule.weekdays.split(',').indexOf(dow) >= 0
                && start_time.getTime() <= currently.getTime()
                && currently.getTime()  <= last_time.getTime()) {

                if (elm.rexcept) {
                  // The event contains a parameter defining an exception to the
                  // repeat rule. We need to ensure that the given date does not
                  // fall into this excluded date
                  var no_go_date = parse_time(elm.rexcept);

                  if (
                    no_go_date.getFullYear() == currently.getFullYear()
                    && no_go_date.getMonth() == currently.getMonth()
                    && no_go_date.getDate()  == currently.getDate()
                  ) {                
                    // The exceptions match, so it is not open
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
                      answer = self.relevant_data(name, elm);
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
                    answer = self.relevant_data(name, elm);
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
              answer = self.relevant_data(name, elm);
            }
          }
        }
      });

      resolve([name, answer]);
    });
  }

  /**
   * Given a Date object, returns a mapping of each eatery to its status. If the
   *   eatery is open at the given time, the mapping will contain relevant data
   *   (see local function relevant_data() below). If the eatery is closed, the
   *   mapping will map to false. If parameter open_only is true, the mapping
   *   will only include eateries that are open at the given time.
   * Requires: [Date]    currently - The time to check
   *           [boolean] open_only - Whether to only include open eateries
   * Returns: [Promise] A mapping of every given eatery to its current status.
   */
  Eateries.prototype.are_open = function(currently, open_only) {
    var self = this;

    return new Promise(function (resolve, reject) {
      var places = {},
          all_events;

      // Get all the event data
      self.get_all_events()
        .then(function (a) {
          all_events = a;
          return self.get_num_eateries();
        })
        .then(function (num) {
          var done = 0;

          // Loop through each set of events
          // Each key is the name of a eatery and each value is the set of
          // events associated with that eatery
          for (var name in all_events) {
            events = all_events[name];

            // Get the status of the place and add it to the mapping
            self.is_open(name, events, currently).then(function (ret) {
              // Increment a counter so that when the last request completes,
              // the entire set of data can be resolved
              done++;

              // Add the returned data to the accumulator, if appropriate
              if (!open_only || ret[1] != false) {
                // Only add places that are open
                places[ret[0]] = ret[1];
              }
              if (done == num) {
                // If all the data has been resolved from is_open, return the
                // entire object
                resolve(places);
              }
            });
          }
        });
    });
  }

  /**
   * Returns only relevant data about an eatery. This entails:
   *   { opening time, closing time, summary, lat/long }
   * Requires: [String] n   - The name of the eatery
   *           [Object] evt - A Google calendar event
   * Returns: [Object] The data of an eatery as listed above.
   */
  Eateries.prototype.relevant_data = function(n, evt) {
    var self = this;

    // This data is available from the inputted event data
    var s = parse_time(evt.start);
    var e = parse_time(evt.end);
    var return_obj = {
      start: (s.getHours() * 100) + s.getMinutes(),
      end: (e.getHours() * 100) + e.getMinutes(),
      summary: evt.summary
    }

    // The local vars are set, use those
    return_obj.latlong  = self.cache.latlongs[n];

    return return_obj;
  }

  return Eateries;

})();










/******************************* Local Functions ******************************/

/**
 * Parses a time string from Google Calendar into a Date object.
 * Requires: [String] time - A string representing a time
 * Returns: [Date] A Date object representing the given time
 */
var parse_time = function(time) {
  return new Date(time);
}

/**
 * Given a Date object, returns the day of the week as an uppercase two-letter
 *   string
 * Requires: [Date] date_obj - A valid Date object
 * Returns: [String] The two-letter uppercase representation of the day of the
 *   week represented by the given Date object
 */
var day_of_week = function(date_obj) {
  var days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  return days[date_obj.getDay()];
}

/**
 * Given any object, returns whether the object is empty ({}).
 * Requires: [Object] An object
 * Returns: [boolean] True if the object is empty or undefined
 */
var is_empty = function(obj) {
  if (JSON.stringify(obj) == '{}' || obj == undefined) {
    return true;
  } else {
    return false;
  }
}
