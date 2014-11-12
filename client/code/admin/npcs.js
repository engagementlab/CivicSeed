'use strict';

var $body,
    $util = require('/util')

var self = module.exports = {

  newId: -1,

  init: function () {
    $body = $(document.body)
    self.setup()
  },

  setup: function () {

    // Intercept default browser button actions
    $('button').on('click', function (e) {
      e.preventDefault()
      return false
    })

    $body.on('click', '.levelFilter div', function() {
      var level = parseInt($(this).text(),10);
      $(this).toggleClass('current');
      var show = $(this).hasClass('current'),
        npcSel = '.level' + (level - 1);
      if (show) {
        $(npcSel).show();
      } else {
        $(npcSel).hide();
      }
    });

    // Save changes to an NPC
    $body.on('click', '.npc-save-button', function () {
      var id = parseInt($(this).attr('data-id'), 10)
      self.saveChanges(id)
    })

    // Delete an NPC
    $body.on('click', '.npc-delete-button', function () {
      var id = parseInt($(this).attr('data-id'), 10)
      self.deleteNpc(id)
    })

    // Create an NPC
    $body.on('click', '.npc-create-button', function () {
      var id = $(this).attr('data-id')
      self.createNpc(id)
    })

    // Cancel addition of a new NPC
    $body.on('click', '.npc-cancel-button', function () {
      var id = $(this).attr('data-id')
      self.cancelNpc(id)
    })

    // Previous NPC sprite
    $body.on('click', '.sprite-up', function () {
      var $npc        = $(this).parents('.npc'),
          spriteId    = $npc.attr('data-sprite'),
          spriteImage = $npc.find('.sprite')

      if (spriteId > 0) {
        spriteId--
        var locY = spriteId * -64,
            pos  = '0 ' + locY + 'px'

        spriteImage.css({
          'background-position': pos
        })

        // Note: for some reason the .data() method on jQuery doesn't work
        $npc.attr('data-sprite', spriteId)
      }
    })

    // Next NPC sprite
    $body.on('click', '.sprite-down', function () {
      var $npc        = $(this).parents('.npc'),
          spriteId    = $npc.attr('data-sprite'),
          spriteImage = $npc.find('.sprite')

      // TODO: Don't hardcode the maximum number of sprites!
      if (spriteId < 53) {
        spriteId++
        var locY = spriteId * -64,
            pos  = '0 ' + locY + 'px'

        spriteImage.css({
          'background-position': pos
        })

        $npc.attr('data-sprite', spriteId)
      }
    })

    // View the resource that NPC is holding
    $body.on('click', '.view-resource-button', function () {
      //get the text from the url textarea
      var $self      = $(this),
          parent     = $self.parentsUntil('.npc'),
          resourceId = parent.find('.url').val()

      // Only display a resource if the user has entered its file name
      // Note: this does not check if the file is actually present
      if (resourceId) {
        var url = '/articles/' + resourceId + '.html'
        $('.article').empty().load(url, function () {
          $('.buffer').show()
          $(this).show()
        })
      } else {
        // If there is nothing entered, flash red on the button
        $self.addClass('btn-error')
        setTimeout(function () {
          $self.removeClass('btn-error')
        }, 1000)
      }
    });

    // When button is clicked, add a new NPC
    $body.on('click', '.npc-add-button', function() {
      self.addNpc()
    })

    // Loads a JSON view of all NPC data.
    // Note; this crashes the server if you attempt to go to it directly without going through the admin.
    $body.on('click', '.npc-export-button', function () {
      window.location = '/admin/npcs/export'
    })

    // Hide resource view on mouse click
    $body.on('click', '.article, .buffer', function() {
      $('.article, .buffer').hide()
    })

    // Toggle display of input boxes depending on whether NPC is holding a resource
    $body.on('change', 'input[type="checkbox"]', function () {
      var holding = this.checked ? true : false,
          $npc    = $(this).parents('.npc')

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
      var questionType = $(this).val(),
          $npc         = $(this).parents('.npc')

      $npc.find('.questionOptions').hide();

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
  },

  addSprites: function () {
    var npc = $('.npc'),
        url = 'url(' + CivicSeed.CLOUD_PATH + '/img/admin/npcs.png' + ')'

    npc.each(function (i) {
      var sprite = $(this).data('sprite'),
          locY   = sprite * -64,
          pos    = '0 ' + locY + 'px',
          info   = $(this).find('.sprite')

        info.css({
        'background-image':    url,
        'background-position': pos
      })
    })
  },

  saveChanges: function (id) {
    var npc = $('#admin-npcs').find('.npc' + id),
        informationAreas = npc.find('.information textarea, .information input'),
        resourceAreas    = npc.find('.resource textarea, .resource input'),
        promptAreas      = npc.find('.prompts textarea'),
        smalltalkAreas   = npc.find('.smalltalk textarea'),
        skinSuitArea     = npc.find('.skinSuit input'),
        holding          = npc.find('.information .holding')[0].checked,
        questionType     = npc.find('.resource input:checked').val(),
        sprite           = parseInt(npc.attr('data-sprite'), 10),
        updates = {
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
          index: null,
          position: {
            x: null,
            y: null
          },
          name: null,
          skinSuit: null
        };

    //update information
    var x, y

    informationAreas.each(function (i) {
      var area = $(this).attr('data-area'),
          val  = $util.prettyString(this.value)

      switch (area) {
        case 'name':
          updates.name = val
          break
        case 'level':
          updates.level = parseInt(val, 10) - 1
          break
        case 'x':
          x = parseInt(val, 10)
          break
        case 'y':
          y = parseInt(val, 10)
          break
      }
    })

    updates.index = (y * 142) + x // TODO: Deprecate reliance on the index. This hard codes the GAME_WIDTH constant as well; bad!
    updates.position.x = x
    updates.position.y = y

    resourceAreas.each(function (i) {
      var area = $(this).attr('data-area'),
          val  =  $util.prettyString(this.value)

      if (area === 'url') {
        updates.resource.url = val;
      } else if (area === 'shape') {
        updates.resource.shape = val;
      } else if (area === 'question') {
        updates.resource.question = val;
      } else if (area === 'possibleAnswers') {
        updates.resource.possibleAnswers.push(val);
      } else if (area === 'answer') {
        updates.resource.answer = val;
      } else if (area === 'requiredLength') {
        updates.resource.requiredlength = parseInt(val, 10);
      } else if (area === 'dependsOn') {
        updates.dependsOn = parseInt(val,10);
      } else if (area === 'feedbackRight') {
        updates.resource.feedbackRight = val;
      } else if (area === 'feedbackWrong') {
        updates.resource.feedbackWrong = val;
      }
    });

    promptAreas.each(function (i) {
      var area = $(this).attr('data-area'),
          val  = $util.prettyString(this.value)

      if (area === 'prompt') {
        updates.dialog.prompts.push(val);
      }
    });

    smalltalkAreas.each(function (i) {
      var area = $(this).attr('data-area'),
          val  = $util.prettyString(this.value)

      if (area === 'smalltalk') {
        updates.dialog.smalltalk.push(val);
      }
    });

    var skinVal = skinSuitArea.val();
    // console.log(skinVal);
    if (skinVal && skinVal.length > 0) {
      updates.skinSuit = skinVal;
    }

    console.log(updates)

    //this means it is a new one, do not save, but add new in db
    if (id < 0) {
      //figure out id
      var max = 0;
      $('.npc-save-button').each(function(i){
        var id = parseInt($(this).data('id'),10);
        if (id > max) {
          max = id;
        }
      });
      max++;
      updates.id = max;
      //TODO: update information on client
      //.npc: level, npc
      var levelClass = 'level' + updates.level,
          npcClass = 'npc' + updates.id;
      npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass);
      //options buttons
      var $saveButton = npc.find('.npc-create-button'),
          $deleteButton = npc.find('.npc-cancel-button');
      $saveButton.attr('data-id', updates.id);
      $deleteButton.attr('data-id', updates.id);

      ss.rpc('admin.npcs.addNpc', updates, function (err) {
        if (err) {
          apprise(err);
        } else {
          var $saveButton = npc.find('.npc-create-button');

          $saveButton.addClass('btn-success').addClass('npc-save-button').removeClass('npc-create-button').text('npc created!')
          $deleteButton.addClass('npc-delete-button').removeClass('npc-cancel-button').text('delete')
          setTimeout(function () {
            $saveButton.removeClass('btn-success').text('save')
          }, 2000)
        }
      });
    } else {
      ss.rpc('admin.npcs.updateInformation', updates, function(err) {
        if (err) {
          apprise(err);
        } else {
          var $saveButton = npc.find('.npc-save-button');
          var levelClass = 'level' + updates.level,
              npcClass = 'npc' + updates.id;
          npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass);
          $saveButton.addClass('btn-success');
        }
      });
    }
  },

  createNpc: function (id) {
    // If the ID is negative, delegate this feature to .saveChanges()
    // TODO: Don't put everything into one large function!
    if (id < 0) {
      self.saveChanges(id)
    }
  },

  deleteNpc: function (id) {
    var confirm = prompt('Please type "delete" to permanently remove this NPC.');
    if (confirm === 'delete') {
      var npc = $('.npc' + id);

      //this means it has never been saved, delete it from client
      if (id < 0) {
        self.cancelNpc(id)
      } else {
        ss.rpc('admin.npcs.deleteNpc', id, function (err,res) {
          if (err) {
            console.log(err);
          } else {
            npc.slideUp(function() {
              this.remove();
            });
          }
        });
      }
    }
  },

  // Cancel creation of a new NPC
  cancelNpc: function (id) {
    var npc = $('.npc' + id);

    npc.slideUp(function() {
      this.remove();
    });
  },

  addNpc: function () {
    // TODO: Theoretically, we should be building the NPC page from templates
    // which would have made this the easiest thing to do. However, we don't do
    // that, and it's not a good idea to have multiple, repeated HTML code that
    // do the same thing. So, we're doing this:
    var newId = self.newId--

    // Create a clone of the NPC template
    var clone = $('.npc-template').last().clone()
    $(clone).find('[data-id]').attr('data-id', newId)

    // Add it in the beginning, near the 'Add NPC' button.
    $(clone).insertAfter('.npc-add-insert-here')
    $(clone).slideDown()
    $(clone).addClass('npc' + newId)
  }

}
