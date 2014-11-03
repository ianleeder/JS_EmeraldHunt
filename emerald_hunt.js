// Declare constants
var TILE_SIZE = 20;
var ANIMATION_SPEED = 100;

// Declare some classes
function Object() {
    this.xPos;
    this.yPos;
}


// Use JQuery for animation
$(document).ready(function() {
    $(document).keydown(function(key) {
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
	});
});