module.exports = function (app, service) {

	var users = service.useModel('user-model');

    app.get('/signup/:email/:random',  function(req, res) {
        res.render('signup.hbs', {
            title: ' {:: Civic Seed - Sign Up ::} ',message:"One last step...",eMail:req.params.email}
        );
    });

    app.post('/signup',  function(req, res){

        var email = req.body.email,
        firstName = req.body.firstName,
        lastName = req.body.lastName,
        password = req.body.password,
        confirmPassword = req.body.confirmPassword;

        // addUser(email,firstName,lastName,password,confirmPassword,function(err,result){
        // 	//render something
        // });

    });

    //insert into DB
	addUser = function(email,first,last,pass,pass2){
		// console.log(req.body.email);
		// db.newUser(req.body,function(result){
		// 	if(result){
		// 		mail.sendInvite(req.body.email,function(err,response){
		// 			if(!err){
		// 				res.render('joined',{name: req.body.first});	
		// 			}
		// 			else{
		// 				console.log("nooooooo!");
		// 			}
		// 		});	
		// 	}
		// 	else{
		// 		res.render('signup',{message: 'sorry kid, that email is used.'})
		// 	}
		// });
	};

};
