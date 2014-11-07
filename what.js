/**
 * This module handles the dining hall menus
 */

var browser = new (require('zombie'))(),
    Promise = require('es6-promise').Promise;

// Catch and log any browser errors
browser.on('error', function(err) {
  console.error(err);
});

var menus_url = 'http://living.sas.cornell.edu/dine/whattoeat/menus.cfm';

/**
 * Fetches the menu for a given dining hall at a given time
 * Requires: [String] meal - The name of the meal being eaten
 *           [String] name - The name of the dining hall
 * Returns: [Object] The menu for the dining hall
 */
module.exports.get_menu = function (meal, name) {
  return new Promise(function (resolve, reject) {
    var menu = [];

    // The website takes a number from 1 to 10, not the dining hall name
    var hall_ids = [
      'cook_house_dining_room',
      'becker_house_dining_room',
      'keeton_house_dining_room',
      'rose_house_dining_room',
      'jansens_dining_room,_bethe_house',
      'robert_purcell_marketplace_eatery',
      'north_star',
      'risley_dining',
      '104west',
      'okenshields'
    ];

    // Hall ids aren't 0 indexed
    var hall_id = hall_ids.indexOf(name) + 1;
    // Ensure first char of meal is uppercase
    meal = meal.substr(0, 1).toUpperCase() + meal.substr(1);

    // Visit the browser
    browser.visit(menus_url).then(function () {
      // Select the inputted options one by one
      // Have to submit the form after every selection to refresh other options

      // Only today for now
      // browser.select('menudates',     day);

      browser.select('menuperiod',    meal);
      browser.document.forms[0].submit();
      // Wait for new page to load
      browser.wait()
        .then(function () {
          browser.select('menulocations', hall_id.toString());
          browser.document.forms[0].submit();

          // Wait for new page to load
          browser.wait()
            .then(function() {
              // Get the div containing the form
              // This div also contains the menu
              var menu_container = browser.query('form#menuform').parentNode;
              var children = menu_container.children;

              // Loop through the container's children
              for (var i = 0; i < children.length; i++) {
                var elm = children[i];
                if (elm.innerHTML) {
                  // The element contains stuff, so it's an important HTML element
                  if (elm.tagName == 'H4' && elm.className == 'menuCatHeader') {
                    // It's a heading/station name, so create a new object for it
                    menu.push({
                      station: elm.textContent.trim(),
                      items:   []
                    });

                  } else if (elm.tagName == 'P' && elm.className == 'menuItem') {
                    // It's an actual menu item itself
                    // Add it on the the last object in menu
                    if (menu.length == 0) {
                      // Menu is empty, i.e. there was no station name
                      // Create an item without a station name
                      menu.push({
                        items: [elm.textContent.trim()]
                      });
                    } else {
                      // Just add it on
                      menu[menu.length - 1].items.push(elm.textContent.trim());
                    }
                  }
                }
              }

              resolve(menu);
            });
      });
    });
  });
}