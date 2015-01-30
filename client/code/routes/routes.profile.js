'use strict';

// TEMP
// Process resume answers and inject them into the
// profile data object as if it were already there.
function _processResumeAnswers (data) {
  var resumeAnswers = []

  for (var i = 0; i < data.resources.length; i++) {
    var resource = data.resources[i]
    if (resource.questionType === 'resume') {
      var answer = resource.answers[0]

      // startsWith...
      // Tagline
      if (answer.lastIndexOf('resume-tagline') === 0) {
        var tagline = answer.split('=')[1]
        tagline = decodeURIComponent(tagline)
        tagline = tagline.replace(/\+/g, ' ')

        if (!data.profile.tagline) {
          data.profile.tagline = tagline
        }
      }
      // Purpose
      if (answer.lastIndexOf('resume-purpose') === 0) {
        var vision = answer.split('=')[1]
        vision = decodeURIComponent(vision)
        vision = vision.replace(/\+/g, ' ')

        if (!data.profile.vision) {
          data.profile.vision = vision
        }
      }
      // Education
      if (answer.lastIndexOf('resume-education') === 0) {
        var major = answer.split('=')[1]
        major = decodeURIComponent(major)
        major = major.replace(/\+/g, ' ')

        var education = {
          school: data.school,
          major: major,
          year: 2105 // Temp
        }

        if (!data.profile.education[0]) {
          data.profile.education = [education]
        }
      }
      // Skills
      if (answer.lastIndexOf('resume-skills', 0) === 0) {
        var skills = answer.split('&')
        var processed = []

        for (var k = 0; k < skills.length; k++) {
          var skill = skills[k].split('=')[1]
          skill = decodeURIComponent(skill)
          skill = skill.replace(/\+/g, ' ')
          processed.push(skill)
        }

        if (!data.profile.skills[0]) {
          data.profile.skills = processed
        }
      }
      // Experience
      if (answer.lastIndexOf('resume-experience', 0) === 0) {
        var experience = answer.split('&')
        var processedOrg = []
        var processedSummary = []
        var processed = []

        for (var k = 0; k < experience.length; k++) {
          var item = experience[k].split('=')
          var key = item[0]
          var value = item[1] || ''
          value = decodeURIComponent(value)
          value = value.replace(/\+/g, ' ')
          if (key === 'resume-experience') {
            processedOrg.push(value)
          } else if (key === 'resume-experience-content') {
            processedSummary.push(value)
          }
        }

        for (var m = 0; m < processedOrg.length; m++) {
          var entry = {
            organization: processedOrg[m],
            summary: processedSummary[m]
          }
          processed.push(entry)
        }

        if (!data.profile.experience[0]) {
          data.profile.experience = processed
        }
      }

    }
  }

  return data
}

var self = module.exports = {

  loadRoutes: function (app) {
    var profile = require('/profile')

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

            info = _processResumeAnswers(info)

            $CONTAINER.append(JT['profiles-singleprofile'](info))
            profile.init()
          }
        }
      })
    })

  }

}
