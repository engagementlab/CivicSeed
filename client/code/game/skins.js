'use strict';

var $skins = $game.$skins = {

  ready: false,

  data: {
    'outfits': {
      'basic': {
        'id': 'basic',
        'name': 'Default Look',
        'description': 'This is you. You look great!',
        'effect': null,
        'flag': null,
        'head': {
          'name': 'Default Head',
          'description': 'Your beautiful face.',
          'effect': null,
          'flag': null
        },
        'torso': {
          'name': 'Default Body',
          'description': 'Your heart is in here somewhere.',
          'effect': null,
          'flag': null
        },
        'legs': {
          'name': 'Default Legs',
          'description': 'These legs are made for walking.',
          'effect': null,
          'flag': null
        }
      },
      'tuxedo': {
        'id': 'tuxedo',
        'name': 'Tuxedo',
        'description': 'You are ready for a night out on Calliope!',
        'effect': 'A top hat makes any outfit classier, right?',
        'flag': '',
        'head': {
          'name': 'Tuxedo Mask',
          'description': 'My, but you look dashing!',
          'effect': '???',
          'flag': ''
        },
        'torso': {
          'name': 'Tuxedo Jacket',
          'description': 'Or maybe more of a cummerbund...',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Tuxedo Pants',
          'description': 'Don’t forget to shine your shoes.',
          'effect': '',
          'flag': ''
        }
      },
      'lion': {
        'id': 'lion',
        'name': 'Lion',
        'description': 'You are Lion. Hear you roar.',
        'effect': 'I wonder how this head would look on different bodies...',
        'flag': '',
        'head': {
          'name': 'Lion Head',
          'description': 'The Mane Event.',
          'effect': '???',
          'flag': ''
        },
        'torso': {
          'name': 'Lion Body',
          'description': 'Have you been working out?',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Lion Legs',
          'description': 'Don’t press paws.',
          'effect': '',
          'flag': ''
        }
      },
      'cactus': {
        'id': 'cactus',
        'name': 'Cactus',
        'description': 'Your prickly personality hides a beautiful desert bloom.',
        'effect': 'How does a cactus get ahead?',
        'flag': '',
        'head': {
          'name': 'Cactus Head',
          'description': 'You’re ready to “Head” over to the Ranch...',
          'effect': '???',
          'flag': ''
        },
        'torso': {
          'name': 'Cactus Body',
          'description': 'How about a hug?',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Cactus Legs',
          'description': 'You’re the fastest cactus in the west.',
          'effect': '',
          'flag': ''
        }
      },
      'cone': {
        'id': 'cone',
        'name': 'Ice Cream Cone',
        'description': 'You look delicious.',
        'effect': 'Have you heard the legend of the Sprinkle-Saurus?',
        'flag': '',
        'head': {
          'name': 'Strawberry Scoop',
          'description': 'So cold. So fare.',
          'effect': '???',
          'flag': ''
        },
        'torso': {
          'name': 'Sugar Cone Top',
          'description': 'CRUNCH!',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Sugar Cone Bottom',
          'description': 'Don’t spring a leak!',
          'effect': '',
          'flag': ''
        }
      },
      'astronaut': {
        'id': 'astronaut',
        'name': 'Astronaut',
        'description': 'You’re ready for the final frontier.',
        'effect': 'You have global radar. All characters with resources are highlighted in the mini-map!',
        'flag': '',
        'head': {
          'name': 'Space Helmet',
          'description': 'Ground Control to Major Tom...',
          'effect': 'You have local radar. Characters with resources near you are highlighted.',
          'flag': ''
        },
        'torso': {
          'name': 'Space Suit',
          'description': 'Commencing countdown, engines on.',
          'effect': 'You have local radar. Characters with resources near you are highlighted.',
          'flag': ''
        },
        'legs': {
          'name': 'Space Pants',
          'description': 'Press ignition, and may space pants be with you!',
          'effect': 'You have local radar. Characters with resources near you are highlighted',
          'flag': ''
        }
      },
      'ninja': {
        'id': 'ninja',
        'name': 'Ninja',
        'description': 'A shady ninja costume.',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Ninja Mask',
          'description': 'You could be anybody.',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Ninja Gi',
          'description': 'This mysterious Gi can grant you powers...',
          'effect': '???',
          'flag': ''
        },
        'legs': {
          'name': 'Ninja Pants',
          'description': 'These pants of mystery must be combined the Gi...',
          'effect': '???',
          'flag': ''
        }
      },
      'horse': {
        'id': 'horse',
        'name': 'Horse',
        'description': 'You’re a horse!',
        'effect': 'You walk a lot faster!',
        'flag': 'speed-max',
        'head': {
          'name': 'Horse Head',
          'description': 'You have a horse’s head. The best part of the horse.',
          'effect': 'You walk slightly faster.',
          'flag': 'speed-up'
        },
        'torso': {
          'name': 'Horse Body',
          'description': 'You have a horse’s body. You’re probably mythical.',
          'effect': 'You walk slightly faster.',
          'flag': 'speed-up'
        },
        'legs': {
          'name': 'Horse Legs',
          'description': 'Get ready to gallop!',
          'effect': 'You walk slightly faster.',
          'flag': 'speed-up'
        }
      },
      'penguin': {
        'id': 'penguin',
        'name': 'Penguin',
        'description': 'Hey, don’t you already have a tuxedo?',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Penguin Head',
          'description': 'How adorable!',
          'effect': '???',
          'flag': ''
        },
        'torso': {
          'name': 'Penguin Suit',
          'description': 'Nice flippers!',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Penguin Feet',
          'description': 'Looks like you’re ready to march 1,000 miles and sit on an egg.',
          'effect': '',
          'flag': ''
        }
      },
      'dinosaur': {
        'id': 'dinosaur',
        'name': 'Dinosaur',
        'description': 'You’re an awesome dinosaur. The ground shakes at your approach!',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Dinosaur Head',
          'description': 'So scale. Much teeth.',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Dinosaur Body',
          'description': 'Making things into ’zillas since 2013.',
          'effect': '???',
          'flag': ''
        },
        'legs': {
          'name': 'Dinosaur Legs',
          'description': 'Combine with Dino Body for ultimate stompage.',
          'effect': '???',
          'flag': ''
        }
      },
      'octopus': {
        'id': 'octopus',
        'name': 'Octopus',
        'description': 'You’re an octopus, smartest of all cephalopods.',
        'effect': 'Your paint radius goes up by three.',
        'flag': 'paint-max',
        'head': {
          'name': 'Octopus Head',
          'description': 'Where the octo-brain is kept.',
          'effect': 'Your paint radius goes up by one.',
          'flag': 'paint-up-1'
        },
        'torso': {
          'name': 'Octopus Body',
          'description': 'Technically octopuses don’t have heads, just bodies. The more you know.',
          'effect': 'Your paint radius goes up by one.',
          'flag': 'paint-up-2'
        },
        'legs': {
          'name': 'Eight Legs',
          'description': 'They see you crawling. You painting.',
          'effect': 'Your paint radius goes up by one.',
          'flag': 'paint-up-3'
        }
      },
      'hunter': {
        'id': 'hunter',
        'name': 'Forest Hunter',
        'description': 'You stalk the forest like the lion ninja you are.',
        'effect': 'You can teleport to the forest! Just chat FOREST (all caps)',
        'flag': 'teleport-forest',
        'parts': {
          'head': 'lion',
          'torso': 'ninja',
          'legs': 'ninja'
        }
      },
      'mariner': {
        'id': 'mariner',
        'name': 'Sub-Mariner',
        'description': 'You are at home in aquatic environments.',
        'effect': 'You can teleport to the port! Just chat PORT (all caps)',
        'flag': 'teleport-port',
        'parts': {
          'head': 'penguin',
          'torso': 'ninja',
          'legs': 'ninja'
        }
      },
      'rancher': {
        'id': 'rancher',
        'name': 'Ranch Ronin',
        'description': 'The stealth cactus could be anywhere.',
        'effect': 'You can teleport to the ranch! Just chat RANCH (all caps)',
        'flag': 'teleport-ranch',
        'parts': {
          'head': 'cactus',
          'torso': 'ninja',
          'legs': 'ninja'
        }
      },
      'mayor': {
        'id': 'mayor',
        'name': 'Ninja Mayor',
        'description': 'You’re the king or queen of town.',
        'effect': 'You can teleport to Calliope Town Square! Just chat TOWN (all caps)',
        'flag': 'teleport-town',
        'parts': {
          'head': 'tuxedo',
          'torso': 'ninja',
          'legs': 'ninja'
        }
      },
      'sprinkle': {
        'id': 'sprinkle',
        'name': 'Sprinklesaurus Rex',
        'description': 'A cold-blooded cone with extra sprinkles.',
        'effect': 'You gain 10 paintbrush seeds every time you click “Seed it!” on a friend’s response.',
        'flag': 'pledge-reward',
        'parts': {
          'head': 'dinosaur',
          'torso': 'cone',
          'legs': 'cone'
        }
      }
    }
  },

  init: function () {
  },

  resetInit: function () {
  },

  // Returns an array of skin names (sets, not special outfits)
  getSetsList: function () {
    var data = $skins.data.outfits,
        list = []

    for (var i in data) {
      if (!data[i].parts) list.push(data[i].id)
    }

    return list
  },

  // Returns filtered object collection of sets (without special outfits)
  getSets: function () {
    var data = $skins.data.outfits

    return _.filter(data, function (item) { return !item.parts} )
  },

  // Returns a particular set
  getSkin: function (id) {
    return _.find($game.$skins.getSets(), function (item) { return item.id === id })
  },

  // Unlock a new skin
  unlockSkin: function (skin, part) {
    var playerSkin = $game.$player.getSkinSuit()

    if (part !== undefined) {
      // Specify a part to unlock
      playerSkin.unlocked[part].push(skin)
      $game.addBadgeCount('.hud-skinventory', 1)
    }
    else {
      // Assume all parts of the skin is unlocked
      playerSkin.unlocked.head.push(skin)
      playerSkin.unlocked.torso.push(skin)
      playerSkin.unlocked.legs.push(skin)
      $game.addBadgeCount('.hud-skinventory', 3)
    }

    // Update skinventory
    $skins.updateSkinventory(skin)
    _skins.updatePlayer(playerSkin)
  },

  // Called when a skin suit is unlocked to render its unlocked appearance.
  updateSkinventory: function (skin) {
    // Unlock an entire skin easily
    var head  = $('.head [data-name="' + skin + '"]')
    var torso = $('.torso [data-name="' + skin + '"]')
    var legs  = $('.legs [data-name="' + skin + '"]')
    _skins.renderUnlockedPart(head, skin, 'head', true)
    _skins.renderUnlockedPart(torso, skin, 'torso', true)
    _skins.renderUnlockedPart(legs, skin, 'legs', true)
  },

  // For debug purposes, reset everything but basic skin
  resetSkinventory: function () {
    var playerSkin = $game.$player.getSkinSuit()

    // Reset unlocked array
    playerSkin.unlocked.head  = ['basic']
    playerSkin.unlocked.torso = ['basic']
    playerSkin.unlocked.legs  = ['basic']

    $game.$player.setSkinSuit('basic')

    $skins.renderSkinventory()          // Re-render with reset skins
    $skins.updateSkinventory('basic')   // Then update with basic skin
    _skins.updatePlayer(playerSkin)
  },

  // Creates HTML content for the structure of suit parts
  renderSkinventory: function () {
    var playerSkin = $game.$player.getSkinSuit(),
        unlocked   = playerSkin.unlocked,
        skins      = this.getSets()

    function _render (skin, part) {
      var skinHTML   = '<div class="outer locked" data-name="' + skin.id + '" title="(locked)" data-placement="bottom"><div class="inner"><i class="fa fa-lock"></i></div><div class="badge-new"><i class="fa fa-star"></i></div></div>',
          $part      = $('.' + part),
          $el        = $(skinHTML)

      $part.append($el)

      // Check if currently selected
      if (skin.id === playerSkin[part]) $el.addClass('equipped')

      // Check if unlocked and set display accordingly
      for (var h = 0; h < unlocked[part].length; h++) {
        if (unlocked[part][h] === skin.id) {
          _skins.renderUnlockedPart($el, skin, part)
          break
        }
      }

      // Bind actions
      $el.on('mouseenter', function () {
        $(this).tooltip('show')
      })
      $el.on('click', function () {
        $(this).find('.badge-new:visible').hide()
      })
    }

    // Reset parts
    $('#skinventory .head').empty()
    $('#skinventory .torso').empty()
    $('#skinventory .legs').empty()

    // For each skin, create display element and render
    for (var id in skins) {
      _render(skins[id], 'head')
      _render(skins[id], 'torso')
      _render(skins[id], 'legs')
    }

    // Display skinformation
    $skins.renderSkinformation()
  },

  // Creates HTML content showing information about currently worn parts or outfits.
  renderSkinformation: function () {
    var playerSkin = $game.$player.getSkinSuit(),
        skins      = $skins.data.outfits,
        head       = playerSkin.head,
        torso      = playerSkin.torso,
        legs       = playerSkin.legs,
        content    = ''

    function _createPartString (skin, part) {
      var string = '<strong>' + skins[skin][part].name + '.</strong>'
      if (skins[skin][part].description) {
        string += ' ' + skins[skin][part].description
      }
      if (skins[skin][part].effect) {
        string += ' <span class="color-orange">Effect:</span> <span class="color-blue">' + skins[skin][part].effect + '</span>'
      }

      // Set individual part flags as well
      if (skins[skin][part].flag) {
        $game.setFlag(skins[skin][part].flag)
      }

      return string
    }

    // Display inventory data
    // The game doesn't store "full set" data, so we compare the parts to see if this is the case
    var outfit = _skins.getOutfit(head, torso, legs)

    // Also, clear & set skin effect flags here (Not the best place to put it...!)
    _skins.clearSkinFlags()

    if (outfit) {
      content += '<strong>' + outfit.name + '</strong><br>' + outfit.description
      if (outfit.effect) {
        content += '<br><strong><span class="color-orange">Outfit bonus:</span> <span class="color-blue">' + outfit.effect + '</span></strong>'
      }
      if (outfit.flag) {
        $game.setFlag(outfit.flag)
      }
    }
    else {
      content += _createPartString(head, 'head')
      content += '<br>' + _createPartString(torso, 'torso')
      content += '<br>' + _createPartString(legs, 'legs')
    }

    $('.skinformation p').html(content)
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _skins = {

  // Clear all effects of skins sets and parts
  clearSkinFlags: function () {
    // Effects are stored as game flags.
    // Get all flags
    var data      = $skins.data.outfits,
        setFlags  = _.pluck(data, 'flag'),
        partFlags = _.chain(data)
                     .map(function (value, key, list) {
                       if (list[key].head) return [list[key].head.flag, list[key].torso.flag, list[key].legs.flag]
                     })
                     .flatten()
                     .compact()
                     .value(),
        flags     = _.compact(_.union(setFlags, partFlags))

    // Clear all flags
    _.each(flags, $game.removeFlag)
  },

  // If parts are part of an outfit, returns an object containing outfit data.
  getOutfit: function (head, torso, legs) {
    var data = $skins.data.outfits

    // If everything is equal, player is wearing a full set
    if (head === torso && torso === legs) {
      return data[head]
    }
    // If everything is not equal, check if player is wearing a special outfit.
    else {
      var parts = {
        'head': head,
        'torso': torso,
        'legs': legs
      }
      // Returns outfit data, or undefined if not found.
      return _.find(data, function (each) {
        return _.isEqual(each.parts, parts)
      })
    }
  },

  // If a part is unlocked, display it as such
  renderUnlockedPart: function ($el, skin, part, isNew) {
    // skin is either the name of the skin or the skin object itself
    // Either way, we want to end up with the skin object.
    if (typeof skin == 'string') {
      skin = $skins.data.outfits[skin]
    }

    var $inner = $el.find('.inner'),
        bg     = CivicSeed.CLOUD_PATH + '/img/game/skins/' + skin.id + '.png'

    $el.removeClass('locked')
    $el.attr('title', skin[part].name)
    $inner.css('backgroundImage', 'url(' + bg + ')')
    $inner.find('i').remove()
    $inner.html('')
    if (isNew === true) {
      $el.find('.badge-new').show()
    }
  },

  // Saves current skin information to the database
  updatePlayer: function (playerSkin) {
    ss.rpc('game.player.updateGameInfo', {
      id: $game.$player.id,
      skinSuit: playerSkin
    })
  }

}
