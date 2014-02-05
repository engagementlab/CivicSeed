'use strict';

var $skins = $game.$skins = {

  ready: false,

  data: {
    'sets': {
      'basic': {
        'id': 'basic',
        'name': 'Default Look',
        'description': 'This is you. You look great!',
        'effect': null,
        'modifiers': null,
        'head': {
          'name': 'Default Head',
          'description': 'Your beautiful face.',
          'effect': null,
          'modifiers': null
        },
        'torso': {
          'name': 'Default Body',
          'description': 'Your heart is in here somewhere.',
          'effect': null,
          'modifiers': null
        },
        'legs': {
          'name': 'Default Legs',
          'description': 'These legs are made for walking.',
          'effect': null,
          'modifiers': null
        }
      },
      'tuxedo': {
        'id': 'tuxedo',
        'name': 'Tuxedo',
        'description': '',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Tuxedo Mask',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Tuxedo Jacket',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Tuxedo Pants',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'lion': {
        'id': 'lion',
        'name': 'Lion',
        'description': '',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Lion Head',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Lion Body',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Lion Legs',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'cactus': {
        'id': 'cactus',
        'name': 'Cactus',
        'description': '',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Cactus Head',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Cactus Body',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Cactus Legs',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'cone': {
        'id': 'cone',
        'name': 'Ice Cream Cone',
        'description': 'You look delicious.',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Strawberry Scoop',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Sugar Cone Top',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Sugar Cone Bottom',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'astronaut': {
        'id': 'astronaut',
        'name': 'Astronaut',
        'description': 'This allows you to explore in space.',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Space Helmet',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Space Suit',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Space Pants',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'ninja': {
        'id': 'ninja',
        'name': 'Ninja',
        'description': 'A shady ninja costume.',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Ninja Mask',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Ninja Gi',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Ninja Pants',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'horse': {
        'id': 'horse',
        'name': 'Horse',
        'description': 'You’re a horse!',
        'effect': 'You walk a lot faster!',
        'modifiers': '',
        'head': {
          'name': 'Horse Head',
          'description': '',
          'effect': 'You walk slightly faster.',
          'modifiers': ''
        },
        'torso': {
          'name': 'Horse Body',
          'description': '',
          'effect': 'You walk slightly faster.',
          'modifiers': ''
        },
        'legs': {
          'name': 'Horse Legs',
          'description': '',
          'effect': 'You walk slightly faster.',
          'modifiers': ''
        }
      },
      'penguin': {
        'id': 'penguin',
        'name': 'Penguin',
        'description': '',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Penguin Head',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Penguin Suit',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Penguin Feet',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'dinosaur': {
        'id': 'dinosaur',
        'name': 'Dinosaur',
        'description': '',
        'effect': '',
        'modifiers': '',
        'head': {
          'name': 'Dinosaur Head',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'torso': {
          'name': 'Dinosaur Body',
          'description': '',
          'effect': '',
          'modifiers': ''
        },
        'legs': {
          'name': 'Dinosaur Legs',
          'description': '',
          'effect': '',
          'modifiers': ''
        }
      },
      'octopus': {
        'id': 'octopus',
        'name': 'Octopus',
        'description': '',
        'effect': 'Your paint radius goes up by three.',
        'modifiers': '',
        'head': {
          'name': 'Octopus Head',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'modifiers': ''
        },
        'torso': {
          'name': 'Octopus Body',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'modifiers': ''
        },
        'legs': {
          'name': 'Eight Legs',
          'description': '',
          'effect': 'Your paint radius goes up by one.',
          'modifiers': ''
        }
      }
    },
    'outfits': {
      'hunter': {
        'id': 'hunter',
        'name': 'Forest Hunter',
        'description': 'You stalk the forest like the lion ninja you are.',
        'effect': 'You can teleport to the forest! Just chat FOREST (all caps)',
        'modifiers': null,
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
        'modifiers': null,
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
        'modifiers': null,
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
        'modifiers': null,
        'parts': {
          'head': 'tuxedo',
          'torso': 'ninja',
          'legs': 'ninja'
        }
      },
      'sprinkle': {
        'id': 'sprinkle',
        'name': 'Sprinklesaurus Rex',
        'description': 'A cold-blooded cone with extra sprinkles',
        'effect': 'You gain 10 paintbrush seeds every time you click “Seed it!” on a friend’s response',
        'modifiers': null,
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

  // Creates an array of skin names
  getSkinsList: function () {
    var list = []
    for (var i in $skins.data.sets) {
      list.push($skins.data.sets[i].id)
    }
    return list
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
    _updatePlayer(playerSkin)
  },

  updateSkinventory: function (skin) {
    // Unlock an entire skin easily
    var head  = $('.head [data-name="' + skin + '"]')
    var torso = $('.torso [data-name="' + skin + '"]')
    var legs  = $('.legs [data-name="' + skin + '"]')
    _renderUnlockedPart(head, skin, 'head', true)
    _renderUnlockedPart(torso, skin, 'torso', true)
    _renderUnlockedPart(legs, skin, 'legs', true)
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
    _updatePlayer(playerSkin)
  },

  renderSkinventory: function () {
    var playerSkin = $game.$player.getSkinSuit(),
        unlocked   = playerSkin.unlocked,
        skins      = $skins.data.sets

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
          _renderUnlockedPart($el, skin, part)
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
        skins      = $skins.data.sets,
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
        string += ' (' + skins[skin][part].effect + ')'
      }
      return string
    }

    // Display inventory data
    // The game doesn't store "full set" data, so we compare the parts to see if this is the case
    if (head === torso && torso === legs) {
      var suit = head
      content += '<strong>' + skins[suit].name + '.</strong> ' + skins[suit].description
      if (suit != 'basic') {
        content += ' Complete outfit bonus!'
      }
      if (skins[suit].effect) {
        content += ' (' + skins[suit].effect + ')'
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

/***** PRIVATE FUNCTIONS ******/


function _renderUnlockedPart ($el, skin, part, isNew) {
  // skin is either the name of the skin or the skin object itself
  // Either way, we want to end up with the skin object.
  if (typeof skin == 'string') {
    skin  = $skins.data.sets[skin]
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
}

function _updatePlayer (playerSkin) {
  ss.rpc('game.player.updateGameInfo', {
    id: $game.$player.id,
    skinSuit: playerSkin
  })
}
