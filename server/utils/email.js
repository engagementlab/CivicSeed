var rootDir       = process.cwd(),
    nodemailer    = require('nodemailer'),
    config        = require(rootDir + '/config'),
    accountName   = config.get('NAME'),
    emailUser     = config.get('EMAIL_USER'),
    emailPassword = config.get('EMAIL_PW'),
    emailService  = config.get('EMAIL_SERVICE'),
    smtpTransport,
    mailOptions   = {
      from: accountName + ' <' + emailUser + '>',
      replyTo: emailUser,
      to: '',
      subject: '',
      html: '',
      generateTextFromHTML: true
    }

var self = module.exports = {

  openEmailConnection: function () {
    smtpTransport = nodemailer.createTransport('SMTP', {
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    })
  },

  sendEmail: function (subject, html, email) {
    mailOptions.subject = subject
    mailOptions.html    = html
    mailOptions.to      = email
    smtpTransport.sendMail(mailOptions, function (err, response) {
      if (err) {
        console.error('ERROR sending email to ' + email + ' via ' + emailService + '!', err)
      }
      else {
        console.log('Message sent to ' + email + ' via ' + emailService +': ' + response.message)
      }
    })
  },

  closeEmailConnection: function () {
    smtpTransport.close()
  }

}

// mailPassword = require('./password.js'),
// super_secret = mailPassword.gmail,

// exports.sendPassword = function(whom,it,callback){
//     var passOptions = {
//     from: "codenberg@gmail.com", // sender address
//     to: whom, // list of receivers
//     subject: "Forgot Something?", // Subject line
//     html: "<h2>You Dummy!</h2><p>You forgot your password huh? Well, <a href='tbd'>go here</a> to reset it.</p>"
//     }
//     transport.sendMail(passOptions, function(error, response){
//         if(error){
//             console.log(error);
//             return callback(true,null);
//         }
//         else{
//             console.log("Message sent: " + response.message);
//             return callback(null,true)
//         }

//         // if you don't want to use this transport object anymore, uncomment following line
//         smtpTransport.close(); // shut down the connection pool, no more messages
//     });
// }
