class BaseObject {
	constructor(imgIndex) {
		this._gravity = true;
		this._canBeCrushed = false;
	    this._canPassThrough = true;
	    this._isFalling = false;
		this._isUneven = true;
		this._isPushable = false;
		this._isExplosive = false;
		this._canBeDestroyed = true;
		this._imageIndex = imgIndex;
	}

	get gravity() { return this._gravity; }
	get canBeCrushed() { return this._canBeCrushed; }
	get canPassThrough() { return this._canPassThrough;	}
	get isFalling() { return this._isFalling; }
	get isUneven() { return this._isUneven;	}
	get isPushable() { return this._isPushable; }
	get isExplosive() { return this._isExplosive; }
	get canBeDestroyed() { return this._canBeDestroyed; }
	get imageIndex() { return this._image; }
}

class Gem extends BaseObject {
	constructor(img) {
		super(img);
		this._gravity = true;
		this._canPassThrough = true;
	}
}

class Dirt extends BaseObject {
	constructor() {
		super(1);
		this._gravity = false;
		this._isUneven = false;
	}
}

class Rock extends BaseObject {
	constructor() {
		super(2);
		this._canPassThrough = false;
		this._isPushable = true;
	}
}

class Emerald extends Gem {
	constructor() {
		super(3);
	}
}

class Brick extends BaseObject {
	constructor() {
		super(4);
		this._gravity = false;
		this._canPassThrough = false;
		this._canBeDestroyed = false;
		this._isUneven = false;
	}
}

class Bomb extends BaseObject {
	constructor() {
		super(5);
		this._isExplosive = true;
		this._canPassThrough = false;
		this._canBeCrushed = true;
		this._isPushable = true;
	}
}

class Home extends BaseObject {
	constructor() {
		super(6);
	}
}

class Dozer extends BaseObject {
	constructor(x, y) {
		super(7);
		this._gravity = false;
		this._canBeCrushed = true;
		this._isUneven = false;

		this._xPos = x;
		this._yPost = y;
	}

	get xPos() { return this._xPos; }
	get yPos() { return this._yPos; }
}

class Cobblestone extends BaseObject {
	constructor() {
		super(8);
		this._gravity = false;
		this._canPassThrough = false;
	}
}

class Bug extends BaseObject {
	constructor(img) {
		super(9);
		this._gravity = false;
		this._canBeCrushed = true;
	    this._canPassThrough = false;
		this._isExplosive = true;
		this._canBeDestroyed = true;
	}
}

class Sapphire extends Gem {
	constructor() {
		super(10);
		this._canBeCrushed = true;
	}
}

class Explosion extends BaseObject {
	constructor() {
		super(12);
		this._canPassThrough = false;
		this._isNewExplosion = true;
	}

	get isNewExplosion() { return this._isNewExplosion; }
}

class Grenade extends BaseObject {
	constructor() {
		super(13);
		this._gravity = false;
		this._isExplosive = true;
	}
}

class DroppedGrenade extends Grenade {
	constructor() {
		super(13);
		this._canPassThrough = false;
		this._timer = 10;
	}

	get timer() { return this._timer; }
}

class Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.isHighlighted = isHighlighted;
		this.text = text;
		this.text2 = text2;
		this.action = action;
		this.font = font;
	}

	draw() {
		var radius = 8;
		var lineWidth = 5;
		var gradient=canvasContext.createRadialGradient((this.w/2)+this.x,(this.h/2)+this.y,Math.max(this.w, this.h)/10,(this.w/2)+this.x,(this.h/2)+this.y,Math.max(this.w, this.h));

		if(this.isHighlighted) {
			// light blue
			gradient.addColorStop(0, '#2985E2');
			// dark blue
			gradient.addColorStop(1, '#0300F9');
			canvasContext.strokeStyle = "#0500A7";
		}
		else {
			// light green
			gradient.addColorStop(0, '#46EE3A');
			// dark green
			gradient.addColorStop(1, '#195508');
			canvasContext.strokeStyle = "#1A5A0F";
		}

		// Draw shape
		canvasContext.beginPath();
		canvasContext.moveTo(this.x + radius, this.y);
		canvasContext.lineTo(this.x + this.w - radius, this.y);
		canvasContext.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + radius);
		canvasContext.lineTo(this.x + this.w, this.y + this.h - radius);
		canvasContext.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - radius, this.y + this.h);
		canvasContext.lineTo(this.x + radius, this.y + this.h);
		canvasContext.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - radius);
		canvasContext.lineTo(this.x, this.y + radius);
		canvasContext.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
		canvasContext.closePath();

		// Draw outline around path (rounded rectangle)
		canvasContext.lineWidth=lineWidth;
		canvasContext.stroke();

		// Fill with gradient
		canvasContext.fillStyle=gradient;
		canvasContext.fill();

		// Write text
		canvasContext.fillStyle = "#FFFFFF";
		canvasContext.font = this.font;
		canvasContext.textAlign = "center";
		canvasContext.textBaseline = "middle";
		if(this.text2) {
			canvasContext.fillText(this.text, this.x + (this.w/2), this.y + (this.h/2)-10);
			canvasContext.fillText(this.text2, this.x + (this.w/2), this.y + (this.h/2)+10);
		}
		else
			canvasContext.fillText(this.text, this.x + (this.w/2), this.y + (this.h/2));

		if(this.isHighlighted)
			canvasContext.drawImage(dozerImage, this.x+5, this.y+((this.h-TILE_SIZE)/2));
	}
}

class CyclingButton extends Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action, textArray) {
		super(this, x, y, w, h, isHighlighted, text, text2, font, action);
		this.textArray = textArray;
		this.index = 0;
		this.text2 = this.textArray[this.index];
	}
}

class Field {
	constructor(c) {
		this._ctx = c;
		this._fieldX = 40;
		this._fieldY = 20;
		this._tileSize = 16;
	}


}

class EmeraldHunt {
	constructor(c) {
		this._canvas = c;
		this._ctx = this._canvas.getContext("2d");
		this._images = null;
	}

	init() {
		console.log("Entered init");
		// When we pass a callback it breaks the THIS reference, we need to bind it
		// https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback
		// https://stackoverflow.com/questions/46618945/cannot-set-property-value-of-undefined-inside-es6-class
		readObjectsUrl('http://www.ianleeder.com/OBJECTS.DAT', this.imagesLoaded.bind(this));
	}

	imagesLoaded(imgs) {
		console.log("Entered callback");
		this._images = imgs;
		this._images.forEach(function(item, index) {
			let img = document.createElement("img");
			img.src = item;
			document.getElementById("imagesDiv").appendChild(img);
		});
	}
}