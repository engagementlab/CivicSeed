'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    util.js

    - Miscellaneous helper functions useful in a variety of contexts

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

module.exports = (function () {

  return {

    // Generic prettification for string inputs from other humans.
    //    - Trim & collapse whitespace
    //    - Replace straight quotes with curly quotes
    prettyString: function (input) {
      var output = input.toString()

      // Trim trailing whitespace & collapse whitespace in the interior of a string
      output = output.trim().replace(/\s+/g, ' ')

      // Replace straight quotes with curly quotes
      output = output.replace(/"([^"]*)"/g, '“$1”')  // Replaces straight quotes around any number of non-quotation marks
      output = output.replace(/([A-Za-z])\'([A-Za-z])/, '$1’$2') // Replaces ' between any letter characters
      output = output.replace(/(\s)\'([A-Za-z])/g, '$1‘$2')      // Replaces ' at the start of a word
      output = output.replace(/([A-Za-z])\'(\s)/g, '$1’$2')      // Replaces ' at the end of a word
      output = output.replace(/^\'/gm, '‘')                      // Replaces ' at the start of a line

      return output
    }

  }

}())
