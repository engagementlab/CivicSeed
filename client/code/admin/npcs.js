'use strict'
/* global CivicSeed, ss, $, apprise */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    admin.npcs

    - NPC administration

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var util = require('/util')

module.exports = (function () {
  var newId = -1

  function setup () {
    var $body = $(document.body)

    // Intercept default browser button actions
    $('button').on('click', function (e) {
      e.preventDefault()
      return false
    })

    // Level filter
    $body.on('click', '.npc-admin-level-filter div', function () {
      var $el = $(this)
      var level = parseInt($(this).text(), 10)
      var npcs = '.level' + (level - 1)

      $el.toggleClass('current')

      if ($el.hasClass('current')) {
        $(npcs).show()
      } else {
        $(npcs).hide()
      }
    })

    // Save changes to an NPC
    $body.on('click', '.npc-save-button', function () {
      var id = parseInt($(this).attr('data-id'), 10)
      saveChanges(id)
    })

    // Delete an NPC
    $body.on('click', '.npc-delete-button', function () {
      var id = parseInt($(this).attr('data-id'), 10)
      deleteNpc(id)
    })

    // Create an NPC
    $body.on('click', '.npc-create-button', function () {
      var id = $(this).attr('data-id')
      createNpc(id)
    })

    // Cancel addition of a new NPC
    $body.on('click', '.npc-cancel-button', function () {
      var id = $(this).attr('data-id')
      cancelNpc(id)
    })

    // Previous NPC sprite
    $body.on('click', '.sprite-up', function () {
      var $npc = $(this).parents('.npc')
      var spriteId = $npc.attr('data-sprite')
      var spriteImage = $npc.find('.sprite')

      if (spriteId > 0) {
        spriteId--
        var locY = spriteId * -64
        var pos = '0 ' + locY + 'px'

        spriteImage.css({
          'background-position': pos
        })

        // Note: for some reason the .data() method on jQuery doesn't work
        $npc.attr('data-sprite', spriteId)
      }
    })

    // Next NPC sprite
    $body.on('click', '.sprite-down', function () {
      var $npc = $(this).parents('.npc')
      var spriteId = $npc.attr('data-sprite')
      var spriteImage = $npc.find('.sprite')

      // TODO: Don't hardcode the maximum number of sprites!
      if (spriteId < 53) {
        spriteId++
        var locY = spriteId * -64
        var pos = '0 ' + locY + 'px'

        spriteImage.css({
          'background-position': pos
        })

        $npc.attr('data-sprite', spriteId)
      }
    })

    // View the resource that NPC is holding
    $body.on('click', '.view-resource-button', function () {
      // Get the text from the url textarea
      var $self = $(this)
      var $viewport = $('.resource-viewport-container')
      var parent = $self.parentsUntil('.npc')
      var resourceId = parent.find('.url').val()

      // Only display a resource if the user has entered its file name
      // Note: this does not check if the file is actually present
      if (resourceId) {
        ss.rpc('game.resource.get', resourceId, function (html) {
          $viewport.find('#article-insert').empty().html(html)
          $viewport.find('#article-source-link').attr('href', 'https://github.com/engagementgamelab/CivicSeed/edit/master/data/articles/' + resourceId + '.md')
          $viewport.show()
          $('.resource-overlay').show()
          // Disable body scroll
          $('body').css('overflow', 'hidden')
        })
      } else {
        // If there is nothing entered, flash red on the button
        $self.addClass('btn-error')
        setTimeout(function () {
          $self.removeClass('btn-error')
        }, 1000)
      }
    })

    // When button is clicked, add a new NPC
    $body.on('click', '.npc-add-button', function() {
      addNpc()
    })

    // Loads a JSON view of all NPC data.
    $body.on('click', '.npc-export-button', function () {
      window.location = '/admin/export/npc'
    })

    // Hide resource view on mouse click
    $body.on('click', '.resource-overlay', function() {
      var $viewport = $('.resource-viewport-container')

      // Clear inserted HTML contents (stops any playing videos)
      $viewport.find('#article-insert').empty()

      $viewport.hide()
      $('.resource-overlay').hide()

      // Re-enable body scroll
      $('body').css('overflow', 'auto')
    })

    // Toggle display of input boxes depending on whether NPC is holding a resource
    $body.on('change', 'input[type="checkbox"]', function () {
      var holding = this.checked ? true : false
      var $npc = $(this).parents('.npc')

      if (holding) {
        $npc.find('.resource').show()
        $npc.find('.prompts').show()
        $npc.find('.smalltalk').hide()
      } else {
        $npc.find('.resource').hide()
        $npc.find('.prompts').hide()
        $npc.find('.smalltalk').show()
      }
    })

    // Toggle display of answer inputs depending on the type of question NPC is asking
    $body.on('change', '.questionType input[type="radio"]', function () {
      var questionType = $(this).val()
      var $npc = $(this).parents('.npc')

      $npc.find('.questionOptions').hide()

      // Display response fields depending on question type
      switch (questionType) {

        // Open-ended response
        case 'open':
          $npc.find('.requiredDiv').show()
          break

        // Multiple-choice response
        case 'multiple':
          $npc.find('.possibleDiv').show()
          break

        // Binary-choice response, e.g. true/false or yes/no
        default:
          $npc.find('.answerDiv').show()
          break
      }
    })
  }

  function saveChanges (id) {
    var $npc = $('#admin-npcs').find('.npc' + id)
    var informationAreas = $npc.find('.information textarea, .information input')
    var resourceAreas = $npc.find('.resource textarea, .resource input')
    var promptAreas = $npc.find('.prompts textarea')
    var smalltalkAreas = $npc.find('.smalltalk textarea')
    var skinSuitArea = $npc.find('.skinSuit input')
    var holding = $npc.find('.information .holding')[0].checked
    var questionType = $npc.find('.resource input:checked').val()
    var sprite = parseInt($npc.attr('data-sprite'), 10)
    var x, y

    var updates = {
      id: id,
      isHolding: holding,
      resource: {
        url: null,
        shape: null,
        questionType: questionType,
        answer: null,
        question: null,
        possibleAnswers: [],
        feedbackRight: null,
        feedbackWrong: null
      },
      dependsOn: null,
      dialog: {
        prompts: [],
        smalltalk: []
      },
      level: null,
      sprite: sprite,
      position: {
        x: null,
        y: null
      },
      name: null,
      skinSuit: null
    }

    informationAreas.each(function (i) {
      var area = $(this).attr('data-area')
      var val = util.prettyString(this.value)

      switch (area) {
        case 'name':
          updates.name = val
          break
        case 'level':
          updates.level = parseInt(val, 10) - 1
          break
        case 'position.x':
          x = parseInt(val, 10)
          break
        case 'position.y':
          y = parseInt(val, 10)
          break
        default:
          // No default case
          break
      }
    })

    updates.position.x = x
    updates.position.y = y

    resourceAreas.each(function (i) {
      var area = $(this).attr('data-area')
      var val = util.prettyString(this.value)

      if (area === 'url') {
        updates.resource.url = val
      } else if (area === 'shape') {
        updates.resource.shape = val
      } else if (area === 'question') {
        updates.resource.question = val
      } else if (area === 'possibleAnswers') {
        updates.resource.possibleAnswers.push(val)
      } else if (area === 'answer') {
        updates.resource.answer = val
      } else if (area === 'requiredLength') {
        updates.resource.requiredlength = parseInt(val, 10)
      } else if (area === 'dependsOn') {
        updates.dependsOn = parseInt(val, 10) || null
      } else if (area === 'feedbackRight') {
        updates.resource.feedbackRight = val
      } else if (area === 'feedbackWrong') {
        updates.resource.feedbackWrong = val
      }
    })

    promptAreas.each(function (i) {
      var area = $(this).attr('data-area')
      var val = util.prettyString(this.value)

      if (area === 'prompt') {
        updates.dialog.prompts.push(val)
      }
    })

    smalltalkAreas.each(function (i) {
      var area = $(this).attr('data-area')
      var val = util.prettyString(this.value)

      if (area === 'smalltalk') {
        updates.dialog.smalltalk.push(val)
      }
    })

    var skinVal = skinSuitArea.val()

    if (skinVal && skinVal.length > 0) {
      updates.skinSuit = skinVal
    }

    console.log(updates)

    // this means it is a new one, do not save, but add new in db
    if (id < 0) {
      // figure out id
      var max = 0
      $('.npc-save-button').each(function (i) {
        var id = parseInt($(this).data('id'), 10)
        if (id > max) {
          max = id
        }
      })
      max++
      updates.id = max

      // TODO: update information on client
      var levelClass = 'level' + updates.level
      var npcClass = 'npc' + updates.id

      $npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass)

      // options buttons
      var $saveButton = $npc.find('.npc-create-button')
      var $deleteButton = $npc.find('.npc-cancel-button')

      $saveButton.attr('data-id', updates.id)
      $deleteButton.attr('data-id', updates.id)

      ss.rpc('admin.npcs.addNpc', updates, function (err) {
        if (err) {
          apprise(err)
        } else {
          var $saveButton = $npc.find('.npc-create-button')

          $saveButton.addClass('btn-success').addClass('npc-save-button').removeClass('npc-create-button').text('npc created!')
          $deleteButton.addClass('npc-delete-button').removeClass('npc-cancel-button').text('delete')
          setTimeout(function () {
            $saveButton.removeClass('btn-success').text('save')
          }, 2000)
        }
      })
    } else {
      ss.rpc('admin.npcs.updateInformation', updates, function (err) {
        if (err) {
          apprise(err)
        } else {
          var $saveButton = $npc.find('.npc-save-button')
          var levelClass = 'level' + updates.level
          var npcClass = 'npc' + updates.id

          $npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass)
          $saveButton.addClass('btn-success')
        }
      })
    }
  }

  function createNpc (id) {
    // If the ID is negative, delegate this feature to .saveChanges()
    // TODO: Don't put everything into one large function!
    if (id < 0) {
      saveChanges(id)
    }
  }

  function deleteNpc (id) {
    /* eslint-disable no-alert */
    var confirm = prompt('Please type "delete" to permanently remove this NPC.')
    if (confirm === 'delete') {
      var npc = $('.npc' + id)

      if (id < 0) {
        // A negative id means it has not been saved to back-end, delete it from client only
        cancelNpc(id)
      } else {
        ss.rpc('admin.npcs.deleteNpc', id, function (err, res) {
          if (err) {
            console.log(err)
          } else {
            npc.slideUp(function() {
              this.remove()
            })
          }
        })
      }
    }
  }

  // Cancel creation of a new NPC
  function cancelNpc (id) {
    var npc = $('.npc' + id)

    npc.slideUp(function() {
      this.remove()
    })
  }

  function addNpc () {
    // TODO: Theoretically, we should be building the NPC page from templates
    // which would have made this the easiest thing to do. However, we don't do
    // that, and it's not a good idea to have multiple, repeated HTML code that
    // do the same thing. So, we're doing this:
    var id = newId--

    // Create a clone of the NPC template
    var clone = $('.npc-template').last().clone()
    $(clone).find('[data-id]').attr('data-id', id)

    // Add it in the beginning, near the 'Add NPC' button.
    $(clone).insertAfter('.npc-add-insert-here')
    $(clone).slideDown()
    $(clone).addClass('npc' + id)
  }

  function addSprites () {
    var npc = $('.npc')
    var url = 'url(' + CivicSeed.CLOUD_PATH + '/img/admin/npcs.png' + ')'

    npc.each(function (i) {
      var sprite = $(this).data('sprite')
      var locY = sprite * -64
      var pos = '0 ' + locY + 'px'
      var info = $(this).find('.sprite')

      info.css({
        'background-image': url,
        'background-position': pos
      })
    })
  }

  return {
    init: function () {
      setup()
    },

    // This is called in routes.admin.js, so it's public
    addSprites: addSprites
  }
}())
