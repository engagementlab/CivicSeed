//this will be the basis for the gnome 
$game.$thing = {

	isMoving: false,
	currentStep: 0,
	currentMove: 0,
	currentStepIncX: 0,
	currentStepIncY: 0,
	curFrame: 0,
	numFrames: 4,
	numSteps: 8,
	direction: 0,
	idleCounter: 0,
	hideTimer: null,
	isChatting: false,
	offScreen: true,

	info: {
		x: 0,
		y: 0,
		srcX: 0,
		srcY: 0,
		offX: 0,
		offY: 0,
		prevOffX: 0,
		prevOffY: 0
	},

	renderInfo: {
		srcX: 0,
		srcY: 0,
		x: 0,
		y: 0
	},
	
	init: function() {

	}


};