var self = module.exports = {

	loadRoutes: function($app) {
		var profile = require('/profile');
		profile.init();

		$app.get('/profiles', function(req) {
			ss.rpc('shared.profiles.getAllProfiles', function (users) {
				$CONTAINER.append(JT['profiles-allprofiles']({
					users: users
				}));
			});
		});

		$app.get('/profiles/:random', function(req) {
			ss.rpc('shared.profiles.getProfileInformation', req.params['random'], function(info) {
				if(!info) {
					console.log('error!');
				} else {
					if(!info.profileSetup && sessionStorage.userEmail === info.email) {
						//reroute to change info
						Davis.location.assign('change-info');
					} else {
						info.pregameSurveyLink = CivicSeed.SURVEY_PREGAME_LINK;
						info.postgameSurveyLink = CivicSeed.SURVEY_POSTGAME_LINK;
						// console.log(info);
						$CONTAINER.append(JT['profiles-singleprofile'](info));
					}
				}
			});
		});

	}

};
