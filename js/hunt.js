'use strict';

import {stateEnum, difficultyEnum} from "./enums.js";
import {Emerald, Diamond, Dirt, Rock, Brick, Bomb, Exit, Dozer, Cobblestone, Bug, Explosion, Grenade, DroppedGrenade, spriteEnum, classArray} from "./objects.js";
import {Field} from "./field.js";
import {readObjectsUrlAsync} from "./huntio.js";

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

class EmeraldHunt {
	#canvas;
	#ctx;
	#gameState;
	#fps;
	#gameField;
	#gameScore;
	static #images;
	static #defaultFieldX = 40;
	static #defaultFieldY = 20;
	static #spriteSize = 16;

	constructor(c) {
		this.#canvas = c;
		this.#ctx = this.#canvas.getContext("2d");
		this.#gameState = stateEnum.LOADING;
		this.#fps = 10;
		this.scaleGame(1);
	}

	// Create a static property
	static get IMAGES() {
		return EmeraldHunt.#images;
	}

	static get DEFAULTFIELDX() {
		return EmeraldHunt.#defaultFieldX;
	}

	static get DEFAULTFIELDY() {
		return EmeraldHunt.#defaultFieldY;
	}

	static get SPRITESIZE() {
		return EmeraldHunt.#spriteSize;
	}

	async init() {
		addEventListener("keydown", this.handleInput.bind(this));
		addEventListener("keyup", e => {
			if(e.keyCode==27) {
				console.log("Received ESC");
				if(this.#gameState == stateEnum.RUNNING) {
					this.#gameState = stateEnum.PAUSED;
				} else if(this.#gameState == stateEnum.AUSED) {
					this.#gameState = stateEnum.RUNNING;
				}
			}
		});

		// Preload the game sprites
		let imgDataArray = await readObjectsUrlAsync('http://www.ianleeder.com/OBJECTS.DAT');
		let allPromises = imgDataArray.map(x => this.preloadSingleImage(x));
		EmeraldHunt.#images = await Promise.all(allPromises);

		this.#gameState = stateEnum.MENU;

		// Start the timer ticking
		setInterval(() => {
			this.updateLoop();
			this.renderLoop();
		}, 1000/this.#fps);




		// This is just debug fluff
		EmeraldHunt.IMAGES.forEach(item => {
			document.getElementById("imagesDiv").appendChild(item);
		});
		this.newGame();
	}

	scaleGame(n) {
		this.#canvas.width = EmeraldHunt.DEFAULTFIELDX * EmeraldHunt.SPRITESIZE * n;
		this.#canvas.height = EmeraldHunt.DEFAULTFIELDY * EmeraldHunt.SPRITESIZE * n;
		this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.#ctx.scale(n, n);
	}

	// Returns a promise
	preloadSingleImage(imgData) {
		const temporaryImage = new Image();

		return new Promise((resolve, reject) => {
			temporaryImage.onerror = () => {
				reject(new DOMException("Problem caching image."));
			};
	
			temporaryImage.onload = () => {
				resolve(temporaryImage);
			};
	
			temporaryImage.src = imgData;
		});
	}

	clearCanvas() {
		this.#ctx.fillStyle = "#000000";
		this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	handleInput(e) {
		switch(this.#gameState) {
			case stateEnum.RUNNING:
				this.#gameField.handleGameInput(e);
				break;
	
			case stateEnum.MENU:
				handleMenuInput(e, true, menuButtons);
				break;
	
			case stateEnum.DEAD:
				handleMenuInput(e, true, deathButtons);
				break;
	
			case stateEnum.PAUSED:
				handleMenuInput(e, true, pauseButtons);
				break;
		}
	}

	handleMenuInput(e) {
		console.log("menu input received");
	}

	newGame() {
		this.#gameScore = 0;
		this.#gameState = stateEnum.RUNNING;
		this.#gameField = new Field(this.#ctx, difficultyEnum.EASY);
	}

	updateLoop() {
		if(!this.#gameField)
			return;
		
		switch(this.#gameState) {
			case stateEnum.MENU:
				this.#gameField.addRandomDiamond();
				this.#gameField.updateField();
				break;
	
			case stateEnum.RUNNING:
				this.#gameField.updateField();
				break;
		}
	}

	renderLoop() {
		this.clearCanvas();
		this.#gameField.renderField();
	}
}

export {EmeraldHunt};