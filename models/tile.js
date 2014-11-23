'use strict';

module.exports = {

  name: 'Tile',
  collection: 'tiles',
  schema: {
    x: Number,
    y: Number,
    tileState: Number,
    isMapEdge: Boolean,
    background: Number,
    background2: Number,
    background3: Number,
    foreground: Number,
    foreground2: Number,
    mapIndex: Number,
    npcId: Number
  }

}
