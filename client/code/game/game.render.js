'use strict';

var _ = require('underscore')

// Spritesheet-related constants
// All values are integers representing number of pixels.
// Spritesheet dimensions are hard-coded instead of determining from image size.
// TODO: Deprecate code that dynamatically determines this amount
var PLAYER_SPRITE_WIDTH  = $game.TILE_SIZE,     // Width of one sprite (one animation frame)
    PLAYER_SPRITE_HEIGHT = $game.TILE_SIZE * 2, // Height of one sprite
    PLAYER_SPRITESHEET_WIDTH  = 128, // Width of full spritesheet for player skin
    PLAYER_SPRITESHEET_HEIGHT = 320, // Height of full spritesheet for player skin
    SPRITE_HEAD_HEIGHT   = 30,       // Height of sprite head part
    SPRITE_TORSO_HEIGHT  = 15,       // Height of sprite torso part
    SPRITE_LEGS_HEIGHT   = 19        // Height of sprite legs part

var _tilesheets = {},
    _currentTilesheet = null,
    _tilesheetWidth = 0,
    _tilesheetHeight = 0,

    _tilesheetCanvas = [],
    _tilesheetContext = [],

    _offscreenBackgroundCanvas = null,
    _offscreenBackgroundContext = null,

    _offscreenSkinSuitCanvas = {},
    _offscreenSkinSuitContext = {},

    _offscreenPlayersCanvas = {},
    _offscreenPlayersContext = {},

    _backgroundContext    = null,
    _foregroundContext    = null,
    _charactersContext    = null,
    _interfaceContext     = null,
    _minimapTileContext   = null,

    _prevMouseX = 0,
    _prevMouseY = 0

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _render = {

  images: [ 'tilesheet_color',
            'tilesheet_gray',
            'boss_items',
            'botanist',
            'cursors',
            'npcs',
            'robot'
          ],
  tilesheets: {},
  tilesheet: {
    height: null,
    width:  null
  },

  createCanvas: function (elementId, width, height, onDom, styles) {
    var el    = document.createElement('canvas')
    el.id     = elementId
    // Width and height, if not provided, is equal to gameboard dimensions.
    el.width  = width  || $game.VIEWPORT_WIDTH  * $game.TILE_SIZE
    el.height = height || $game.VIEWPORT_HEIGHT * $game.TILE_SIZE

    if (onDom === true) {
      _.each(styles, function (value, key) {
        el.style[key] = value
      })
      document.getElementById('gameboard').appendChild(el)
    }

    return this.initCanvas(el)
  },

  initCanvas: function (element, forcePixelRatio) {
    var el      = (typeof element === 'object') ? element : document.getElementById(element),
        context = el.getContext('2d'),
        width   = el.width,
        height  = el.height

    // Scale interface display for higher-pixel-density screens
    // forcePixelRatio can be passed as true to this function to force this
    // canvas to use a pixel ratio of 1 and use the browser's native scaling
    if ($game.PIXEL_RATIO > 1 && forcePixelRatio !== true) {
        $(el).attr('width',  width  * $game.PIXEL_RATIO)
        $(el).attr('height', height * $game.PIXEL_RATIO)
        $(el).css('width',   width)
        $(el).css('height',  height)
        context.scale($game.PIXEL_RATIO, $game.PIXEL_RATIO)
    }

    return context
  },

  // Clears a canvas context
  clearContext: function (context) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height)
  },

  displayText: function (text, position, color) {
    var theContext = _interfaceContext    // Use this context

    theContext.strokeText(text, position.curX + $game.TILE_SIZE / 2, position.curY - $game.TILE_SIZE)
    theContext.fillStyle = (color) ? color: 'white'
    theContext.fillText(text, position.curX + $game.TILE_SIZE / 2, position.curY - $game.TILE_SIZE)
  }

}


var $render = $game.$render = {

  ready: false,

  colors: {
    // Match with game.styl
    black : 'rgb(34,34,34)',
    white:  'rgb(255,255,255)',
    gray:   'rgb(153,153,153)',
    purple: 'rgb(55,59,109)',
    orange: 'rgb(255,180,124)',
    green:  'rgb(167,228,149)',
    blue:   'rgb(121,204,206)',
    yellow: 'rgb(247,215,61)',
    red:    'rgb(249,79,51)'
  },

  // Expose utility functions
  // TODO: Public by default, perhaps as methods of a Renderer class
  utils: {
    clearContext: _render.clearContext,
    createCanvas: _render.createCanvas,
    initCanvas:   _render.initCanvas
  },

  // Set up all rendering contexts and load images
  init: function (callback) {

    // Optimize display for higher-pixel-density screens (e.g. Retina)
    if (window.devicePixelRatio) {
      $game.PIXEL_RATIO = window.devicePixelRatio
      // Debug: set PIXEL_RATIO to 1 to force native scaling
      //$game.PIXEL_RATIO = 1
    }

    // Create offscreen canvases for optimized rendering
    _offscreenBackgroundContext = _render.createCanvas('offscreenBackground')

    // Access the canvases for rendering
    // Tiles are currently unscaled because scaling it causes some artifacting
    _backgroundContext    = _render.initCanvas('background', true)
    _foregroundContext    = _render.initCanvas('foreground', true)
    _charactersContext    = _render.initCanvas('characters', true)
    _interfaceContext     = _render.initCanvas('interface')
    _minimapTileContext   = _render.initCanvas('minimap-tile')

    // Interface canvas - style for player names
    _interfaceContext.lineWidth    = 6
    _interfaceContext.lineJoin     = 'round'
    _interfaceContext.strokeStyle  = '#444'
    _interfaceContext.fillStyle    = '#fff'
    _interfaceContext.textAlign    = 'center'
    _interfaceContext.textBaseline = 'bottom'
    _interfaceContext.font         = '12pt Nunito, sans-serif'

    // set stroke stuff for mouse
    _foregroundContext.strokeStyle = 'rgba(0,255,0,.4)'; // Green default
    _foregroundContext.lineWidth = 4;
    _foregroundContext.save();

    $render.loadTilesheets(0);

    // hack to check if all stuff is loaded so we can callback
    var checkDone = function () {
      if ($render.ready) {
        callback();
      } else {
        setTimeout(checkDone, 30);
      }
    };
    checkDone();
  },

  resetInit: function () {
    _tilesheets = {};
    _currentTilesheet = null;
    _tilesheetWidth = 0;
    _tilesheetHeight = 0;

    _tilesheetCanvas = [];
    _tilesheetContext = [];

    _offscreenBackgroundCanvas= null;
    _offscreenBackgroundContext = null;

    _offscreenSkinSuitCanvas = {};
    _offscreenSkinSuitContext = {};

    _offscreenPlayersCanvas = {};
    _offscreenPlayersContext = {};

    _backgroundContext    = null
    _foregroundContext    = null
    _charactersContext    = null
    _interfaceContext     = null

    _prevMouseX = 0;
    _prevMouseY = 0;

    $game.$render.ready = false;
  },

  // Loads the specified tilesheet
  loadTilesheets: function (num) {
    var path     = CivicSeed.CLOUD_PATH + '/img/game/',
        ext      = '.png'

    //load the images recursively until done
    var filename = _render.images[num]

    _tilesheets[filename] = new Image();
    _tilesheets[filename].src = path + filename + ext;

    _tilesheets[filename].onload = function () {
      var next = num + 1;

      // If last image, go load skins?
      if (num === _render.images.length - 1) {
        $render.loadSkinSuitImages();
      }

      else {
        //if they are the world ones, do render them to canvas

        if (filename === 'tilesheet_gray') {

          _render.tilesheet.width  = Math.floor(_tilesheets[filename].width / $game.TILE_SIZE)
          _render.tilesheet.height = Math.floor(_tilesheets[filename].height / $game.TILE_SIZE)

          //gray
          _tilesheetCanvas[0] = document.createElement('canvas');
          _tilesheetCanvas[0].setAttribute('width', _tilesheets[filename].width);
          _tilesheetCanvas[0].setAttribute('height', _tilesheets[filename].height);
          _tilesheetContext[0] = _tilesheetCanvas[0].getContext('2d');

          _tilesheetWidth  = _render.tilesheet.width
          _tilesheetHeight = _render.tilesheet.height

          _tilesheetContext[0].drawImage(
            _tilesheets[filename],
            0,
            0,
            _tilesheets[filename].width,
            _tilesheets[filename].height,
            0,
            0,
            _tilesheets[filename].width,
            _tilesheets[filename].height
          );
        }
        else if (filename === 'tilesheet_color') {
          //color
          _tilesheetCanvas[1] = document.createElement('canvas');
          _tilesheetCanvas[1].setAttribute('width', _tilesheets[filename].width);
          _tilesheetCanvas[1].setAttribute('height', _tilesheets[filename].height);
          _tilesheetContext[1] = _tilesheetCanvas[1].getContext('2d');

          _tilesheetContext[1].drawImage(
            _tilesheets[filename],
            0,
            0,
            _tilesheets[filename].width,
            _tilesheets[filename].height,
            0,
            0,
            _tilesheets[filename].width,
            _tilesheets[filename].height
          );
        }
        $render.loadTilesheets(next);
      }

    }

  },

  //load all player images
  loadSkinSuitImages: function (num) {
    if (num === undefined) num = 0

    var next = num + 1,
        skinsList = $game.$skins.getSetsList(),
        numberOfColors = 24,
        filename = null

    if (skinsList[num]) {
      filename = skinsList[num]
    } else {
      // Loads player colors and stores on canvas in the format of 'basic/x'
      // where x is a number between 1 and 24 (inclusive)
      filename = 'basic/' + (num - skinsList.length + 1)
    }

    var skinSuitImage = new Image()
    skinSuitImage.src = CivicSeed.CLOUD_PATH + '/img/game/skins/' + filename + '.png'

    skinSuitImage.onload = function () {
      _offscreenSkinSuitCanvas[filename] = document.createElement('canvas')
      _offscreenSkinSuitCanvas[filename].setAttribute('width', skinSuitImage.width)
      _offscreenSkinSuitCanvas[filename].setAttribute('height', skinSuitImage.height)
      _offscreenSkinSuitContext[filename] = _offscreenSkinSuitCanvas[filename].getContext('2d')

      _offscreenSkinSuitContext[filename].drawImage(
        skinSuitImage,
        0,
        0
      );

      if (next >= (skinsList.length + numberOfColors)) {
        $render.ready = true
        PLAYER_SPRITESHEET_WIDTH = PLAYER_SPRITESHEET_WIDTH
        PLAYER_SPRITESHEET_HEIGHT = PLAYER_SPRITESHEET_HEIGHT
        $game.$skins.renderSkinventoryUI()
        $render.createCanvasForPlayer($game.$player.id, $game.$player.getSkinSuit(), $game.$player.getColorIndex())
        return
      } else {
        $render.loadSkinSuitImages(next)
      }
    };

  },

  // Render a frame on every tick, clear canvases and draw updated content
  renderFrame: function () {
    // $game.$others.clear();
    // $game.$player.clear();
    // $game.$npc.clear();
    // $game.$botanist.clear();
    // $game.$robot.clear();
    $render.clearAll()

    // Only re-render all the tiles if the viewport is tranisitioning
    if ($game.flags.check('screen-transition')) {
      $render.renderAllTiles()
    }

    $render.makeQueue(function (all) {
      var a = all.length
      while(--a > -1) {
        switch (all[a].kind) {
          case 'npc':
            $render.renderNpc(all[a])
            break
          case 'botanist':
            $render.renderBotanist(all[a])
            break
          case 'robot':
            $render.renderRobot(all[a])
            break
          default:
            $render.renderPlayer(all[a])
            break
        }
      }
    })
  },

  // Create queue for drawing all characters (other players, your player, npcs, botanist, robot)
  makeQueue: function (callback) {
    var playerInfo   = $game.$player.getRenderInfo(),
        order        = [playerInfo],
        order2       = $game.$others.getRenderInfo(),
        order3       = $game.$npc.getRenderInfo(),
        botanistInfo = $game.$botanist.getRenderInfo(),
        robotInfo    = $game.$robot.getRenderInfo()

    var finalOrder   = order.concat(order2, order3)

    if (botanistInfo) {
      finalOrder.push(botanistInfo)
    }

    if (robotInfo) {
      finalOrder.push(robotInfo)
    }

    finalOrder.sort(function (a, b) {
      return b.curY - a.curY
    })

    callback(finalOrder)
  },

  //figure out the information to draw on a tile
  renderTile: function (i, j) {
    //get the index (which refers to the location of the image)
    //tilemap reference to images starts at 1 instead of 0
    var curTile      = $game.$map.currentTiles[i][j],
        backIndex1   = curTile.background  - 1,
        backIndex2   = curTile.background2 - 1,
        backIndex3   = curTile.background3 - 1,
        foreIndex    = curTile.foreground  - 1,
        foreIndex2   = curTile.foreground2 - 1,
        tileStateVal = curTile.tileState,
        colored      = curTile.colored,

        tileData = {
          b1: backIndex1,
          b2: backIndex2,
          b3: backIndex3,
          destX: i,
          destY: j,
          colored: colored
        },
        foreData = {
          f1: foreIndex,
          f2: foreIndex2,
          destX: i,
          destY: j,
          colored: colored
        };

    //send the tiledata to the artist aka mamagoo
    $render.drawMapTile(tileData);

    //foreground tiles
    if (foreIndex > -1 || foreIndex2 > -1) {
      $render.drawForegroundTile(foreData);
    }
  },

  // Clear a single tile
  clearMapTile: function (position) {
    // Given a position object containing local grid coordinates for x and y
    _backgroundContext.clearRect(
      position.x * $game.TILE_SIZE,
      position.y * $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE
    )
  },

  //draw the actual tile on the canvas
  drawMapTile: function (tileData) {

    var srcX, srcY;

    var tilesheetIndex = tileData.colored ? 1 : 0;
    //background1, the ground texture
    if (tilesheetIndex === 1) {
      //4 is bg
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        4 * $game.TILE_SIZE,
        0,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }

    if (tileData.b1 > -1) {
      srcX =  tileData.b1 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b1 / _tilesheetWidth);

      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }

    if (tileData.b2 > -1) {
      srcX = tileData.b2 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b2 / _tilesheetWidth);
      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }
    if (tileData.b3 > -1) {
      srcX = tileData.b3 % _tilesheetWidth;
      srcY =  Math.floor(tileData.b3 / _tilesheetWidth);
      //draw it to offscreen
      _backgroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }
  },

  //draw a foreground tile to the canvas
  drawForegroundTile: function (tileData) {
    var srcX, srcY;

    var tilesheetIndex = tileData.colored ? 1 : 0;
    if (tileData.f1 > -1) {
      srcX = tileData.f1 % _tilesheetWidth;
      srcY = Math.floor(tileData.f1 / _tilesheetWidth);
      _foregroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }
    if (tileData.f2 > -1) {
      srcX = tileData.f2 % _tilesheetWidth;
      srcY = Math.floor(tileData.f2 / _tilesheetWidth);
      _foregroundContext.drawImage(
        _tilesheetCanvas[tilesheetIndex],
        srcX * $game.TILE_SIZE,
        srcY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        tileData.destX * $game.TILE_SIZE,
        tileData.destY * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
    }

  },

  // Create a canvas for a player sprite
  // The id is required to identify the canvas
  // Skinsuit (object) and player color (index) must be provided
  createCanvasForPlayer: function (id, skinSuit, playerColor) {
    var context = _offscreenPlayersContext[id]

    // If player's canvas currently exists, clear it
    if (context) {
      _render.clearContext(context)
    } else {
      // Create a canvas
      var canvas = document.createElement('canvas')
      canvas.setAttribute('width', PLAYER_SPRITESHEET_WIDTH)
      canvas.setAttribute('height', PLAYER_SPRITESHEET_HEIGHT)
      context = canvas.getContext('2d')

      // Store this to module global
      _offscreenPlayersCanvas[id] = canvas
    }

    // If skin part is "basic", append the player color index so that we
    // can grab the correct basic skin color
    if (skinSuit.head === 'basic') {
      skinSuit.head = 'basic/' + playerColor
    }
    if (skinSuit.torso === 'basic') {
      skinSuit.torso = 'basic/' + playerColor
    }
    if (skinSuit.legs === 'basic') {
      skinSuit.legs = 'basic/' + playerColor
    }

    // Create player sprite canvas from individual parts
    var numRows = Math.floor(PLAYER_SPRITESHEET_HEIGHT / PLAYER_SPRITE_HEIGHT),
        headSpriteSource = _offscreenSkinSuitCanvas[skinSuit.head],
        torsoSpriteSource = _offscreenSkinSuitCanvas[skinSuit.torso],
        legsSpriteSource = _offscreenSkinSuitCanvas[skinSuit.legs]

    // Optimization for wearing full suit
    // Duplicate the full spritesheet, don't loop & redraw each part
    if (skinSuit.head === skinSuit.torso && skinSuit.torso === skinSuit.legs) {
      context.drawImage(
        headSpriteSource,
        0,
        0,
        context.canvas.width,
        context.canvas.height,
        0,
        0,
        PLAYER_SPRITESHEET_WIDTH,
        PLAYER_SPRITESHEET_HEIGHT
      )
    } else {
      // If parts of skin are from different suits, assemble it together
      for (var row = 0; row < numRows; row++) {
        // Draw all the head parts from the source spritesheet
        context.drawImage(
          headSpriteSource,
          0,
          PLAYER_SPRITE_HEIGHT * row,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_HEAD_HEIGHT,
          0,
          PLAYER_SPRITE_HEIGHT * row,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_HEAD_HEIGHT
        )
        // Draw all the torso parts from the source spritesheet
        context.drawImage(
          torsoSpriteSource,
          0,
          (PLAYER_SPRITE_HEIGHT * row) + SPRITE_HEAD_HEIGHT,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_TORSO_HEIGHT,
          0,
          (PLAYER_SPRITE_HEIGHT * row) + SPRITE_HEAD_HEIGHT,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_TORSO_HEIGHT
        )
        // Draw all the leg parts from the source spritesheet
        context.drawImage(
          legsSpriteSource,
          0,
          (PLAYER_SPRITE_HEIGHT * row) + SPRITE_HEAD_HEIGHT + SPRITE_TORSO_HEIGHT,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_LEGS_HEIGHT,
          0,
          (PLAYER_SPRITE_HEIGHT * row) + SPRITE_HEAD_HEIGHT + SPRITE_TORSO_HEIGHT,
          PLAYER_SPRITESHEET_WIDTH,
          SPRITE_LEGS_HEIGHT
        )
      }
    }
        //tinting proof
    // var theImage = _offscreenSkinSuitContext.lion.getImageData(0, 0, PLAYER_SPRITESHEET_WIDTH, PLAYER_SPRITESHEET_HEIGHT);
  //           pix = theImage.data;

  //       // Every four values equals 1 pixel.
  //       for (i = 0; i < pix.length; i += 4) {
  //           pix[i]  = 255;
  //           pix[i + 1]  = 255;
  //           pix[i + 3] = 0;
  //           // green[i + 1] = 255;
  //           // blue[i + 2]  = pix[i + 2];
  //           // alpha[i + 3] = pix[i + 3];
  //       }
  //       _offscreenSkinSuitContext.lion.putImageData(theImage, 0,0);
  },

  //draw the player from backup to real canvas
  renderPlayer: function (info) {
    _charactersContext.drawImage(
      _offscreenPlayersCanvas[info.id],
      info.srcX,
      info.srcY,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2,
      info.curX,
      info.curY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    )

    // Display player name
    _render.displayText(info.firstName, info, info.color)
  },

  //clear the character canvas
  clearAll: function () {
    _render.clearContext(_charactersContext)
    _render.clearContext(_interfaceContext)
  },

  //clear a specific region on the character canvas
  clearCharacter: function (info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    );
  },

  //clear all the canvases and draw all the tiles
  renderAllTiles: function () {
    _render.clearContext(_foregroundContext)

    //start fresh for the offscreen every time we change ALL tiles
    _render.clearContext(_offscreenBackgroundContext)
    _render.clearContext(_backgroundContext)

    //go through and draw each tile to the appropriate canvas
    var i = $game.VIEWPORT_WIDTH;
    while(--i >= 0) {
      var j = $game.VIEWPORT_HEIGHT;
      while(--j >= 0) {
        $render.renderTile(i,j);
      }
    }

    _render.clearContext(_charactersContext)
  },

  //draw and npc to the canvas
  renderNpc: function (npcData) {
    _charactersContext.drawImage(
      _tilesheets.npcs,
      npcData.srcX,
      npcData.srcY,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2,
      npcData.curX,
      npcData.curY - $game.TILE_SIZE,
      $game.TILE_SIZE,
      $game.TILE_SIZE*2
    )
  },

  //draw the mouse box to the canvas
  renderMouse: function (mouse) {

    var mX = mouse.cX * $game.TILE_SIZE,
        mY = mouse.cY * $game.TILE_SIZE,
        state = $game.$map.getTileState({ x: mouse.cX, y: mouse.cY })
        //clear previous mouse area
        _foregroundContext.clearRect(
          _prevMouseX * $game.TILE_SIZE,
          _prevMouseY * $game.TILE_SIZE,
          $game.TILE_SIZE,
          $game.TILE_SIZE
        )

    //redraw that area
    var tile = $game.$map.currentTiles[_prevMouseX][_prevMouseY];
    var foreIndex = tile.foreground - 1,
        foreIndex2 = tile.foreground2 - 1,
        colored = tile.colored,
        foreData = {
          f1: foreIndex,
          f2: foreIndex2,
          destX: _prevMouseX,
          destY: _prevMouseY,
          colored: colored
        }

      $render.drawForegroundTile(foreData)
      var srcX = 0
      if ($game.$player.seedMode) {
        srcX = $game.TILE_SIZE * 3
      } else {
        switch (state) {
          // 1 = nogo
          case 1:
            srcX = $game.TILE_SIZE
            break
          // 2/3 = npc/botanist
          case 2:
          case 3:
            srcX = $game.TILE_SIZE * 2
            break
          // default: assume srcX = 0, I guess
          default:
            break
        }
      }
      _foregroundContext.drawImage(
        _tilesheets.cursors,
        srcX,
        0,
        $game.TILE_SIZE,
        $game.TILE_SIZE,
        mX,
        mY,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      )

      _prevMouseX = mouse.cX
      _prevMouseY = mouse.cY
  },

  //clear the botanist from the canvas
  clearBotanist: function (info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    );
  },

  //clear the robot from canvas
  clearRobot: function (info) {
    _charactersContext.clearRect(
      info.prevX,
      info.prevY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    );
  },

  //render the botanist on the canvas
  renderBotanist: function (info) {
    _charactersContext.drawImage(
      _tilesheets.botanist,
      info.srcX,
      info.srcY,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5,
      info.curX,
      info.curY - $game.TILE_SIZE * 4,
      $game.TILE_SIZE * 6,
      $game.TILE_SIZE * 5
    )
  },

  //render the robot on the canvas
  renderRobot: function (info) {
    _charactersContext.drawImage(
      _tilesheets.robot,
      info.srcX,
      info.srcY,
      64,
      64,
      info.curX,
      info.curY - $game.TILE_SIZE * 1,
      64,
      64
    )
  },

  //render a specific tile on the mini map
  // NOTE: This is used for color map on progress window, not the actual in-game minimap.
  renderMiniTile: function (x, y) {
    var rgba = 'rgb(124,202,176)'
    _minimapTileContext.fillStyle = rgba
    _minimapTileContext.fillRect(
      x,
      y,
      1,
      1
    )
  },

  //display the mini map image on the canvas
  imageToCanvas: function (map) {
    var newImg = new Image()

    newImg.onload = function () {
      _minimapTileContext.drawImage(newImg, 0, 0)
    }
    newImg.src = map
  },

  renderBossTiles: function (tiles) {
    for(var t = 0; t < tiles.length; t++) {
      $render.clearMapTile(tiles[t]);
      _backgroundContext.fillStyle = tiles[t].color;
      _backgroundContext.fillRect(
        tiles[t].x * $game.TILE_SIZE,
        tiles[t].y * $game.TILE_SIZE,
        $game.TILE_SIZE,
        $game.TILE_SIZE
      );
      // Item is a number from 0 to 3
      if (tiles[t].item >= 0) {
        // _backgroundContext.fillStyle = 'rgba(0,' + tiles[t].item * 50 + ',200,0.5)';
        // _backgroundContext.fillRect(
        //  tiles[t].x * $game.TILE_SIZE,
        //  tiles[t].y * $game.TILE_SIZE,
        //  $game.TILE_SIZE,
        //  $game.TILE_SIZE
        // );
        _backgroundContext.drawImage(
          _tilesheets.boss_items,
          tiles[t].item * $game.TILE_SIZE,
          0,
          $game.TILE_SIZE,
          $game.TILE_SIZE,
          tiles[t].x * $game.TILE_SIZE,
          tiles[t].y * $game.TILE_SIZE,
          $game.TILE_SIZE,
          $game.TILE_SIZE
        );
      }
      if (tiles[t].charger === 1) {
        // _backgroundContext.fillStyle = 'rgba(255,0,0,0.9)';
        // _backgroundContext.fillRect(
        //  tiles[t].x * $game.TILE_SIZE,
        //  tiles[t].y * $game.TILE_SIZE,
        //  $game.TILE_SIZE,
        //  $game.TILE_SIZE
        // );
        _backgroundContext.drawImage(
          _tilesheets.boss_items,
          128,
          0,
          $game.TILE_SIZE,
          $game.TILE_SIZE,
          tiles[t].x * $game.TILE_SIZE,
          tiles[t].y * $game.TILE_SIZE,
          $game.TILE_SIZE,
          $game.TILE_SIZE
        );
      }
    }
  },

  clearBossLevel: function () {
    _render.clearContext(_backgroundContext)
    _render.clearContext(_charactersContext)
  },

  clearMap: function () {
    _render.clearContext(_backgroundContext)
    _render.clearContext(_foregroundContext)
  }
}
