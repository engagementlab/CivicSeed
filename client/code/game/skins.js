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
        'description': '',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Tuxedo Mask',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Tuxedo Jacket',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Tuxedo Pants',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'lion': {
        'id': 'lion',
        'name': 'Lion',
        'description': '',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Lion Head',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Lion Body',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Lion Legs',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'cactus': {
        'id': 'cactus',
        'name': 'Cactus',
        'description': '',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Cactus Head',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Cactus Body',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Cactus Legs',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'cone': {
        'id': 'cone',
        'name': 'Ice Cream Cone',
        'description': 'You look delicious.',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Strawberry Scoop',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Sugar Cone Top',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Sugar Cone Bottom',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'astronaut': {
        'id': 'astronaut',
        'name': 'Astronaut',
        'description': 'This allows you to explore in space.',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Space Helmet',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Space Suit',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Space Pants',
          'description': '',
          'effect': '',
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
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Ninja Gi',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Ninja Pants',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'horse': {
        'id': 'horse',
        'name': 'Horse',
        'description': 'You’re a horse!',
        'effect': 'You walk a lot faster!',
        'flag': '',
        'head': {
          'name': 'Horse Head',
          'description': '',
          'effect': 'You walk slightly faster.',
          'flag': 'horse-head'
        },
        'torso': {
          'name': 'Horse Body',
          'description': '',
          'effect': 'You walk slightly faster.',
          'flag': ''
        },
        'legs': {
          'name': 'Horse Legs',
          'description': '',
          'effect': 'You walk slightly faster.',
          'flag': ''
        }
      },
      'penguin': {
        'id': 'penguin',
        'name': 'Penguin',
        'description': '',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Penguin Head',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Penguin Suit',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Penguin Feet',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'dinosaur': {
        'id': 'dinosaur',
        'name': 'Dinosaur',
        'description': '',
        'effect': '',
        'flag': '',
        'head': {
          'name': 'Dinosaur Head',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'torso': {
          'name': 'Dinosaur Body',
          'description': '',
          'effect': '',
          'flag': ''
        },
        'legs': {
          'name': 'Dinosaur Legs',
          'description': '',
          'effect': '',
          'flag': ''
        }
      },
      'octopus': {
        'id': 'octopus',
        'name': 'Octopus',
        'description': '',
        'effect': 'Your paint radius goes up by three.',
        'flag': '',
        'head': {
          'name': 'Octopus Head',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'flag': ''
        },
        'torso': {
          'name': 'Octopus Body',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'flag': ''
        },
        'legs': {
          'name': 'Eight Legs',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'flag': ''
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

  getSkin: function (id) {
    return _.find($game.$skins.getSets(), function (item) { return item.id === id })
  },

  // Unlock a new skin
  unlockSkin: function (skin, part) {
    var playerSkin = $game.$player.getSkinSuit()

    if (part !== undefined) {
      // Specify a part to unlock
      playerSkin.unlocked[part].push(skin)
      $game.addBadgeCount('.skinventoryButton', 1)
    }
    else {
      // Assume all parts of the skin is unlocked
      playerSkin.unlocked.head.push(skin)
      playerSkin.unlocked.torso.push(skin)
      playerSkin.unlocked.legs.push(skin)
      $game.addBadgeCount('.skinventoryButton', 3)
    }

    // Update skinventory
    $skins.updateSkinventory(skin)
    _skins.updatePlayer(playerSkin)
  },

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
    $('.skinventory .head').empty()
    $('.skinventory .torso').empty()
    $('.skinventory .legs').empty()

    // For each skin, create display element and render
    for (var id in skins) {
      _render(skins[id], 'head')
      _render(skins[id], 'torso')
      _render(skins[id], 'legs')
    }

    // Display skinformation
    $skins.renderSkinformation()
  },

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
        $game.$player.setFlag(skins[skin][part].flag)
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
        $game.$player.setFlag(outfit.flag)
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

  // Clear all effect flags set by skins sets and parts
  clearSkinFlags: function () {
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
    _.each(flags, $game.$player.removeFlag)
  },

  // Check if parts are part of an outfit
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

  updatePlayer: function (playerSkin) {
    ss.rpc('game.player.updateGameInfo', {
      id: $game.$player.id,
      skinSuit: playerSkin
    })
  }

}
