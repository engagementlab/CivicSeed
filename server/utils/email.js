'use strict'

var nodemailer = require('nodemailer')
var htmlToText = require('nodemailer-html-to-text').htmlToText
var winston = require('winston')

var rootDir = process.cwd()
var config = require(rootDir + '/app/config')
var NAME = config.get('NAME')
var EMAIL_USER = config.get('EMAIL_USER')
var EMAIL_PW = config.get('EMAIL_PW')
var EMAIL_SERVICE = config.get('EMAIL_SERVICE')

var transporter
var mailOptions = {
  from: NAME + ' <' + EMAIL_USER + '>',
  to: '',
  replyTo: EMAIL_USER,
  subject: '',
  text: '',
  html: ''
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

function sendEmail (subject, html, email, callback) {
  mailOptions.to = email
  mailOptions.subject = subject
  mailOptions.html = html

  openEmailConnection()

  transporter.use('compile', htmlToText())

  transporter.sendMail(mailOptions, function (err, response) {
    if (err) {
      winston.error('ERROR sending email to ' + email + ' via ' + EMAIL_SERVICE + '!', err)
      closeEmailConnection()
    } else {
      winston.info('Message sent to ' + email + ' via ' + EMAIL_SERVICE + ': ' + response.response)
      closeEmailConnection()
    }

    if (typeof callback === 'function') {
      callback(err, response)
    }
  })
}

module.exports = {
  sendEmail: sendEmail
}
