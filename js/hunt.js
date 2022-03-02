"use strict";

import {stateEnum, difficultyEnum} from "./enums.js";
import {Field} from "./field.js";
import {loadImagesFromUrlAsync, loadImagesFromFileAsync} from "./huntio.js";
import {Menu} from "./menu.js";

class EmeraldHunt {
	#canvas;
	#ctx;
	#gameState;
	#fps;
	#gameField;
	#menu;
	static #images;
	static #defaultFieldX = 40;
	static #defaultFieldY = 20;
	static #spriteSize = 16;
	static #defaultImageUrl = "resources/OBJECTS.DAT";

	constructor(c) {
		this.#canvas = c;
		this.#ctx = this.#canvas.getContext("2d");
		this.#gameState = stateEnum.LOADING;
		this.#fps = 5;
		this.scaleGame(1);
		this.#menu = new Menu(c);

		this.#gameState = stateEnum.RUNNING;
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

	static get DEFAULTIMAGEURL() {
		return EmeraldHunt.#defaultImageUrl;
	}

	async init() {
		addEventListener("keydown", this.handleInput.bind(this));
		addEventListener("keyup", e => {
			// Use graceful degradation of keyCode deprecation:
			// https://devstephen.medium.com/keyboardevent-key-for-cross-browser-key-press-check-61dbad0a067a
			var key = e.key || e.keyCode;
			if (key === 'Escape' || key === 'Esc' || key === 27) {
				console.log("Received ESC");
				if(this.#gameState == stateEnum.RUNNING) {
					this.#gameState = stateEnum.PAUSED;
				} else if(this.#gameState == stateEnum.PAUSED) {
					this.#gameState = stateEnum.RUNNING;
				}
			}
		});


		this.#gameState = stateEnum.MENU;

		// Start the timer ticking
		setInterval(() => {
			this.updateLoop();
			this.renderLoop();
		}, 1000/this.#fps);

		// Do this last, since it calls newGame
		await this.useImageUrl(EmeraldHunt.#defaultImageUrl);
	}

	async useImageFile(file) {
		// Load the game sprites and parse them
		let imgDataArray = await loadImagesFromFileAsync(file);
		await this.preloadAllImages(imgDataArray);
	}

	async useImageUrl(url) {
		// Download the game sprites and parse them
		let imgDataArray = await loadImagesFromUrlAsync(url);
		await this.preloadAllImages(imgDataArray);
	}

	async preloadAllImages(imgDataArray) {
		// Create Image objects from them and wait for load to complete
		let allPromises = imgDataArray.map(x => this.preloadSingleImage(x));
		EmeraldHunt.#images = await Promise.all(allPromises);

		// Need to reload references to images
		this.newGame();

		// This is just debug fluff
		let imageDiv = document.getElementById("imagesDiv");
		imageDiv.innerHTML = '';
		EmeraldHunt.IMAGES.forEach(item => {
			imageDiv.appendChild(item);
		});
	}

	async resetImageSource() {
		await this.useImageUrl(EmeraldHunt.DEFAULTIMAGEURL);
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
				this.#gameField.handleInput(e);
				break;
	
			case stateEnum.MENU:
			case stateEnum.DEAD:
			case stateEnum.PAUSED:
				this.#menu.handleInput(e);
				break;
		}
	}

	handleMenuInput(e) {
		console.log("menu input received");
	}

	playerDied() {
		this.#gameState = stateEnum.DEAD;
	}

	newGame() {
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