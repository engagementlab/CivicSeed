'use strict';

var nodemailer    = require('nodemailer'),
    htmlToText    = require('nodemailer-html-to-text').htmlToText,
    winston       = require('winston')

var rootDir       = process.cwd(),
    config        = require(rootDir + '/app/config'),
    NAME          = config.get('NAME'),
    EMAIL_USER    = config.get('EMAIL_USER'),
    EMAIL_PW      = config.get('EMAIL_PW'),
    EMAIL_SERVICE = config.get('EMAIL_SERVICE')

var self = module.exports = (function () {

  var transporter,
      mailOptions = {
        from:    NAME + ' <' + EMAIL_USER + '>',
        to:      '',
        replyTo: EMAIL_USER,
        subject: '',
        text:    '',
        html:    ''
      }

  function openEmailConnection () {
    transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PW
      }
    })
  }

  function closeEmailConnection () {
    // According to Nodemailer documentation, the close() method
    // is technically optional.
    // https://github.com/andris9/Nodemailer/blob/master/README.md
    transporter.close()
  }


  return {

    sendEmail: function (subject, html, email, callback) {
      mailOptions.to      = email
      mailOptions.subject = subject
      mailOptions.html    = html

      openEmailConnection()

      transporter.use('compile', htmlToText())

      transporter.sendMail(mailOptions, function (err, response) {
        if (err) {
          winston.error('ERROR sending email to ' + email + ' via ' + EMAIL_SERVICE + '!', err)
          closeEmailConnection()
        } else {
          winston.info('Message sent to ' + email + ' via ' + EMAIL_SERVICE +': ' + response.response)
          closeEmailConnection()
        }

        if (typeof callback === 'function') {
          callback(err, response)
        }
      })
    }

  }

}())
