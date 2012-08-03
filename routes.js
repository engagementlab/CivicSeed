

// exports.invite = function(req,res){
// 	res.render('invite');
// };

// exports.sendInvite = function(req,res){
// 	var em = req.body.email;
// 	console.log(em);
// 	//check db for email
// 	db.findByEmail(em,function(err,suc){
// 		if(suc){
// 			res.render('invite',{message: "user already joined."});
// 		}
// 		else{
// 			if(req.body.code=="awesome"){
// 				//generate random word, attach to url, add name in invite db
// 				var random = "welcome-to-the-jungle";
// 				mail.sendInvite(em,random,function(err,suc){
// 					if(!err){
// 						db.addInvitee(em,random,function(suc){
// 							console.log(suc);
// 						});
// 						res.render('invite',{message: "check email."});
// 					}
// 					else{
// 						res.render('invite',{message: "problem sending."});
// 					}
// 				});
// 			}
// 			else{
// 				res.render('invite',{message: "wrong code."}); 
// 			}
// 		}	
// 	});
	
// };

exports.login = function(req, res){

	var message = req.flash('error');
	
	if(message==""){
  		res.render('login', { title: 'Login' });
  	}	
  	else{
  		res.render('login', {title: 'Login', message: message});
  	}
};
// exports.forgot = function(req, res){
//   	res.render('forgot');
// };
// exports.forgotSend = function(req,res){
// 	db.getPassword(req.body,function(err,suc){
// 		if(err){
// 			console.log("not in system. does not compute.")
// 		}
// 		else{
// 			console.log("the results are in: "+ suc);
// 			mail.sendPassword(req.body.email,suc,function(err,response){
// 				if(!err){
// 					res.render('forgot',{message:'Check your mailbox. NOW.'});				
// 				}
// 				else{
// 					console.log("nope.");
// 				}
// 			});		
// 		}
// 	});
// };
// exports.profile = function(req, res){
// 	var person = req.user;
// 	if(req.user==undefined){
// 		res.redirect('/login');
// 	}
// 	else{
//   		res.render('profile',{
//   			name: person.first,
//   			played: person.played,
//   			won: person.won,
//   			lost: person.lost,
//   			level: person.level
//   		});
//   	}
// };

// exports.signup = function(req,res){
// 	console.log(req.params.email);
// 	console.log(req.params.random);
// 	//check if accepted already or not or even in DB

// 	res.render('signup',{message: req.params.email});
// };

// exports.newUser = function(req,res){
// 	//insert into DB
// 	console.log(req.body.email);
// 	db.newUser(req.body,function(result){
// 		if(result){
// 			mail.sendInvite(req.body.email,function(err,response){
// 				if(!err){
// 					res.render('joined',{name: req.body.first});	
// 				}
// 				else{
// 					console.log("nooooooo!");
// 				}
// 			});	
// 		}
// 		else{
// 			res.render('signup',{message: 'sorry kid, that email is used.'})
// 		}
// 	});
// };

// exports.showAll = function(req,res){
// 	db.showAll(function(result){
// 		console.log(result);
// 		res.render('showAll',{data: result});
// 	});
// }
// exports.testEmail = function(req,res){
// 	mail.sendMail(function(c){
// 		if(c){
// 			res.render('emailSent',{message:"You sent an e-mail. Amazing."});
// 		}
// 		else{
// 			res.render('emailSent',{message:"You are a failure."});
// 		}
// 	});
// }
// exports.lobby = function(req,res){
// 	if(req.user==undefined){
// 		res.redirect('/login');
// 	}
// 	else{
// 		res.render('lobby',{name: req.user.first});
// 	}
	
// }
