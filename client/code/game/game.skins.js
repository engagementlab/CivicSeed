'use strict'
/* global CivicSeed, $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    skins.js

    - Skinventory UI management
    - Skinventory data management
    - Stores outfit data
    - Do not do set/get player data here; that occurs on player.js

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var _ = require('underscore')
var data = require('/data.skinsuits')

// Returns an array of skin names (sets, not special outfits, not basic colors)
function getSetsList () {
  var outfits = data.outfits
  var list = []

  for (var i in outfits) {
    if (!outfits[i].parts) list.push(outfits[i].id)
  }

  return list
}

// Returns filtered object collection of sets (without special outfits)
function getSets () {
  var outfits = data.outfits

  return _.filter(outfits, function (item) {
    return !item.parts
  })
}

// Returns a particular set
function getSkin (id) {
  return _.find(getSets(), function (item) {
    return item.id === id
  })
}

// Unlock a new skin
function unlockSkin (skin, part) {
  var skinventory = $game.$player.getSkinventory()

  if (part !== undefined) {
    // If part already exists, skip.
    if (!_.contains(skinventory[part], skin)) {
      // Specify a part to unlock
      skinventory[part].push(skin)
      $game.addBadgeCount('.hud-skinventory', 1)
    }
  } else {
    // Assume all parts of the skin is unlocked
    if (!_.contains(skinventory.head, skin)) {
      skinventory.head.push(skin)
      $game.addBadgeCount('.hud-skinventory', 1)
    }
    if (!_.contains(skinventory.torso, skin)) {
      skinventory.torso.push(skin)
      $game.addBadgeCount('.hud-skinventory', 1)
    }
    if (!_.contains(skinventory.legs, skin)) {
      skinventory.legs.push(skin)
      $game.addBadgeCount('.hud-skinventory', 1)
    }
  }

  // Update skinventory
  updateSkinventoryUI(skin)
  $game.$player.setSkinventory(skinventory)
}

// Called when a skin suit is unlocked to render its unlocked appearance.
function updateSkinventoryUI (skin) {
  // Unlock an entire skin easily
  var head = $('.head [data-name="' + skin + '"]')
  var torso = $('.torso [data-name="' + skin + '"]')
  var legs = $('.legs [data-name="' + skin + '"]')
  renderUnlockedPart(head, skin, 'head', true)
  renderUnlockedPart(torso, skin, 'torso', true)
  renderUnlockedPart(legs, skin, 'legs', true)
}

// For debug purposes, reset everything but basic skin
function resetSkinventory () {
  var skinventory = $game.$player.getSkinventory()

  // Reset skinventory unlocked array
  skinventory.head = ['basic']
  skinventory.torso = ['basic']
  skinventory.legs = ['basic']

  $game.$player.setSkinSuit('basic')

  renderSkinventoryUI()          // Re-render with reset skins
  updateSkinventoryUI('basic')   // Then update with basic skin
  $game.$player.setSkinventory(skinventory)
}

// Creates HTML structure of Skinventory
function renderSkinventoryUI () {
  var playerSkin = $game.$player.getSkinSuit()
  var unlocked = $game.$player.getSkinventory()
  var skins = getSets()

  function _render (skin, part) {
    var skinHTML = '<div class="outer locked" data-name="' + skin.id + '"><div class="inner"><i class="fa fa-lock"></i></div><div class="badge-new"><i class="fa fa-star"></i></div></div>'
    var $part = $('.' + part)
    var $el = $(skinHTML)

    $part.append($el)

    // Check if currently selected
    if (skin.id === playerSkin[part]) $el.addClass('equipped')

    // Check if unlocked and set display accordingly
    for (var h = 0; h < unlocked[part].length; h++) {
      if (unlocked[part][h] === skin.id) {
        renderUnlockedPart($el, skin, part)
        break
      }
    }

    // Set tooltip behavior
    $el.tooltip({
      placement: 'bottom',
      container: 'body',
      trigger: 'hover',
      title: '(locked)'
    })

    // Bind actions
    $el.on('click', function () {
      // If marked as 'new', this hides it
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
  renderSkinformation()
}

// Creates HTML content showing information about currently worn parts or outfits.
function renderSkinformation () {
  var playerSkin = $game.$player.getSkinSuit()
  var skins = data.outfits
  var head = playerSkin.head
  var torso = playerSkin.torso
  var legs = playerSkin.legs
  var content = ''

  // Display inventory data
  // The game doesn't store "full set" data, so we compare the parts to see if this is the case
  var outfit = getOutfit(head, torso, legs)

  if (outfit) {
    content += '<strong>' + outfit.name + '</strong><br>' + outfit.description
    if (outfit.effect) {
      content += '<br><strong><span class="color-orange">Outfit bonus:</span> <span class="color-blue">' + outfit.effect + '</span></strong>'
    }
    if (outfit.flag) {
      $game.flags.set(outfit.flag)
    }
  } else {
    content += _createPartString(head, 'head')
    content += '<br>' + _createPartString(torso, 'torso')
    content += '<br>' + _createPartString(legs, 'legs')
  }

  $('.skinformation p').html(content)

  // Private function used to create text that describes the outfit parts
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
      $game.flags.set(skins[skin][part].flag)
    }

    return string
  }
}

function changePlayerSkin (name, part) {
  // Clear & set skin effect flags here
  clearSkinFlags()

  // Update on DB
  $game.$player.setSkinSuit(name, part)

  // Render
  $game.$render.createCanvasForPlayer($game.$player.id, $game.$player.getSkinSuit(), $game.$player.getColorIndex())
  renderSkinformation()

  // Immediately execute anything based on flags
  applyFlags()
}

function applyFlags () {
  // If radar, re-render NPC comments & update minimap
  if (($game.flags.check('local-radar') || $game.flags.check('global-radar'))) {
    $game.$player.displayNpcComments()
    $game.minimap.radar.update()
  }

  // If speed goes up, change player speed
  if ($game.flags.check('speed-max')) {
    $game.$player.setMoveSpeed(2)
  } else if ($game.flags.check('speed-up')) {
    $game.$player.setMoveSpeed(1.5)
  } else {
    // Reset
    $game.$player.setMoveSpeed()
  }
}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

// Clear all effects of skins sets and parts
function clearSkinFlags () {
  // Effects are stored as game flags.
  // Get all flags from skins data.
  var outfits = data.outfits
  var outfitFlags = _.pluck(outfits, 'flag') // Outfit flags
  var partFlags = _.chain(outfits)
    .map(function (value, key, list) {
      if (list[key].head) return [list[key].head.flag, list[key].torso.flag, list[key].legs.flag]
    })
    .flatten()
    .compact()
    .value()

  // Assemble a list from outfit and part-related flags
  var flags = _.compact(_.union(outfitFlags, partFlags))

  // Clear all flags
  _.each(flags, $game.flags.unset, $game.flags)
}

// If parts are part of an outfit, returns an object containing outfit data.
function getOutfit (head, torso, legs) {
  var outfits = data.outfits

  // If everything is equal, player is wearing a full set
  if (head === torso && torso === legs) {
    return outfits[head]
  } else {
    // If everything is not equal, check if player is wearing a special outfit.
    var parts = {
      'head': head,
      'torso': torso,
      'legs': legs
    }
    // Returns outfit data, or undefined if not found.
    return _.find(outfits, function (each) {
      return _.isEqual(each.parts, parts)
    })
  }
}

// If a part is unlocked, display it as such
function renderUnlockedPart ($el, skin, part, isNew) {
  // skin is either the name of the skin or the skin object itself
  // Either way, we want to end up with the skin object.
  if (typeof skin === 'string') {
    skin = data.outfits[skin]
  }

  var playerColor = $game.$player.getColorIndex()
  var filename = skin.id

  if (skin.id === 'basic' && playerColor > 0) {
    filename = 'basic/' + playerColor
  }

  var $inner = $el.find('.inner')
  var bg = CivicSeed.CLOUD_PATH + '/img/game/skins/' + filename + '.png'

  $el.removeClass('locked')
  $el.attr('title', skin[part].name)
  $el.attr('data-original-title', skin[part].name)  // Force Bootstrap to update tooltip
  $inner.css('backgroundImage', 'url(' + bg + ')')
  $inner.find('i').remove()
  $inner.html('')
  if (isNew === true) {
    $el.find('.badge-new').show()
  }
}

// Expose 'public' methods
module.exports = {
  ready: false,
  getSetsList: getSetsList,
  getSets: getSets,
  getSkin: getSkin,
  unlockSkin: unlockSkin,
  resetSkinventory: resetSkinventory,
  renderSkinventoryUI: renderSkinventoryUI,
  renderSkinformation: renderSkinformation,
  changePlayerSkin: changePlayerSkin,
  applyFlags: applyFlags
}
