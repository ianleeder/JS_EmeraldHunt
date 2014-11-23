function readSingleFile(e) {
	var file = e.target.files[0];
	if (!file) {
		return;
	}
	var reader = new FileReader();
	reader.onload = function(e) {
		var buffer = e.target.result;
		var dv = new DataView(buffer);

		// displayContents(contents);
		var score = dv.getUint16(0, true);
		var goal = dv.getUint16(2, true);

		console.log("Goal = "+goal);
		var grenades = dv.getUint16(4, true);
		var grenadeDelay = dv.getUint16(6, true);
		var field = new Uint8Array(800);
		for(var i=0, off=8;i<field.length;i++, off++) {
			field[i] = dv.getUint8(off);
		}
		analyzeField(field);
	};
	reader.readAsArrayBuffer(file);
}

function analyzeField(f) {
	var distribution = new Array(16);
	for(var i=0;i<distribution.length;i++)
		distribution[i] = 0;

	for(var i=0;i<f.length;i++) {
		distribution[f[i]]++;
	}
	console.log("Length = " + f.length);
	var totalAvailable = distribution[3] + (5*distribution[10]);
	console.log("Total available = " + totalAvailable);
	console.log("Empty space = " + distribution[0] + " (" + (distribution[0]/8) + ")%");
	console.log("Dirt = " + distribution[1] + " (" + (distribution[1]/8) + ")%");
	console.log("Boulders = " + distribution[2] + " (" + (distribution[2]/8) + ")%");
	console.log("Emeralds = " + distribution[3] + " (" + (distribution[3]/8) + ")%");
	console.log("Brick wall = " + distribution[4] + " (" + (distribution[4]/8) + ")%");
	console.log("Bomb = " + distribution[5] + " (" + (distribution[5]/8) + ")%");

}

function displayContents(contents) {
	var element = document.getElementById('file-content');
	element.innerHTML = contents;
}

if (window.File && window.FileReader && window.FileList && window.Blob) {
	// Great success! All the File APIs are supported.
	document.getElementById('file-input')
	.addEventListener('change', readSingleFile, false);
} else {
	alert('The File APIs are not fully supported in this browser.');
}

