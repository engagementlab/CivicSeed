'use strict';

// Only let a request through if the session has been authenticated
exports.authenticated = function (framework) {
  return function (req, res, next) {
    if (req.session && (req.session.userId !== null)) {
      return next()
    } else {
      if (framework === 'express') {
        if (req.url.match(/^\/admin/g)) {
          return res.redirect('/')
        }
        return next()
      } else {
        return res('NOT_AUTHENTICATED')
      }
    }
  }
}
