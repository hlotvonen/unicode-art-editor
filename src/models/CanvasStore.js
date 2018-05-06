import { action, observable, computed, autorun, toJS } from 'mobx';
import setstore from './KeymappingsStore'

//[glyphPath, svgWidth, svgHeight, svgBaseline, glyphOffsetX, glyphFontSizeModifier, rotationAmount, flipGlyph, glyphInvertedColor]
export const EMPTY_GLYPH = ["M0 0", "1", "1", "0"]
const EMPTY_CELL = [...EMPTY_GLYPH, "0", "0", "0", "1", false];

let storage;

class CanvasStore {
//Initialize canvas
	constructor() {	

		//load from localstorage if it's not the first time
		if(localStorage.firstRun) {
			storage = JSON.parse(localStorage.storage)
			this.canvas = storage.canvas
			this.canvasWidth = storage.canvasWidth
			this.canvasHeight = storage.canvasHeight
			this.cellWidth = storage.cellWidth
			this.cellHeight = storage.cellHeight
			this.defaultFontSize = storage.defaultFontSize
			this.canvas = storage.canvas
			this.widthPixels = storage.widthPixels
			this.heightPixels = storage.heightPixels
		//else create empty canvas
		} else { 
			this.canvas = Array.from({length: this.canvasHeight}, () => Array.from({length: this.canvasWidth}, () => EMPTY_CELL ));
			this.widthPixels = this.canvasWidth * this.cellWidth;
			this.heightPixels = this.canvasHeight * this.cellHeight;
			localStorage.setItem('firstRun', false)
		}

		//set localstorage, autorun will update it every time something changes
		autorun(() => {
			const localstorage = {
				name: 'unicode-editor-file',
				timestamp: Math.floor(Date.now() / 1000),
				firstRun: false,
				canvasWidth: this.canvasWidth,
				canvasHeight: this.canvasHeight,
				cellWidth: this.cellWidth,
				cellHeight: this.cellHeight,
				defaultFontSize: this.defaultFontSize,
				widthPixels: this.widthPixels,
				heightPixels: this.heightPixels,
				canvas: this.canvas
			}
			localStorage.setItem("storage", JSON.stringify(localstorage));
		});
	}

//CANVAS
	@observable canvas;

//SETTINGS
	@observable canvasWidth = 20;
	@observable canvasHeight = 15;
	@observable cellWidth = 15;
	@observable cellHeight = 15;
	@observable defaultFontSize = 15;
	@observable hideGrid = false;
	@observable darkTheme = false;
	@observable widthPixels = 0;
	@observable heightPixels = 0;
	@observable copiedRow = [];

//
	@observable disableShortcuts = false;

//EXPORT
	@observable exportSizeMultiplier = 5;

//SAVE / LOAD
	@observable fileName = "Untitled";

//SELECTION
	@observable selected_y = 0;
	@observable selected_x = 0;
	@observable selectedUnicode = 0;
	@observable glyphPath = "M0 0";
	@observable svgHeight = 0;
	@observable svgWidth = 0;
	@observable svgBaseline = 0;
	@observable selectedFont = "Reviscii-Regular";
	@observable fontName = "Reviscii-Regular";
	@observable selectionStartPoint = [];
	@observable selection = [];

//Glyph fine tuning
	@observable glyphOffsetX = 0;
	@observable glyphOffsetY = 0;
	@observable glyphFontSizeModifier = 0;
	@observable rotationAmount = 0;
	@observable flipGlyph = "1";
	@observable glyphInvertedColor = false;
	//@observable increaseGlyphOffsetX = 0;
	//@observable increaseGlyphOffsetY = 0;

//Change canvas width
	@action addCol = () => {
		this.canvasWidth = this.canvasWidth + 1;
		for (const row of this.canvas) {
			row.push(EMPTY_CELL)
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
	@action addColLeft = () => {
		this.canvasWidth = this.canvasWidth + 1;
		for (const row of this.canvas) {
			row.unshift(EMPTY_CELL)
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
	@action deleteCol = () => {
		if(this.canvasWidth > 1){
			this.canvasWidth = this.canvasWidth - 1;
			if(this.selected_x == this.canvasWidth){
				this.selected_x = this.selected_x - 1;
			}
			for (const row of this.canvas) {
				row.pop()
			}
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
//Change canvas height
	@action addRow = () => { 
		this.canvasHeight = this.canvasHeight + 1;
		this.canvas.push(Array.from({length: this.canvasWidth}, () => EMPTY_CELL ));
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
	@action addRowTop = () => { 
		this.canvasHeight = this.canvasHeight + 1;
		this.canvas.unshift(Array.from({length: this.canvasWidth}, () => EMPTY_CELL ));
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
	@action deleteRow = () => {
		if(this.canvasHeight > 1){
			this.canvasHeight = this.canvasHeight - 1;
			if(this.selected_y == this.canvasHeight){
				this.selected_y = this.selected_y - 1;
			}
			this.canvas.pop()
		}
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
//Remove row at selection
	@action deleteRowAtSelection = () => {
		this.canvas.splice(this.selected_y, 1);
		this.canvasHeight = this.canvasHeight - 1;
		if(this.canvasHeight >= this.selected_y) {
			this.selected_y = this.selected_y - 1;
		}
		if(this.selected_y <= 0) {
			this.selected_y = this.selected_y + 1;
		}
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
//Remove col at selection
	@action deleteColAtSelection = () => {
		for (var i = 0; i < this.canvasHeight; i++) {
				var col = this.canvas[i];
				col.splice(this.selected_x, 1);
		}
		this.canvasWidth = this.canvasWidth - 1;
		if(this.canvasWidth >= this.selected_x) {
			this.selected_x = this.selected_x - 1;
		}
		if(this.selected_x <= 0) {
			this.selected_x = this.selected_x + 1;
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
//Add row at selection
	@action addRowAtSelection = () => {
		this.canvasHeight++;
		this.canvas.splice(this.selected_y, 0, Array.from({length: this.canvasWidth}, () => EMPTY_CELL ));
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
//Add col at selection
	@action addColAtSelection = () => {
		this.canvasWidth++;
		for (var i = 0; i < this.canvasHeight; i++) {
				var col = this.canvas[i];
				col.splice(this.selected_x, 0, EMPTY_CELL);
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}

//Change cell height
	increaseCellHeight = () => { 
		this.cellHeight = this.cellHeight + 1;
		this.heightPixels = this.canvasHeight * this.cellHeight;
	}
	decreaseCellHeight = () => {
		if(this.cellHeight > 1){
			this.cellHeight = this.cellHeight - 1;
			this.heightPixels = this.canvasHeight * this.cellHeight;
		}
	}
//Change cell width
	increaseCellWidth = () => { 
		this.cellWidth = this.cellWidth + 1;
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
	decreaseCellWidth = () => {
		if(this.cellWidth > 1){
			this.cellWidth = this.cellWidth - 1;
		}
		this.widthPixels = this.canvasWidth * this.cellWidth;
	}
//Change font size
	increaseFontSize = () => { 
		this.defaultFontSize = this.defaultFontSize + 1;
	}
	decreaseFontSize = () => {
		if(this.defaultFontSize > 1){
			this.defaultFontSize = this.defaultFontSize - 1;
		}
	}
//Toggle Hide Grid
	handleChangeHideGrid = () => { 
		this.hideGrid = !this.hideGrid;
		document.getElementById('hideGrid').checked = this.hideGrid; 
	}
//Toggle Dark Theme
	handleChangeTheme = () => { 
		this.darkTheme = !this.darkTheme;
	}

//Update Size of PNG export 
	@action updateExportSizeMultiplier = (evt) => {
		this.exportSizeMultiplier = evt.target.value;
	}
//Update File Name
	@action updateFileName = (evt) => {
		this.fileName = evt.target.value;
	}
//Load file 
	@action fileUpload = (evt) => {
	  const reader = new FileReader();
	  reader.onload = (evt) => {
	    const jsonObj = JSON.parse(evt.target.result);
			this.canvas = jsonObj["canvas"]
			this.canvasWidth = jsonObj["canvasWidth"]
			this.canvasHeight = jsonObj["canvasHeight"]
			this.cellWidth = jsonObj["cellWidth"]
			this.cellHeight = jsonObj["cellHeight"]
			this.defaultFontSize = jsonObj["defaultFontSize"]
			this.canvas = jsonObj["canvas"]
			this.widthPixels = jsonObj["widthPixels"]
			this.heightPixels = jsonObj["heightPixels"]
	  }
	  reader.readAsText(evt.target.files[0]);
	}
//Glyph offset X
	increaseGlyphOffsetX = () => {
		this.glyphOffsetX = this.canvas[this.selected_y][this.selected_x].slice()[4]; //First check the existing offset x value
		this.glyphOffsetX += this.svgWidth / 4; //Set offset amount to 10% of the glyph width 
		this.canvas[this.selected_y][this.selected_x][4] = this.glyphOffsetX; //Update canvas
	}
	decreaseGlyphOffsetX = () => {
		this.glyphOffsetX = this.canvas[this.selected_y][this.selected_x].slice()[4]; //First check the existing offset x value
		this.glyphOffsetX -= this.svgWidth / 4; //Set offset amount to 10% of the glyph width
		this.canvas[this.selected_y][this.selected_x][4] = this.glyphOffsetX; //Update canvas
	}
//Glyph offset Y
	increaseGlyphOffsetY = () => {
		this.glyphOffsetY = this.canvas[this.selected_y][this.selected_x].slice()[3]; //First check the existing offset x value
		this.glyphOffsetY += this.svgHeight / 4; //Set offset amount to 10% of the glyph width 
		this.canvas[this.selected_y][this.selected_x][3] = this.glyphOffsetY; //Update canvas
		console.log(this.glyphOffsetY);
	}
	decreaseGlyphOffsetY = () => {
		this.glyphOffsetY = this.canvas[this.selected_y][this.selected_x].slice()[3]; //First check the existing offset x value
		this.glyphOffsetY -= this.svgHeight / 4; //Set offset amount to 10% of the glyph width
		this.canvas[this.selected_y][this.selected_x][3] = this.glyphOffsetY; //Update canvas
		console.log(this.glyphOffsetY);

	}
//Glyph rotation
	rotateGlyphRight = () => {
		this.rotationAmount = this.canvas[this.selected_y][this.selected_x].slice()[6]; //First check the existing offset x value
		if(this.rotationAmount <= -270) {
			this.rotationAmount = 0;
		} else {
			this.rotationAmount = this.rotationAmount - 90;
		}
		this.canvas[this.selected_y][this.selected_x][6] = this.rotationAmount; //Update canvas
	}
	rotateGlyphLeft = () => {
		this.rotationAmount = this.canvas[this.selected_y][this.selected_x].slice()[6]; //First check the existing offset x value
		if(this.rotationAmount >= 270) {
			this.rotationAmount = 0;
		} else {
			this.rotationAmount = this.rotationAmount + 90;
		}
		this.canvas[this.selected_y][this.selected_x][6] = this.rotationAmount; //Update canvas
	}
//Toggle Glyph Invert Color
	handleChangeInvertColor = () => {
		this.glyphInvertedColor = this.canvas[this.selected_y][this.selected_x][8];
		this.glyphInvertedColor = !this.glyphInvertedColor;
		console.log('i');
		this.canvas[this.selected_y][this.selected_x][8] = this.glyphInvertedColor; //Update canvas
	}

//Glyph font size
	@computed get glyphFontSize() {
		return this.defaultFontSize + this.glyphFontSizeModifier;
	}
	increaseGlyphFontSizeModifier = () => {
		this.glyphFontSizeModifier = this.canvas[this.selected_y][this.selected_x].slice()[5]; //First check the existing glyphFontSizeModifier
		this.glyphFontSizeModifier++;
		this.canvas[this.selected_y][this.selected_x][5] = this.glyphFontSizeModifier; //Update canvas
	}
	decreaseGlyphFontSizeModifier = () => {
		if(this.glyphFontSize > 1){
			this.glyphFontSizeModifier = this.canvas[this.selected_y][this.selected_x].slice()[5]; //First check the existing glyphFontSizeModifier
			this.glyphFontSizeModifier--;
			this.canvas[this.selected_y][this.selected_x][5] = this.glyphFontSizeModifier; //Update canvas
		}
	}
//Flip glyph
	handleChangeFlip = () => {
		this.flipGlyph = this.canvas[this.selected_y][this.selected_x][7];
		this.flipGlyph = this.flipGlyph *= -1;
		this.canvas[this.selected_y][this.selected_x][7] = this.flipGlyph;
	}
//GlyphClear - reset selection to default
	glyphClear = () => {
		this.glyphFontSizeModifier = 0;
		this.glyphInvertedColor = false;
		this.rotationAmount = 0;
		this.glyphOffsetX = 0;
		this.glyphOffsetY = 0;
		this.canvas[this.selected_y][this.selected_x][3] = 0; //offset y
		this.canvas[this.selected_y][this.selected_x][4] = 0; //offset x
		this.canvas[this.selected_y][this.selected_x][5] = 0; //font size modifier
		this.canvas[this.selected_y][this.selected_x][6] = 0; //rotation
		this.canvas[this.selected_y][this.selected_x][7] = 1; //flip
		this.canvas[this.selected_y][this.selected_x][8] = false; //invert color
		document.getElementById('flipGlyph').checked = false; //uncheck flip glyph checkbox
		document.getElementById('invertColor').checked = false; //uncheck invert color checkbox
	}
	emptyCanvas = () => {
		this.glyphClear;
		this.selected_y = 0;
		this.selected_x = 0;
		this.canvasWidth = 10;
		this.canvasHeight = 10;
		this.cellWidth = 30;
		this.cellHeight = 30;
		this.defaultFontSize = 30;
		this.canvas = Array.from({length: this.canvasHeight}, () => Array.from({length: this.canvasWidth}, () => EMPTY_CELL ));
	}
	toggleWriting = () => {
		this.disableShortcuts = !this.disableShortcuts;
		console.log(this.disableShortcuts);
	}
//Tools
	goRight = () => {
				if(this.selected_x < this.canvasWidth - 1) {
						this.selected_x = this.selected_x + 1;
				}
				else if(this.selected_x = this.canvasWidth) {
						this.addCol();
				}
	}
	goLeft = () => {
			if(this.selected_x > 0){
					this.selected_x = this.selected_x - 1;
			}
			else if(this.selected_x = 1) {
				this.addColLeft();
				this.selected_x = this.selected_x - 1;
			}
	}
	goDown = () => {
			if(this.selected_y < this.canvasHeight - 1) {
					this.selected_y = this.selected_y + 1;
			}
			else if(this.selected_y = this.canvasHeight) {
					this.addRow();
			}
	}
	goUp = () => {
			if(this.selected_y > 0){
				this.selected_y = this.selected_y - 1;
			} 
			else if(this.selected_y = 1) {
				this.addRowTop();
				this.selected_y = this.selected_y - 1;
			}
	}
	insertEmpty = () => {
		this.canvas[this.selected_y][this.selected_x] = EMPTY_CELL;
	}
	insert = () => {
		this.canvas[this.selected_y][this.selected_x] = [this.glyphPath, this.svgWidth, this.svgHeight, this.svgBaseline, this.glyphOffsetX, this.glyphFontSizeModifier, this.rotationAmount, this.flipGlyph, this.glyphInvertedColor];
	}
	selectionStart = () => {
		this.selectionStartPoint = toJS([this.selected_x, this.selected_y])
	}
	copySelection = () => {
		this.selection = []
		let y_i = 0
    for (y_i = this.selectionStartPoint[1]; y_i <= this.selected_y; y_i++) {
				this.selection.push(this.canvas[y_i].slice(this.selectionStartPoint[0], this.selected_x + 1));
		}
	}
	pasteSelection = () => {
		let y_i = 0
		let x_i = 0
		let ix = 0
		let iy = 0
		let selectionLength_y = this.selection.length;
		let selectionLength_x = this.selection[0].length;
		const initCanvasWidth = this.canvasWidth;
		const initCanvasHeight = this.canvasHeight;
		//Add cols if paste goes over canvas boundaries 
		if(this.selected_x + selectionLength_x >= this.canvasWidth) {
			for (ix = 0; ix < toJS(this.selected_x + selectionLength_x - initCanvasWidth); ix++ ) {
				this.addCol();
			}
		}
		//Add rows if paste goes over canvas boundaries
		if(this.selected_y + selectionLength_y > this.canvasHeight) {
			for (iy = 0; iy < toJS(this.selected_y + selectionLength_y - initCanvasHeight); iy++ ) {
				this.addRow();
			}
		}
		//Paste selection
    if(selectionLength_y !== 0 && selectionLength_x !== 0) {
	    for (y_i = 0; y_i < selectionLength_y; y_i++) {
	    	for (x_i = 0; x_i < selectionLength_x; x_i++) {
	    		this.canvas[toJS(this.selected_y + y_i)][toJS(this.selected_x + x_i)] = toJS(this.selection[y_i][x_i])
	    	}
			}
		}
	}
	transposeSelection = () => {
		//WIP
		this.selection = this.selection.map((col, i) => this.selection.map(row => row[i]));
	}
	mirrorSelection = () => {
		//WIP
		this.selection = this.selection.map(function(arr){return arr.reverse();});
		let i;
		for (i = 0; i < this.selection.length; i++) {
			this.selection[i].forEach(function(element) {
				toJS(element[7] *= -1)
			});
		}
	}
	copyRow = () =>{
			this.copiedRow = toJS(this.canvas[this.selected_y])
	}
	pasteRow = () => {
			if(this.copiedRow.length !== 0) {
				this.copiedRow.length = this.canvasWidth;
				this.canvas[this.selected_y] = toJS(this.copiedRow)
			}
	}
	flipRow = () => {
			this.canvas[this.selected_y].forEach(function(element) {
				element[7] *= -1;
			});
	}
	rotateRow = () => {
			this.canvas[this.selected_y].forEach(function(element) {
				element[6] += 90;
			});
	}
}

export default new CanvasStore();