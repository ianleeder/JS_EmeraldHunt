'use strict';

import { EmeraldHunt } from './hunt.js';

class ScreenshotAnalyser {
	// DOM Canvas element.  Required for scaling.
	#canvas;

	// Store the image globally
	#img;

	// DOM element to render results to
	#output;
	
	constructor(c, out) {
		this.#canvas = c;
		this.#output = out;
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

		let spriteOffsetX = 6;
		let spriteOffsetY = 6;

		let freeSpace=0, dirt=0, brick=0, rock=0, emerald=0, grenade=0, unknown=0, bomb=0, cobble=0, bug=0, diamond=0;

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

				let type;

				if (red === 0 && green === 0 && blue === 0) {
					type = 'Free space';
					freeSpace++;
				} else if (red === 170 && green === 85 && blue === 0) {
					type = 'Dirt';
					dirt++;
				} else if (red === 170 && (green === 21 || green == 0) && blue === 0) {
					type = 'Brick';
					brick++;
				} else if (red === 170 && green === 170 && blue === 170) {
					type = 'Rock';
					rock++;
				} else if ((red === 86 && green === 250 && blue === 85) || (red === 85 && green === 255 && blue === 85)) {
					type = 'Emerald';
					emerald++;
				} else if (red === 85 && green === 85 && blue === 85) {
					type = 'Grenade';
					grenade++;
				} else if (red === 255 && green === 85 && blue === 85) {
					type = 'Bomb';
					bomb++;
				} else if (red === 85 && green === 85 && blue === 255) {
					type = 'Diamond';
					diamond++;
				} else if (red === 170 && green === 0 && blue === 170) {
					type = 'Bug';
					bug++;
				} else {
					unknown++;
					//console.log(`Sprite X/Y: ${x}/${y}, pixel X/Y: ${pixelX}/${pixelY}, RGB: ${red},${green},${blue}, type = unknown`);
				}
                
				console.log(`Sprite X/Y: ${x}/${y}, pixel X/Y: ${pixelX}/${pixelY}, RGB: ${red},${green},${blue}, type = ${type}`);
			}
		}
		
		let results = '';
		results += `Empty     ${freeSpace}<br>`;
		results += `Dirt      ${dirt}<br>`;
		results += `Rock      ${rock}<br>`;
		results += `Emerald   ${emerald}<br>`;
		results += `Brick     ${brick}<br>`;
		results += `Bomb      ${0}<br>`;
		results += `Exit      ${0}<br>`;
		results += `Dozer     ${0}<br>`;
		results += `Cobble    ${0}<br>`;
		results += `Bug       ${0}<br>`;
		results += `Diamond   ${0}<br>`;
		results += `Slime     ${0}<br>`;
		results += `Explosion ${0}<br>`;
		results += `Grenade   ${grenade}<br>`;
		results += `Unknown   ${unknown}<br>`;

		results += '<br>';

		let array = [0, dirt, rock, emerald, brick, bomb, 0, 0, cobble, bug, diamond, 0, 0, grenade, 0, 0];
		array.forEach(n => results += `${n.toString().padStart(4,' ')},`);

		// Remove the last comma
		results = results.slice(0, -1);

		this.#output.innerHTML = results;
	}
}

export {ScreenshotAnalyser};
