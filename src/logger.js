'use strict';

const dateformat = require('dateformat');

/**
 * Provides a basic logger that logs the time with each message.
 */
class Logger {

    info(message) {
      var date = dateformat(Date.now(), "UTC:yyyy-mm-dd' 'HH:MM:ss.l'Z'");
      console.log(`${date} ${message}`);
    }

}

module.exports = new Logger();
