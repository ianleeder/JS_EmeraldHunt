// Declare constants
var TILE_SIZE = 20;
var ANIMATION_SPEED = 100;
var FIELD_X = 10;
var FIELD_Y = 10;

// Declare some classes
function BaseObject(xPos, yPos, gravity, canBeCrushed, canPassThrough) {
    this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = gravity;
    this.canBeCrushed = canBeCrushed;
    this.canPassThrough = canPassThrough;
}

function Dirt(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = false;
    this.canBeCrushed = false;
    this.canPassThrough = true;
}

function Rock(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = true;
    this.canBeCrushed = false;
    this.canPassThrough = false;
}

function Gem(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.gravity = true;
    this.canPassThrough = true;
}

function Emerald(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = false;
}

function Sapphire(xPos, yPos) {
	this.xPos = xPos;
    this.yPos = yPos;
    this.canBeCrushed = true;
}

// set up the prototype chain
Dirt.prototype = new BaseObject();
Rock.prototype = new BaseObject();
Gem.prototype = new BaseObject();
Emerald.prototype = new Gem();
Sapphire.prototype = new Gem();

function Field() {
	var grid = new Array(FIELD_X);

	// Create empty array for grid
	for (var i = 0; i < grid.length; i++) {
		grid[i] = new Array(FIELD_Y);
	}
	
	for(var i=0;i<grid.length;i++) {
		for(var j=0;j<grid[i].length;j++) {
			var rnd = Math.floor(Math.random()*5);
			var val;
			switch(rnd) {
				case 0:
				case 1:
					val = 0;
					break;

				case 2:
					val = new Dirt(i,j);
					break

				case 3:
					val = new Rock(i,j);
					break

				case 4:
					val = new Emerald(i,j);
					break

				case 5:
					val = new Sapphire(i,j);
					break
			}
			grid[i][j]=val;
		}
	}

	function draw() {
		for(var i=0;i<grid.length;i++) {
			for(var j=0;j<grid[i].length;j++) {
				console.log(grid[i][j]);
			}
		}
	}
}

function moveDozer(key) {
    switch(parseInt(key.which,10)) {
		// Left arrow key pressed
		case 37:
			$('#dozer').animate({left: "-="+TILE_SIZE+"px"}, ANIMATION_SPEED);
			break;
		// Up Arrow Pressed
		case 38:
			$('#dozer').animate({top: "-="+TILE_SIZE+"px"}, ANIMATION_SPEED);
			break;
		// Right Arrow Pressed
		case 39:
			$('#dozer').animate({left: "+="+TILE_SIZE+"px"}, ANIMATION_SPEED);
			break;
		// Down Array Pressed
		case 40:
			$('#dozer').animate({top: "+="+TILE_SIZE+"px"}, ANIMATION_SPEED);
			break;
	}
}

// Use JQuery for animation
$(document).ready(function() {
    $(document).keydown(moveDozer);

    var f = new Field();

});