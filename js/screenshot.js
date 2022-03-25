'use strict';

import { EmeraldHunt } from './hunt.js';

class ScreenshotAnalyser {
	// DOM Canvas element.  Required for scaling.
	#canvas;

	// Store the image globally
	#img;
	
	constructor(c) {
		this.#canvas = c;
	}

	loadImage(file) {
		this.#img = new Image();

		// https://stackoverflow.com/a/42498790/5329728
		let reader = new FileReader();
		reader.onload = function() {
			var dataURL = reader.result;
			this.#img.src = dataURL;
		}.bind(this);
		reader.readAsDataURL(file);

		// https://stackoverflow.com/a/3530824/5329728
        
		this.#img.addEventListener('load', this.imageLoaded.bind(this));
	}

	imageLoaded() {
		this.#canvas.width = this.#img.width;
		this.#canvas.height = this.#img.height;
    
		var context = this.#canvas.getContext('2d');
		context.drawImage(this.#img, 0, 0);
    
		var imageData = context.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
        
		console.log(imageData);

		// Count 5 sprites worth of pixels (80 pixels) across
		for(let x=0;x<(5*EmeraldHunt.SPRITESIZE);x++) {
			var index = x * 4;
			var red = imageData.data[index];
			var green = imageData.data[index + 1];
			var blue = imageData.data[index + 2];
			var alpha = imageData.data[index + 3];
                
			console.log(`X:${x} RGBA: ${red},${green},${blue},${alpha}`);
		}

		let spriteOffsetX = 6;
		let spriteOffsetY = 6;

		// Count by sprites
		for(var y=0;y<EmeraldHunt.DEFAULTFIELDY;y++) {
			for(var x=0;x<EmeraldHunt.DEFAULTFIELDX;x++) {
				// Multiply by sprite size and add offset to get actual pixel positions
				let pixelX = (x * EmeraldHunt.SPRITESIZE) + spriteOffsetX;
				let pixelY = (y * EmeraldHunt.SPRITESIZE) + spriteOffsetY;

				// Now you can access pixel data from imageData.data.
				// It's a one-dimensional array of RGBA values.
				// Here's an example of how to get a pixel's color at (x,y)
				var index = (pixelY*imageData.width + pixelX) * 4;

				var red = imageData.data[index];
				var green = imageData.data[index + 1];
				var blue = imageData.data[index + 2];
				//var alpha = imageData.data[index + 3];
                
				console.log(`Sprite X/Y: ${x}/${y}, pixel X/Y: ${pixelX}/${pixelY}, RGB: ${red},${green},${blue}`);
			}
		}
		
	}
}

export {ScreenshotAnalyser};
