'use strict';

import { EmeraldHunt } from './hunt.js';

class ScreenshotAnalyser {
	// DOM Canvas element.  Required for scaling.
	#canvas;
	
	constructor(c) {
		this.#canvas = c;
	}

	loadImage(file) {
		let input = file.target;
		let img = new Image();

		// https://stackoverflow.com/a/42498790/5329728
		let reader = new FileReader();
		reader.onload = function() {
			var dataURL = reader.result;
			img.src = dataURL;
		};
		reader.readAsDataURL(input.files[0]);

		// https://stackoverflow.com/a/3530824/5329728
		img.onload = function() {
			this.#canvas.width = img.width;
			this.#canvas.height = img.height;
        
			var context = this.#canvas.getContext('2d');
			context.drawImage(img, 0, 0);
        
			var imageData = context.getImageData(0, 0, this.#canvas.width, this.#canvas.height);
            
			console.log(imageData);

			for(var y=0;y<EmeraldHunt.DEFAULTFIELDY;y++) {
				for(var x=0;x<EmeraldHunt.DEFAULTFIELDX;x++) {
					console.log(`${x},${y}`);
				}
			}
			EmeraldHunt.SPRITESIZE;
			// Now you can access pixel data from imageData.data.
			// It's a one-dimensional array of RGBA values.
			// Here's an example of how to get a pixel's color at (x,y)
			var index = (y*imageData.width + x) * 4;
			var red = imageData.data[index];
			var green = imageData.data[index + 1];
			var blue = imageData.data[index + 2];
			var alpha = imageData.data[index + 3];
		};
	}

}

export {ScreenshotAnalyser};
