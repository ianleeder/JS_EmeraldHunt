class Button {
	#lineWidth = 5;
	#radius = 8;
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

	draw(ctx) {
		var gradient = ctx.createRadialGradient((this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h) / 10, (this.w / 2) + this.x, (this.h / 2) + this.y, Math.max(this.w, this.h));

		if (this.isHighlighted) {
			// light blue
			gradient.addColorStop(0, '#2985E2');
			// dark blue
			gradient.addColorStop(1, '#0300F9');
			ctx.strokeStyle = '#0500A7';
		}
		else {
			// light green
			gradient.addColorStop(0, '#46EE3A');
			// dark green
			gradient.addColorStop(1, '#195508');
			ctx.strokeStyle = '#1A5A0F';
		}

		// Draw shape
		ctx.beginPath();
		ctx.moveTo(this.x + this.#radius, this.y);
		ctx.lineTo(this.x + this.w - this.#radius, this.y);
		ctx.quadraticCurveTo(this.x + this.w, this.y, this.x + this.w, this.y + this.#radius);
		ctx.lineTo(this.x + this.w, this.y + this.h - this.#radius);
		ctx.quadraticCurveTo(this.x + this.w, this.y + this.h, this.x + this.w - this.#radius, this.y + this.h);
		ctx.lineTo(this.x + this.#radius, this.y + this.h);
		ctx.quadraticCurveTo(this.x, this.y + this.h, this.x, this.y + this.h - this.#radius);
		ctx.lineTo(this.x, this.y + this.#radius);
		ctx.quadraticCurveTo(this.x, this.y, this.x + this.#radius, this.y);
		ctx.closePath();

		// Draw outline around path (rounded rectangle)
		ctx.lineWidth = this.#lineWidth;
		ctx.stroke();

		// Fill with gradient
		ctx.fillStyle = gradient;
		ctx.fill();

		// Write text
		ctx.fillStyle = '#FFFFFF';
		ctx.font = this.font;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		if (this.text2) {
			ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2) - 10);
			ctx.fillText(this.text2, this.x + (this.w / 2), this.y + (this.h / 2) + 10);
		}
		else
			ctx.fillText(this.text, this.x + (this.w / 2), this.y + (this.h / 2));

		if (this.isHighlighted)
			ctx.drawImage(dozerImage, this.x + 5, this.y + ((this.h - TILE_SIZE) / 2));
	}
}

class CyclingButton extends Button {
	constructor(x, y, w, h, isHighlighted, text, text2, font, action, textArray) {
		super(x, y, w, h, isHighlighted, text, text2, font, action);
		this.textArray = textArray;
		this.index = 0;
		this.text2 = this.textArray[this.index];
	}
}

class MenuController {
	#ctx;

	static #menuTextFont = '20px courier new';
	static #menuTextHeight = 10;

	constructor(c) {
		this.#ctx = c.getContext('2d');
	}

	static get MenuTextFont() {
		return MenuController.#menuTextFont;
	}

	static get MenuTextHeight() {
		return MenuController.#menuTextHeight;
	}

	handleInput() {

	}

	renderMenu() {
		this.#ctx.fillStyle = '#AAAAAA';
		this.#ctx.fillRect(100, 100, 200, 100);
		this.#ctx.font = '20px courier new';
		this.#ctx.fillStyle = '#000000';
		this.#ctx.fillText('MAIN MENU', 110, 120);

	}
}

class Menu {
	#ctx;

	constructor(c) {
		this.#ctx = c.getContext('2d');
	}

	handleInput() {

	}

	renderMenu() {
		this.#ctx.fillStyle = '#AAAAAA';
		this.#ctx.fillRect(100, 100, 200, 100);
		this.#ctx.font = '20px courier new';
		this.#ctx.fillStyle = '#000000';
		this.#ctx.fillText('MAIN MENU', 110, 120);

	}
}

class MenuItem {
	// Drawing context
	#ctx;

	// X Position of item
	#x;

	// Y Position of item
	#y;

	// Text to display
	#text;

	// MenuItemColor object for normal color
	#color;

	// MenuItemColor object when selected
	#selectedColor;

	constructor(ctx, x, y, text, c, sc) {
		this.#ctx = ctx;
		this.#x = x;
		this.#y = y;
		this.#text = text;
		this.#color = c;
		this.#selectedColor = sc;
	}

	renderMenu() {
		this.#ctx.fillStyle = '#AAAAAA';
		this.#ctx.fillRect(100, 100, 200, 100);
		this.#ctx.font = '20px courier new';
		this.#ctx.fillStyle = '#000000';
		this.#ctx.fillText('MAIN MENU', 110, 120);
	}
}

class MenuItemColor {
	// Background color
	#background;

	// Foreground color
	#foreground;

	constructor(bg, fg) {
		this.#background = bg;
		this.#foreground = fg;
	}

	get background() {
		return this.#background;
	}

	get foreground() {
		return this.#foreground;
	}
}

export { Button, CyclingButton, Menu, MenuController };