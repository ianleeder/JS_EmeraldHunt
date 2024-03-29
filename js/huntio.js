'use strict';

// Palette taken from wiki:
// https://en.wikipedia.org/wiki/Color_Graphics_Adapter
const cgaPalette = [
	[0x000000],
	[0x0000AA],
	[0x00AA00],
	[0x00AAAA],
	[0xAA0000],
	[0xAA00AA],
	[0xAA5500],
	[0xAAAAAA],
	[0x555555],
	[0x5555FF],
	[0x55FF55],
	[0x55FFFF],
	[0xFF5555],
	[0xFF55FF],
	[0xFFFF55],
	[0xFFFFFF]
];

function readSaveFile(buffer) {
	let dv = new DataView(buffer);
	// displayContents(contents);
	let score = dv.getUint16(0, true);
	let goal = dv.getUint16(2, true);

	console.log('Goal = ' + goal);
	let grenades = dv.getUint16(4, true);
	let grenadeDelay = dv.getUint16(6, true);
	let field = new Uint8Array(800);
	for (let i = 0, off = 8; i < field.length; i++, off++) {
		field[i] = dv.getUint8(off);
	}
	analyzeField(field);
}

function parseData(buffer) {
	/*
	Each tile is 134 bytes.
	4x Magic Header (00 0F 00 0F)
	128 bytes
	2x Magic Footer (90 21)
	*/
	let tileSize = 134;

	// There are 16 tiles (total file size 2144 bytes)
	if (buffer.byteLength != 2144) {
		alert('Invalid data file.');
		return;
	}

	let imgs = [];
	for (let i = 0; i < 16; i++) {
		imgs.push(parseSprite(buffer.slice(i * tileSize, (i + 1) * tileSize)));
	}
	return imgs;
}

/*
	Working with ArrayBuffers and TypedArrays:
	https://javascript.info/arraybuffer-binary-arrays

	Generating image from binary:
	https://stackoverflow.com/questions/14915058/how-to-display-binary-data-as-image-extjs-4
*/
function parseSprite(buffer) {
	let view = new DataView(buffer);

	// Let's check the magic header and footer, then discard them.
	if (view.getUint8(0) !== 15 ||
		view.getUint8(1) !== 0 ||
		view.getUint8(2) !== 15 ||
		view.getUint8(3) !== 0 ||
		view.getUint8(132) !== 144 ||
		view.getUint8(133) != 33) {
		console.log('Invalid sprite, Magic numbers incorrect');
		console.log('0 - ' + view.getUint8(0));
		console.log('1 - ' + view.getUint8(1));
		console.log('2 - ' + view.getUint8(2));
		console.log('3 - ' + view.getUint8(3));
		console.log('132 - ' + view.getUint8(132));
		console.log('133 - ' + view.getUint8(133));
		return;
	}

	/*
		Pixel information uses a similar interlaced format to ADAM7 interlacing (but is not applied vertically):
		http://en.wikipedia.org/wiki/Adam7_algorithm

		Each sprite/tile is 16x16px (256px).
		Each sprite/tile is 134 bytes.
		4x Magic Header (00 0F 00 0F)
		128x data
		2x Magic Footer (90 21)

		Naming convention P1:4 refers to pixel 1, bit 4 (MSB)
		Important to note these at 4-bit pixels (16-color, CGA).
		Need to map these values to the CGA color palette.

		Byte1 (0x04)	P1:4	P2:4	P3:4	P4:4	P5:4	P6:4	P7:4	P8:4
		Byte2 (0x05)	P9:4	P10:4	P11:4	P12:4	P13:4	P14:4	P15:4	P16:4
		Byte3 (0x06)	P1:3	P2:3	P3:3	P4:3	P5:3	P6:3	P7:3	P8:3
		Byte4 (0x07)	P9:3	P10:3	P11:3	P12:3	P13:3	P14:3	P15:3	P16:3
		...
		...							
		First row of 16 pixels finish at byte 8 (0x0B)

		Sequence starts again for next row at following byte (0x0C)
		16 rows go from 0x04 - 0x83 (or byte 4 to byte 131)
		Magic footer at 0x84 90 21								
	*/

	// Re-slicing the buffer throws off the byte offsets given above
	// Now data goes from 0x00 to 0x80 (128 bytes)
	view = new DataView(buffer, 4, 128);

	// If we split the data into 16-bit chunks, each chunk (Uint16) represents a pixel bit.
	// We can't use Uint16Array because it does not allow us to specify endianness,
	// and we end up with graphics split vertically (pixels 9-16 then 1-8)
	// Instead we must use DataView
	let pixels = new Array(256);

	// There are 16 rows of 16 pixels
	// Iterate the rows first
	for (let row = 0; row < 16; row++) {
		// Now iterate through our 16 pixels
		// (this loop is used to iterate our pixels results array, but not our binary source buffer)
		for (let p = 0; p < 16; p++) {
			pixels[row * 16 + p] = 0;
			// The 16 pixels are stored across 4x Uint16 (1 bit each)
			// (this loop is used to iterate our binary source buffer, but nor our pixel results array)
			for (let bit = 0; bit < 4; bit++) {
				// Dataview doesn't use an index like Uint16Array did, it uses a byte offset.
				// As such we need to multiply our "index" by 2 (2x bytes for every Uint16 we are after)
				if (view.getUint16((row * 4 + 3 - bit) * 2, false) & 1 << (15 - p))
					pixels[row * 16 + p] |= 1 << bit;
			}
		}
	}

	return generateImageFrom4bitPixels(pixels);
}

// Generate an image using a canvas
// https://stackoverflow.com/questions/22823752/creating-image-from-array-in-javascript-and-html5
function generateImageFrom4bitPixels(pixels) {
	let width = 16,
		height = 16,
		buffer = new Uint8ClampedArray(width * height * 4); // have enough bytes

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let pos = (y * width + x) * 4; // position in buffer based on x and y
			let rgb = cgaPalette[pixels[y * width + x]];
			buffer[pos] = (rgb & 0xff0000) >> 16;
			buffer[pos + 1] = (rgb & 0x00ff00) >> 8;
			buffer[pos + 2] = rgb & 0x0000ff;
			buffer[pos + 3] = 255;           // set alpha channel
		}
	}

	// create off-screen canvas element
	let canvas = document.createElement('canvas'),
		ctx = canvas.getContext('2d');

	canvas.width = width;
	canvas.height = height;

	// create imageData object
	let idata = ctx.createImageData(width, height);

	// set our buffer as source
	idata.data.set(buffer);

	// update canvas with new data
	ctx.putImageData(idata, 0, 0);
	return canvas.toDataURL(); // produces a PNG file
}

// Uses Promises to access a file from a URL
// Open the file use FileReader to convert to ArrayBuffer
// Splice and dice into sprites
// Returns array of img data URLs.
function loadImagesFromUrlAsync(url) {
	return fetch(url)
		.then(response => {
			if (!response.ok) {
				throw new Error(`Failed to read ${url}`);
			}
			return response.blob();
		})
		.then(blob => {
			return readFileStreamAsync(blob);
		})
		.then(arrayBuf => {
			return parseData(arrayBuf);
		})
		.catch(error => {
			console.error(error);
		});
}

async function loadImagesFromFileAsync(file) {
	let arrayBuf = await readFileStreamAsync(file);
	return parseData(arrayBuf);
}

// Wraps FileReader in a Promise so I can use modern notation instead of callbacks.
// Returns an ArrayBuffer
function readFileStreamAsync(fs) {
	// https://blog.shovonhasan.com/using-promises-with-filereader/
	const temporaryFileReader = new FileReader();

	return new Promise((resolve, reject) => {
		temporaryFileReader.onerror = () => {
			temporaryFileReader.abort();
			reject(new DOMException('Problem parsing input file.'));
		};

		temporaryFileReader.onload = () => {
			resolve(temporaryFileReader.result);
		};

		temporaryFileReader.readAsArrayBuffer(fs);
	});
}

function analyzeField(f) {
	let distribution = new Array(16);
	for (let i = 0; i < distribution.length; i++)
		distribution[i] = 0;

	for (let i = 0; i < f.length; i++) {
		distribution[f[i]]++;
	}
	console.log('Length = ' + f.length);
	let totalAvailable = distribution[3] + (5 * distribution[10]);
	console.log('Total available = ' + totalAvailable);
	console.log('Empty space = ' + distribution[0] + ' (' + (distribution[0] / 8) + ')%');
	console.log('Dirt = ' + distribution[1] + ' (' + (distribution[1] / 8) + ')%');
	console.log('Boulders = ' + distribution[2] + ' (' + (distribution[2] / 8) + ')%');
	console.log('Emeralds = ' + distribution[3] + ' (' + (distribution[3] / 8) + ')%');
	console.log('Brick wall = ' + distribution[4] + ' (' + (distribution[4] / 8) + ')%');
	console.log('Bomb = ' + distribution[5] + ' (' + (distribution[5] / 8) + ')%');

}

function displayContents(contents) {
	let element = document.getElementById('file-content');
	element.innerHTML = contents;
}

export { loadImagesFromUrlAsync, loadImagesFromFileAsync };