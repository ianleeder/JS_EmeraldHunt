function readSingleFile(buffer) {
	let dv = new DataView(buffer);
	// displayContents(contents);
	let score = dv.getUint16(0, true);
	let goal = dv.getUint16(2, true);

	console.log("Goal = "+goal);
	let grenades = dv.getUint16(4, true);
	let grenadeDelay = dv.getUint16(6, true);
	let field = new Uint8Array(800);
	for(let i=0, off=8;i<field.length;i++, off++) {
		field[i] = dv.getUint8(off);
	}
	analyzeField(field);
}

function parseDataFile(buffer) {
	/*
	Each tile is 134 bytes.
	4x Magic Header (00 0F 00 0F)
	128 bytes
	2x Magic Footer (90 21)
	*/
	let tileSize = 134;
	
	// There are 16 tiles (total file size 2144 bytes)
	if(buffer.byteLength != 2144) {
		alert("Invalid data file.");
		return;
	}

	let begin = 0;
	for(let i=0;i<16;i++) {
		parseSprite(buffer.slice(begin, begin + tileSize));
		begin += tileSize;
	}
}

function parseSprite(buffer) {
	let view = new Uint8Array(buffer);
	console.log("view length = " + view.length);
	console.log("view bytelength = " + view.byteLength);
}

function openFile(e)
{
	let file = e.target.files[0];
	if (!file) {
		return;
	}

	let reader = new FileReader();
	reader.onload = function(e) {
		let buffer = e.target.result;
		parseDataFile(buffer)
	};
	reader.readAsArrayBuffer(file);
}

function analyzeField(f) {
	let distribution = new Array(16);
	for(let i=0;i<distribution.length;i++)
		distribution[i] = 0;

	for(let i=0;i<f.length;i++) {
		distribution[f[i]]++;
	}
	console.log("Length = " + f.length);
	let totalAvailable = distribution[3] + (5*distribution[10]);
	console.log("Total available = " + totalAvailable);
	console.log("Empty space = " + distribution[0] + " (" + (distribution[0]/8) + ")%");
	console.log("Dirt = " + distribution[1] + " (" + (distribution[1]/8) + ")%");
	console.log("Boulders = " + distribution[2] + " (" + (distribution[2]/8) + ")%");
	console.log("Emeralds = " + distribution[3] + " (" + (distribution[3]/8) + ")%");
	console.log("Brick wall = " + distribution[4] + " (" + (distribution[4]/8) + ")%");
	console.log("Bomb = " + distribution[5] + " (" + (distribution[5]/8) + ")%");

}

function displayContents(contents) {
	let element = document.getElementById('file-content');
	element.innerHTML = contents;
}

if (window.File && window.FileReader && window.FileList && window.Blob) {
	// Great success! All the File APIs are supported.
	document.getElementById('file-input')
	.addEventListener('change', openFile, false);
} else {
	alert('The File APIs are not fully supported in this browser.');
}

