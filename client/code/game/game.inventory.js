'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    inventory.js

    - Manages inventory content.
    - Updates inventory DOM.
    - Handles opening/closing inventory UI

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var self = $game.inventory = (function () {

  // Private
  var _inventory = {} // Holds each item in inventory.

  // Returns true if a resource is held in the player's inventory
  function isInInventory (item) {
    for (var i = 0, j = _inventory.length; i < j; i++) {
      if (_inventory[i].name === item.name) {
        return true
      }
    }
    return false
  }

  // Make the bounding box for each possible resource in inventory
  function createInventoryHUDBoxes () {
    var el = document.getElementById('inventory').querySelector('.inventory-boxes')
    while (el.firstChild) el.removeChild(el.firstChild)
    for (var i = 0; i < $game.$resources.inventorySlotsPerLevel[$game.$player.currentLevel]; i++) {
      var boxEl = document.createElement('div')
      boxEl.classList.add('inventory-box')
      el.appendChild(boxEl)
    }
  }

  // Add an item to inventory HUD and bind actions to it
  function addToInventoryHUD (data) {
    // Add resource image to inventory HUD
    var className   = 'r' + data.name,
        playerLevel = $game.$player.getLevel(),
        levelFolder = 'level' + playerLevel.toString(),
        imgPath     = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/small/' +  data.name +'.png'

    $('#inventory > .inventory-items').append('<img class="inventory-item '+ className + '"src="' + imgPath + '" data-placement="top" data-original-title="' + data.tagline + '">')

    $game.addBadgeCount('.hud-inventory', 1)

    // Bind actions
    $('img.inventory-item.' + className)
      .on('mouseenter', function () {
        $(this).tooltip('show')
      })
      .on('click', function () {
        $game.$resources.examineResource(data.id)
      })
      .on('dragstart', {id: data.id , name: data.name}, $game.$botanist.onTangramDragFromInventoryStart)
  }

  // Convenience funtion to load all items in player's inventory from DB
  // into the player's inventory HUD - this is called on game load
  function fillInventoryHUD () {
    for (var i = 0; i < _inventory.length; i++) {
      addToInventoryHUD(_inventory[i])
    }

    // If the player has gotten the riddle, put the tangram in the inventory + bind actions
    if ($game.$botanist.getState() > 1) {
      $game.$botanist.putPuzzlePageInInventory()
    }
  }

  // Public
  return {

    init: function (callback) {
      createInventoryHUDBoxes()
      fillInventoryHUD()

      if (typeof callback === 'function') callback()
    },

    // Shows the inventory overlay only.
    // Used to restore inventory overlay after reviewing an inventory item / resource.
    show: function (callback) {
      $game.flags.set('visible-inventory')
      $('#inventory').slideDown(300, function () {
        if (typeof callback === 'function') callback()
      })
    },

    // Extends show() for actual inventory interaction.
    open: function (callback) {
      $game.$input.resetUI()
      $game.$input.activeHUDButton('.hud-inventory')

      this.show(function () {
        if (self.get().length > 0) {
          $game.alert('Click on a piece to review again')
        }
        if (typeof callback === 'function') callback()
      })
    },

    // Only visually hides the inventory window.
    // Used to temporarily hide the inventory with the intention of re-opening it.
    hide: function (callback) {
      $('#inventory').slideUp(300, function () {
        $game.flags.unset('visible-inventory')
        if (typeof callback === 'function') callback()
      })
    },

    // Extends hide() for actual inventory interaction.
    close: function (callback) {
      this.hide(function () {
        $game.$input.inactiveHUDButton('.hud-inventory')
        $game.flags.unset('viewing-inventory')
        if (typeof callback === 'function') callback()
      })
    },

    toggle: function () {
      if ($('#inventory').is(':visible')) {
        this.close()
      } else {
        this.open()
      }
    },

    // Gets a specific item at index or all items in inventory
    get: function (index) {
      return (index !== undefined) ? _inventory[index] : _inventory
    },

    // Sets inventory data on game initiation.
    // Called only on _setPlayerInformation from player.js
    // Do not use this to set inventory information through gameplay!
    set: function (data) {
      _inventory = data
    },

    // Empty everything from inventory
    empty: function () {
      _inventory = []

      $('.inventory-item').remove()
      $game.setBadgeCount('.hud-inventory', 0)

      // Including the puzzle
      document.querySelector('#inventory .inventory-tangram').innerHTML = ''

      // Save to server
      ss.rpc('game.player.updateGameInfo', {
        id:        $game.$player.id,
        inventory: []
      })
    },

    // Add an item to the inventory when a player obtains something through gameplay
    add: function (item) {
      // Skip if already present
      if (isInInventory(item) === true) return false

      // Add inventory item to internal
      _inventory.push(item)
      addToInventoryHUD(item)
    }

  }

}())
