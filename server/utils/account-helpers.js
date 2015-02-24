'use strict'

var bcrypt = require('bcrypt')

module.exports = (function () {
  return {
    // Generates a hashed password and salt
    hashPassword: function (password, cb) {
      bcrypt.genSalt(10, function (err, salt) {
        if (err) {
          // Placeholder for error handling
        } else {
          bcrypt.hash(password, salt, function (err, hash) {
            if (err) {
              // Placeholder for error handling
            } else {
              cb({
                hash: hash,
                salt: salt
              })
            }
          })
        }
      })
    }
  }
}())
