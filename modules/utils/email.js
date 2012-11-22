// var mail = require('nodemailer'),
// mailPassword = require('./password.js'),
// super_secret = mailPassword.gmail,
// transport = mail.createTransport("SMTP",{
//     service: "Gmail",
//     auth: {
//         user: "codenberg@gmail.com",
//         pass: super_secret
//     }
// });


// exports.sendInvite = function(whom,random,callback){
//     var inviteOptions = {
// 	    from: "codenberg@gmail.com", // sender address
// 	    to: whom, // list of receivers
// 	    subject: "You made the cut!", // Subject line
// 	    html: "<h2>Hey kid!</h2><p>Verify you exist by clicking <a href='http://www.civicseed.org/signup/"+whom+"/"+random+"'>here</a>. You won't regret it.</p>" // html body
// 	}
//     transport.sendMail(inviteOptions, function(error, response){
//         if(error){
//             console.log(error);
//             return callback(true);    
//         }
//         else{
//             console.log("Message sent: " + response.message);
//             return callback(false);
//         }

//         // if you don't want to use this transport object anymore, uncomment following line
//         smtpTransport.close(); // shut down the connection pool, no more messages
//     });
// };

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

