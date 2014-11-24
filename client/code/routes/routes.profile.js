'use strict';

var self = module.exports = {

  loadRoutes: function (app) {
    var profile = require('/profile')
    profile.init()

    app.get('/profiles', function (req) {
      ss.rpc('shared.profiles.getAllProfiles', function (users) {
        $CONTAINER.append(JT['profiles-allprofiles']({
          users: users
        }))
      })
    })

    app.get('/profiles/:playerId', function (req) {
      ss.rpc('shared.profiles.getProfileInformation', req.params['playerId'], function (info) {
        if (!info) {
          console.log('error!')
        } else {
          if (!info.profileSetup && sessionStorage.userEmail === info.email) {
            //reroute to change info
            Davis.location.assign('change-info')
          } else {
            info.postgameSurveyLink = CivicSeed.SURVEY_POSTGAME_LINK
            $CONTAINER.append(JT['profiles-singleprofile'](info))
          }
        }
      })
    })

  }

}
