class BaseObject {
	constructor(img) {
		this._gravity = true;
		this._canBeCrushed = false;
	    this._canPassThrough = true;
	    this._isFalling = false;
		this._isUneven = true;
		this._isPushable = false;
		this._isExplosive = false;
		this._image = img;
	}

	get gravity() { return this._gravity; }
	get canBeCrushed() { return this._canBeCrushed; }
	get canPassThrough() { return this._canPassThrough;	}
	get isFalling() { return this._isFalling; }
	get isUneven() { return this._isUneven;	}
	get isPushable() { return this._isPushable; }
	get isExplosive() { return this._isExplosive; }
	get image() { return this._image; }
}

class Dozer extends BaseObject {
	constructor(x, y, img) {
		super(img);
		this._gravity = false;
		this.canBeCrushed = true;

		this._xPos = x;
		this._yPost = y;
	}

	get xPos() { return this._xPos; }
	get yPos() { return this._yPos; }
}

class Gem extends BaseObject {
	constructor(img) {
		super(img);
		this._gravity = true;
		this._canPassThrough = true;
	}
}

class Emerald extends Gem {
	constructor(img) {
		super(img);
	}
}

class Sapphire extends Gem {
	constructor(img) {
		super(img);
		this._canBeCrushed = true;
	}
}

class Dirt extends BaseObject {
	constructor(img) {
		super(img);
		this._gravity = false;
		this._isUneven = false;
	}
}

class Rock extends BaseObject {
	constructor(img) {
		super(img);
		this._canPassThrough = false;
		this._isPushable = true;
	}
}

class Bomb extends BaseObject {
	constructor(img) {
		super(img);
		this._isExplosive = true;
		this._canPassThrough = false;
		this._canBeCrushed = true;
		this._isPushable = true;
	}
}

class Explosion extends BaseObject {
	constructor(img) {
		super(img);
		this._canPassThrough = false;
		this._newExplosion = true;
	}

	get newExplosion() { return this._newExplosion; }
}

class Grenade extends BaseObject {
	constructor(img) {
		super(img);
		this._gravity = false;
		this._isExplosive = true;
	}
}

class DroppedGrenade extends Grenade {
	constructor(img) {
		super(img);
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

