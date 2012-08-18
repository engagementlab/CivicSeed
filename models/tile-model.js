module.exports = function(mongoose, db, Schema, ObjectId) {

	// var MapSchema = new Schema({
	// 	quadrant: [{
	// 		neighbors: [Number, Number, Number, Number, Number, Number, Number, Number],
	// 		tiles: [{
	// 			localX: Number,
	// 			localY: Number,
	// 			TileX: Number,
	// 			nogo: Boolean,
	// 			TileY: Number
	// 		}],
	// 		quadrantNumber: Number,
	// 		TileX: Number,
	// 		TileY: Number
	// 	}]
	// });

	var TileSchema = new Schema({
			x: Number,
			y: Number,
			nogo: Boolean,
			isQuadEdge: Boolean,
			isWorldEdge: Boolean,
			worldIndex: Number
	});

	// var TileSchema = new Schema({
	// 	localX: Number,
	// 	localY: Number,
	// 	TileX: Number,
	// 	nogo: Boolean,
	// 	TileY: Number
	// });


	//the third param specifies an exact collection to look for in the DB
	// var MapModel = db.model('Map', MapSchema, 'maps');
	var TileModel = db.model('Tile', TileSchema, 'tiles');
	// var TileModel = db.model('Tile', TileSchema, 'tiles');




// 	// generated from tiles
// 	// http://www.mapeditor.org/
// 	var map = {
// 		height: 40,
// 		layers: [{
// 			data: [
// 				{
// 					tile: 30,
// 					color(rgba): transparent,
// 					user: unassigned
// 				},
// 				{
// 					tile: 30,
// 					color(rgba): transparent,
// 					user: unassigned
// 				},
// 				// etc.
// 			],
// 			height: 40,
// 			name: "Ground",
// 			opacity: 1,
// 			type: "tilelayer",
// 			visible: true,
// 			width: 40,
// 			x: 0,
// 			y: 0
// 		}],
// 		orientation: orthogonal,
// 		properties: {

// 		},
// 		tileheight: 32,
// 		tilesets: [{
// 			firstgid: 1,
// 			image: "..\/..\/..\/Volumes\/Tiled 0.8.1\/examples\/tmw_desert_spacing.png",
// 			imageheight: 199,
// 			imagewidth: 265,
// 			margin: 1,
// 			name: "Desert",
// 			properties: {

// 			},
// 			spacing: 1,
// 			tileheight: 32,
// 			tilewidth: 32
// 		}],
// 		tilewidth: 32,
// 		version: 1,
// 		width: 40
// 	};

// 	var mapTwo = {

// 		layers: {

// 			grid: {

// 			}


// 		}



// 	}


// map of colors = {
// 	color
// 	colorvalue(rgba)
// 	tied to a user
// 	position
// }


	return TileModel;

};