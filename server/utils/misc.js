'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    server.utils.misc

    - Miscellaneous helper functions

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var self = module.exports = (function () {

  return {

    // Given an arbitrary filename, get its extension
    getFilenameExtension: function (filename) {
      var parts = filename.split('.')
      // Catch cases where there is no extension, or if the extension is the
      // entire filename (e.g. '.htaccess')
      if (parts.length === 1 || (parts[0] === '' && parts.length === 2 )) {
        return ''
      }
      return parts.pop()
    }

  }

}())
