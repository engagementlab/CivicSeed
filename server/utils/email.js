'use strict';

var nodemailer    = require('nodemailer'),
    htmlToText    = require('nodemailer-html-to-text').htmlToText

var rootDir       = process.cwd(),
    config        = require(rootDir + '/app/config'),
    NAME          = config.get('NAME'),
    EMAIL_USER    = config.get('EMAIL_USER'),
    EMAIL_PW      = config.get('EMAIL_PW'),
    EMAIL_SERVICE = config.get('EMAIL_SERVICE')

var transporter,
    mailOptions   = {
      from: NAME + ' <' + EMAIL_USER + '>',
      to: '',
      replyTo: EMAIL_USER,
      subject: '',
      text: '',
      html: ''
    }

var self = module.exports = {

  openEmailConnection: function () {
    transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PW
      }
    })
  },

  sendEmail: function (subject, html, email) {
    mailOptions.to      = email
    mailOptions.subject = subject
    mailOptions.html    = html

    transporter.use('compile', htmlToText())

    transporter.sendMail(mailOptions, function (err, response) {
      if (err) {
        console.error('ERROR sending email to ' + email + ' via ' + EMAIL_SERVICE + '!', err)
      } else {
        console.log('Message sent to ' + email + ' via ' + EMAIL_SERVICE +': ' + response.response)
      }
    })
  },

  closeEmailConnection: function () {
    transporter.close()
  }

}
