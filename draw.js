// global consts
const framerate = 16.69; // ms per speed (default is 16.69 = 60.084fps)
const version = "WebtrisV1.1";

// draw consts
const min_tilesize = 14;
const max_tilesize = 98;

// states of the game
const STATE_TITLE = 0;
const STATE_LOBBY = 1;
const STATE_MENU = 9;
// ingame
const STATE_READY = 10;
const STATE_INGAME = 11;
const STATE_END = 12;
const STATE_VICTORY = 13;
const STATE_LOSE = 14;

// select a game mode
const TETRIS = 1;
const TETRIS_SP = 2;
const TETRIS_P = 3;
const TETRIS_EX = 4;
const DEMON_PRE = 7;
const DEMON = 8;
const TETRIS_D = 9;
const MULTITET = 10;

// messages
const MSG_NONE = 0;
const MSG_REGRET = 1;
const MSG_OK = 1;
const MSG_GOOD = 2;
const MSG_COOL = 3;
const MSG_EXCELLENT = 4;
const MSG_WICKED = 5;
const MSG_OUTSTANDING = 6;
const MSG_DENIED = 7;

// difficulty
const EASY = 1;
const NORMAL = 2;
const HARD = 3;

const SHORT = 1;
const MEDIUM = 2;
const LONG = 3;
const INFINITE = 4;


// global variables
// these variables will be used for drawing, some will also be used by main.js

// pointers to html elements
var mt; // canvas element
var ctx; // canvas context, for drawing
var debug; // pointer to the debug element
var info; // pointer to the gui element
var settings; // pointer to the settings div
var replay_d // pointer to the replay div
var selected_field; // pointer to the controls field that is selected

// canvas related variables
var w; // width of the canvas
var h; // height of the canvas

// key game variables
var mode; // mode of game play
var difficulty; // self-explanatory
var rank; // current assigned rank, 1p modes only 
var ex_rank;
var score; // score
var s_time; // time when starting
var e_time; // time when ending
var s_quadruples; // quadruples per section
var c_quadruples; // consecutive quadruples

var state; // game state, set using the state consts
var state_frame; // current frame of the state
var frame_game; // current frame of the game
var frame; // current frame of the game
var frame_replay; // current frame of the game, used for keeping the roll in replays
var s_frame; // time (frames) of current section
var anim_frame; // TODO: unused?
var player_num; // your current player number
var board_width; // width of board (in cells)
var board_height; // height of board (in cells)

// key draw variables
var bw; // width of board (in pixels)
var bh; // height of board (in pixels)
var wmargin;
var hmargin;
var tile_size; // size (in px) of each cell
var tile_size_smol; // smol
var scale; // scale of tilesize
var all_clear; // all clear animation frame
var canvas_blur; // array of blurs applied to the canvas
var end; // frame of death
var end_x; // x coord where death starts
var end_y; // y coord where death 
var underlay_drawn; // boolean for if the underlay is onscreen
var vfx_rng;
var bg_img;
// toggles for draws
var draw_bg;
var bg_no;
var draw_grid;
var draw_outline;
var draw_ghost;
var draw_vfx;
var autoresize;
var message;
var message_frame;
// framerate related variables
var frameskip; // toggle for automatic draw skip
var drawrate; // variable for draw rate (modulus of drawrate)
var ftimec; // time of current frame
var ftimep; // time of last frame

// game variables of things that are on the screen
var cpartner; // array 1-9 of partner blocks
var board; // 2D array of board
var board_fs; // 2D array of board of floorsparks
var spinsparks; // array of animatd sparks
var menu_option; // which option is selected in the menu
var menu_max; // how many options on the menu

// this method resizes the canvas to fit the browser window
function refreshCanvasSize() {
	set_canvas_size();
	
	// whoa do i gotta reset the tilesize tho?
	if (autoresize) set_tilesize();
	
	// redraw canvas nao
	redraw();
}

function set_canvas_size() {
	// check the window's current size and set it accordingly
	w = window.innerWidth < 290 ? 240 : window.innerWidth - 50;
	h = window.innerHeight < 185 ? 135 : window.innerHeight - 50;
	
	// update the actual canvas' size
	mt.width = w;
	mt.height = h;
}

// sets tilesize according to browser window
function set_tilesize() {
	tile_size = Math.max(Math.trunc(Math.min(max_tilesize, (w / 66), (h / 28))), min_tilesize);
	tile_size_smol = Math.trunc(tile_size * 0.75);
	scale = tile_size / min_tilesize; // a scale used for stuffs
	
	// set slider value to reflect
	document.getElementById("tilesizep").innerHTML = "Size: " + tile_size;
	document.getElementById("tileslider").value = tile_size;
}

// refresh entire canvas
function redraw(){	
	// clear the canvas
	clear_canvas();

	// draw the border (debug)
	//drawBorder();

	if (state == STATE_MENU) draw_menu_solo();
	// draw the board
	if (!(typeof board === 'undefined')) drawBoard();
	drawUnderAll();
	drawActiveAll();
	drawNextAll();
	if (!(typeof board === 'undefined')) {
		draw_floorspark();
		draw_spinspark();
	}
	
	drawGUI();
}

function drawBorder() {
	ctx.moveTo(0, 0);
	ctx.lineTo(0, h);
	ctx.lineTo(w, h);
	ctx.lineTo(w, 0);
	ctx.lineTo(0, 0);
	
	ctx.stroke();
}

// draw the current board
function drawBoard() {
	// board width (in pixels)
	bw = tile_size * board_width;
	// board height (in pixels)
	bh = tile_size * board_height;
	wmargin = (w - (bw)) / 2;
	hmargin = (h - (bh)) / 3;
	
	if (draw_underlay) {
		ctx.fillStyle = "#44444477"; // grid is darker when underlay is drawn
		ctx.strokeStyle = "#111111";
		ctx.fillRect(wmargin, hmargin - (tile_size_smol * 5), bw, bh + (tile_size_smol * 5));
		underlay_drawn = true; // unused variable, consider deleting
	} else ctx.strokeStyle = "#CCCCCC";
	
	ctx.beginPath();
	ctx.lineWidth = 1;
	
	if (draw_grid) {
		// draw vert. lines
		for (let x = 0; x <= board.length; x++) {
			ctx.moveTo(wmargin + (tile_size * x), hmargin + (tile_size * 2));
			ctx.lineTo(wmargin + (tile_size * x), hmargin + (board_height * tile_size));
		}
		
		// draw horiz. lines
		for (let y = 2; y <= board[0].length; y++) {
			ctx.moveTo(wmargin, hmargin + (tile_size * y));
			ctx.lineTo(wmargin + (board_width * tile_size), hmargin + (tile_size * y));
		}
	}
	
	ctx.stroke();
	ctx.closePath();
	
	// draw border
	ctx.strokeStyle = "#000000";
	if (mode == DEMON) ctx.strokeStyle = "#F0000F";
	ctx.lineWidth = 4;
	ctx.strokeRect(wmargin, hmargin + (tile_size * 2), bw, bh - (tile_size * 2));
	
	// draw all clear text
	if (all_clear > 0) {
		// TODO: move this to HTML DOM
		// draw all clear font
		ctx.font = tile_size + "pt K2D";
		ctx.lineWidth = parseInt(tile_size / 10);
		if (all_clear % 8 < 4) ctx.fillStyle = "#F00000";
		else ctx.fillStyle = "#F0F000";
		ctx.textAlign = "center";
		ctx.strokeText("All Clear!", w / 2, hmargin + bh / 2); 
		ctx.fillText  ("All Clear!", w / 2, hmargin + bh / 2);
	}
	
	// update any 20g blurs that may be active
	draw_blurs(true);
	
	// draw tiles on board
	drawTiles();
}

function drawTiles() {
	if (ctx.strokeStyle != "#000000") ctx.strokeStyle = "#000000";
	ctx.lineWidth = tile_size * 0.3;
	
	if (draw_outline) {
		// draw outline only
		for (let x = 0; x < board.length; ++x) {
			for (let y = 0; y < board[x].length; ++y) {
				if (board[x][y] <= 0) continue;
				ctx.strokeRect(wmargin + (tile_size * x), hmargin - ((y - board_height + 1) * tile_size), tile_size, tile_size);
			}
		}
	}
	
	// draw actual tiles
	for (let x = 0; x < board.length; ++x) {
		for (let y = 0; y < board[x].length; ++y) {
			if (board[x][y] == 0) continue;
			
			// set tile color
			if (ctx.fillStyle != getTileColor(board[x][y])) ctx.fillStyle = getTileColor(board[x][y]);
			
			// death processing during END state
			if (state == STATE_END) {
				if (board[x][y] > 0) {
					let quit = false;
					// if the effect has progressed past this y
					for (let i = 0; i < end; ++i) {
						if (end_y - ((end - i ) / 5) <= y && (end_x - (i / 5) <= x && end_x + (i / 5) >= x)) {
							quit = true;
							break;
						}
					}
					// yes it actually takes that long to figure out if the x is ripe start fading
					if (quit) {
						board[x][y] *= -100;
						board[x][y] -= 99;
					}
				} else { // set fading color
					// set color to its regular tile color
					ctx.fillStyle = getTileColor(Math.trunc(board[x][y] / -100));
					
					// add the fade alpha to it
					let fade = board[x][y] % 100;
					fade *= -2.55;
					ctx.fillStyle += Math.trunc(fade);
					
					// increment the fade
					if (board[x][y] != 0) {
						if (board[x][y] % 100 >= -6) board[x][y] = 0;
						else board[x][y] ++;
					}
				}
			}
			
			// actual draw
			ctx.fillRect(wmargin + (tile_size * x) - 1, hmargin - ((y - board_height + 1) * tile_size) - 1, tile_size + 2, tile_size + 2);
		}
	}
}

// draws the burning floor animation shown when you move across the floor in 20g
function draw_floorspark() {
	var fsx;
	var fsy;
	var fsh;
	for (let fs_mode = 0; fs_mode <= 1; ++fs_mode) {
		if (fs_mode == 1) ctx.fillStyle = "#FFFFFF"; // change to white only once when drawing floorsparks
		for (let x = 0; x < board_fs.length; ++x) {
			for (let y = 0; y < board_fs[x].length; ++y) {
				if (board_fs[x][y].color == -1) continue;
				if (board_fs[x][y].frame > 7) continue;
				//ctx.fillRect(wmargin + (tile_size * x) - 1, hmargin - ((y - board_height + 1) * tile_size) - 1, tile_size + 2, tile_size + 2);
				fsx = wmargin + (tile_size * x) - (board_fs[x][y].dir * scale * 3);
				fsy = hmargin - ((y - board_height + 1) * tile_size);
				fsh = board_fs[x][y].frame * scale;
				fshw = board_fs[x][y].frame / 1.4 * scale;
				if (board_fs[x][y].dir == 1) {
					// draw the outer park of the spark
					if (fs_mode == 0) {
						if (ctx.fillStyle != getTileColor(board_fs[x][y].color)) ctx.fillStyle = getTileColor(board_fs[x][y].color);
						ctx.beginPath();
						ctx.moveTo(fsx, 7 * scale + fsy + fsh);
						ctx.lineTo(12 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(3 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
						ctx.fill();

						ctx.beginPath();
						ctx.moveTo(4 * scale + fsx, 7 * scale + fsy + fsh);
						ctx.lineTo(16 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(7 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
					} else {
						// draw the inner white filling
						ctx.beginPath();
						ctx.moveTo(2 * scale + fsx, 9 * scale + fsy + fshw);
						ctx.lineTo(11 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(5 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
						ctx.fill();

						ctx.beginPath();
						ctx.moveTo(6 * scale + fsx, 9 * scale + fsy + fshw);
						ctx.lineTo(14 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(8 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
					}
				} else {
					// draw the outer part of the spark
					if (fs_mode == 0) {
						if (ctx.fillStyle != getTileColor(board_fs[x][y].color)) ctx.fillStyle = getTileColor(board_fs[x][y].color);
						ctx.beginPath();
						ctx.moveTo(14 * scale + fsx, 7 * scale + fsy + fsh);
						ctx.lineTo(2 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(11 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
						ctx.fill();

						ctx.beginPath();
						ctx.moveTo(10 * scale + fsx, 7 * scale + fsy + fsh);
						ctx.lineTo(-2 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(7 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
					} else {
						// draw the inner white filling
						ctx.beginPath();
						ctx.moveTo(12 * scale + fsx, 9 * scale + fsy + fshw);
						ctx.lineTo(3 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(9 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
						ctx.fill();

						ctx.beginPath();
						ctx.moveTo(8 * scale + fsx, 9 * scale + fsy + fshw);
						ctx.lineTo(0 * scale + fsx, 14 * scale + fsy);
						ctx.lineTo(6 * scale + fsx, 14 * scale + fsy);
						ctx.closePath();
					}
				}
				ctx.fill();
				board_fs[x][y].frame++;
			}
		}
	}
}

// draws the animated flying sparks
function draw_spinspark() {
	for (let i = 0; i < spinsparks.length; ++i) {
		// the actual draw
		ctx.beginPath();
		ctx.arc(spinsparks[i][0], spinsparks[i][1], tile_size / 7, 0, 2 * Math.PI);
		ctx.closePath();
		ctx.fill();
	}
}

// draws every single player on the board
function drawActiveAll() { 
	// not ingame, don't do this
	if (state != STATE_INGAME) return;
	// do this
	for (let i = 0; i < players.length; ++i) {
		if (players[i].state == STATE_MOVE) {
			// draw the ghost, but only if can move down
			if (checkDown(players[i]) && draw_ghost) drawGhost(get_ghost(players[i]));
			drawActive(players[i]);
		} else {
			ctx.fillStyle = players[i].getColor();
		}
		drawNext(players[i]);
		drawHold(players[i]);
	}
}

// draws the nexts of all players during the ready phase
function drawNextAll() { 
	if (state != STATE_READY) return;
	for (let i = 0; i < players.length; ++i) {
		ctx.fillStyle = players[i].getColor();
		drawNext(players[i]);
	}
}

function drawUnderAll() { 
	// not ingame, don't do this
	if (state != STATE_INGAME) return;
	// do this
	ctx.fillStyle = "#FFFFFF";
	for (let i = 0; i < players.length; ++i) if (players[i].state == STATE_MOVE) drawUnder(players[i]);
}

function drawActive(curr) {	
	// define variables used for drawing the current object
	var blockx = wmargin + (curr.x * tile_size) - tile_size;
	var blocky = hmargin - ((curr.y - board_height + 1) * tile_size) - tile_size;
	ctx.fillStyle = curr.getColor();
	
	// draw by collision
	for (let i = 0; i < 4; ++i){
		blockx = wmargin + (curr.coll[i][0] * tile_size);
		blocky = hmargin - ((curr.coll[i][1] - board_height + 1) * tile_size);
		ctx.fillRect(blockx - 1, blocky - 1, tile_size + 2, tile_size + 2);
	}
}

// draws the white shadow that appears under the current object
function drawUnder(curr) {
	// low gravity flash
	if (checkDown(curr, false)) {
		if (curr.g > 50 && curr.get_gravity() < 100) return;
		if (curr.get_gravity() >= 100 && frame_game % 2 == 0) return; 
	}
	// define variables used for drawing the current object
	var blockx = wmargin + (curr.x * tile_size) - tile_size;
	var blocky = hmargin - ((curr.y - board_height + 1) * tile_size) - tile_size;
	
	// draw by collision
	for (let i = 0; i < 4; ++i){
		blockx = wmargin + (curr.coll[i][0] * tile_size);
		blocky = hmargin - ((curr.coll[i][1] - board_height + 1) * tile_size);
		ctx.fillRect(blockx - (tile_size * 0.15), blocky - (tile_size * 0.15), tile_size * 1.3, tile_size * 1.3);
	}
}

// WARNING: do not change case
function drawGhost(curr) {
	// define variables used for drawing the current object
	// x and y coordinates of block itself
	var blockx = wmargin + (curr.x * tile_size) - tile_size;
	var blocky = hmargin - ((curr.y - board_height + 1) * tile_size) - tile_size;
	ctx.fillStyle = curr.getGhostColor();
	
	// draw by collision
	for (let i = 0; i < 4; ++i){
		blockx = wmargin + (curr.coll[i][0] * tile_size);
		blocky = hmargin - ((curr.coll[i][1] - board_height + 1) * tile_size);
		ctx.fillRect (blockx, blocky - 0.1, tile_size, tile_size + 0.2);
	}
}

function drawNext(curr) {
	// define variables used for drawing the current object
	// x and y coordinates of block itself
	var blockx = wmargin + (playercoord(curr) * tile_size) - tile_size;
	var blocky = hmargin;
	// default width and height of "main" block
	var blockw = tile_size * 3;
	var blockh = tile_size;
	var block2y = 0;
	var block2x = 0;
	
	// draw by type
	switch (curr.next){
	case block_o:
		blockx += tile_size;
		blocky -= tile_size;
		
		ctx.fillRect (blockx, blocky, tile_size * 2, tile_size * 2);
		break;
	case block_j:
		block2y = -tile_size;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size, tile_size);
		break;
	case block_l:
		block2x = 2 * tile_size;
		block2y = -tile_size;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size, tile_size);
		break;
	case block_z:
		blocky -= tile_size;
		block2y = tile_size;
		block2x = tile_size;
		blockw = tile_size * 2;
		
		ctx.fillRect (blockx, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y, blockw, blockh);
		break;
	case block_s:
		blocky -= tile_size;
		block2y = tile_size;
		block2x = tile_size;
		blockw = tile_size * 2;
		
		ctx.fillRect (blockx + block2x, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx, blocky + block2y, blockw, blockh);
		break;
	case block_t:
		block2x = tile_size;
		block2y = -tile_size;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size, tile_size);
		break;
	case block_i:
		blockw = tile_size * 4;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		break;
	}
	
	if (mode == DEMON || mode == TETRIS_EX) {
		draw_pnext(curr.pnext, curr, 0);
		draw_pnext(curr.pnext2, curr, 1);
	}
}

function draw_pnext(next_in, curr, position) {
	// define variables used for drawing the current object
	// x and y coordinates of block itself
	var blockx = wmargin + (playercoord(curr) * tile_size) - tile_size + (tile_size_smol * 4 * position) + (tile_size * 4.4);
	var blocky = hmargin - tile_size_smol * 0.6;
	// default width and height of "main" block
	var blockw = tile_size_smol * 3;
	var blockh = tile_size_smol;
	var block2y = 0;
	var block2x = 0;
	
	// draw by type
	switch (next_in){
	case block_o:
		blockx += tile_size_smol;
		blocky -= tile_size_smol;
		
		ctx.fillRect (blockx, blocky, tile_size_smol * 2, tile_size_smol * 2);
		break;
	case block_j:
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_l:
		block2x = 2 * tile_size_smol;
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_z:
		blocky -= tile_size_smol;
		block2y = tile_size_smol;
		block2x = tile_size_smol;
		blockw = tile_size_smol * 2;
		
		ctx.fillRect (blockx, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y, blockw, blockh);
		break;
	case block_s:
		blocky -= tile_size_smol;
		block2y = tile_size_smol;
		block2x = tile_size_smol;
		blockw = tile_size_smol * 2;
		
		ctx.fillRect (blockx + block2x, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx, blocky + block2y, blockw, blockh);
		break;
	case block_t:
		block2x = tile_size_smol;
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_i:
		blockw = tile_size_smol * 3.5;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		break;
	}
}

function drawHold(curr) {
	if (mode == DEMON_PRE) {
		ctx.beginPath();
		ctx.strokeStyle = (curr.getColor());
		ctx.moveTo(wmargin + (playercoord(curr) * tile_size) + (tile_size_smol * -3), hmargin - (tile_size_smol * 4));
		ctx.lineTo(wmargin + (playercoord(curr) * tile_size) + (tile_size_smol * -3) + (tile_size_smol * 3), hmargin - (tile_size_smol * 4) + (tile_size_smol * 1.5));
		ctx.stroke();
		ctx.closePath();
		return;
	}
	if (curr.held == 0) return;
	// define variables used for drawing the current object
	// x and y coordinates of block itself
	var blockx = wmargin + (playercoord(curr) * tile_size) + (tile_size_smol * (curr.player < 6 ? -3 : 3));
	var blocky = hmargin - (tile_size_smol * 3);
	// default width and height of "main" block
	var blockw = tile_size_smol * 3;
	var blockh = tile_size_smol;
	var block2y = 0;
	var block2x = 0;
	if (ctx.fillStyle != curr.getColorHold()) ctx.fillStyle = curr.getColorHold();
	
	// draw by type
	switch (curr.held){
	case block_o:
		blockx += tile_size_smol;
		blocky -= tile_size_smol;
		
		ctx.fillRect (blockx, blocky, tile_size_smol * 2, tile_size_smol * 2);
		break;
	case block_j:
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_l:
		block2x = 2 * tile_size_smol;
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_z:
		blocky -= tile_size_smol;
		block2y = tile_size_smol;
		block2x = tile_size_smol;
		blockw = tile_size_smol * 2;
		
		ctx.fillRect (blockx, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y, blockw, blockh);
		break;
	case block_s:
		blocky -= tile_size_smol;
		block2y = tile_size_smol;
		block2x = tile_size_smol;
		blockw = tile_size_smol * 2;
		
		ctx.fillRect (blockx + block2x, blocky + 1, blockw, blockh);
		ctx.fillRect (blockx, blocky + block2y, blockw, blockh);
		break;
	case block_t:
		block2x = tile_size_smol;
		block2y = -tile_size_smol;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		ctx.fillRect (blockx + block2x, blocky + block2y + 1, tile_size_smol, tile_size_smol);
		break;
	case block_i:
		blockw = tile_size_smol * 4;
		
		ctx.fillRect (blockx, blocky, blockw, blockh);
		break;
	}
}

function draw_blurs(drawn) {
	// skip this if there are no blurs
	if (canvas_blur.length == 0) return;
	
	// variable init
	var blockx = 0;
	var blocky = 0;
	
	// 0 = x, 1 = y, 2 = w, 3 = h, 4 = c, 5 = l
	for (let i = 0; i < canvas_blur.length; ++i) {
		// pop unused
		if (canvas_blur[i][5] <= 0) {
			canvas_blur.splice(i, 1);
			i--;
			continue;
		}
		
		// variable set
		ctx.fillStyle = getBlurColor(canvas_blur[i][4]);
		blockx = wmargin + (canvas_blur[i][0] * tile_size) - tile_size;
		blocky = hmargin + (((board_height - canvas_blur[i][1]) - canvas_blur[i][5]) * tile_size);
		
		// actual draw
		if (drawn) ctx.fillRect(blockx, blocky, canvas_blur[i][2] * tile_size, (canvas_blur[i][5]) * tile_size);
		
		// decrement length
		canvas_blur[i][5] -= 3;
	}
}

function drawGUI() {
	info.style.fontSize = (tile_size - 4) + "pt";
	
	if (state < STATE_INGAME) return;
	info.innerHTML = ""; // clear ui
	var pleft = 0;
	var ptop = 0;
	
	for (let i = 0; i < players.length; ++i){
		pleft = wmargin + (((playercoord(players[i]) - 1)) * tile_size + (tile_size * 0.5)) + "px";
		ptop = (bh + hmargin) + "px";
		
		// draw the current level
		info.innerHTML += "<p style= \"position: absolute; left:" + pleft + "; top:" + ptop + "; color:" + getTileColor(players[i].color) + ";\">Lv" +
			players[i].level + ".<small><small>" + (players[i].sublevel < 10 ? "0" + players[i].sublevel :
			players[i].sublevel) + "</small></small></p>";
		//ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.33)) + "px";
		//info.innerHTML += "<p style= \"position: absolute; left:" + pleft + "; top:" + ptop + ";\">P1 HDBlink</p>";
		// BUG: ui will draw out of bounds if canvas is too small
	}
	
	// player info
	switch (message) {
	case MSG_COOL:
		ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.22 * 1.5)) + "px";
		pleft = ((w - 500) / 2);
		info.innerHTML += "<p style= \"font-family: K2D; color:" + (frame_game % 8 < 4 ? "gold" : "white") + "; font-size:" + (tile_size + 2) + 
		"pt; position: absolute; width: 500px; left:" +
		pleft + "px; text-align: center; top:" + ptop + ";\">COOL!</p>";
		break;
	case MSG_EXCELLENT:
		ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.22 * 1.5)) + "px";
		pleft = ((w - 500) / 2);
		info.innerHTML += "<p style= \"font-family: K2D; color:" + (frame_game % 8 < 4 ? "gold" : "blue") + "; font-size:" + (tile_size + 2) + 
		"pt; position: absolute; width: 500px; left:" +
		pleft + "px; text-align: center; top:" + ptop + ";\">EXCELLENT!</p>";
		break;
	case MSG_WICKED:
		ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.22 * 1.5)) + "px";
		pleft = ((w - 500) / 2);
		info.innerHTML += "<p style= \"font-family: K2D; color:" + (frame_game % 8 < 4 ? "gold" : "red") + "; font-size:" + (tile_size + 2) + 
		"pt; position: absolute; width: 500px; left:" +
		pleft + "px; text-align: center; top:" + ptop + ";\">WICKED!</p>";
		break;
	case MSG_OUTSTANDING:
		ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.22 * 1.5)) + "px";
		pleft = ((w - 500) / 2);
		info.innerHTML += "<p style= \"font-family: K2D; color:" + (frame_game % 4 < 2 ? "gold" : "silver") + "; font-size:" + (tile_size + 2) + 
		"pt; position: absolute; width: 500px; left:" +
		pleft + "px; text-align: center; top:" + ptop + ";\">OUTSTANDING!</p>";
		break;
	case MSG_NONE:
		if (viewing_replay) {
			ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.33 * 1.5)) + "px";
			pleft = ((w - 500) / 2);
			info.innerHTML += "<p style= \"font-family: Share Tech Mono; color:" + getTileColor(player_num) + "; font-size:" + (tile_size + 2) + 
			"pt; position: absolute; width: 500px; left:" +
			pleft + "px; text-align: center; top:" + ptop + ";\">[REPLAY]</p>";
		} break;
	}
	
	// draw time
	info.innerHTML += "<div id=\"time\"></div>";
	draw_timer();
		
	// win hte game
	if (win && mode == TETRIS && difficulty == EASY && state != STATE_VICTORY) {
		info.innerHTML += "<p style= \"font-family: Share Tech Mono; color: silver; position: absolute; width: 500px; left:" +
			Math.trunc(w / 3) + "px; top:" + (Math.trunc(bh / 2) + hmargin) + "px;\">u won the game lol</p>";
	}
	
	// draw rank for 1p mode
	if (mode < TETRIS_D) draw_rank();
	
	if (state == STATE_VICTORY || state == STATE_LOSE) {
		draw_end_msg();
	}
}

function draw_timer() {
	//info.style.fontSize = ((tile_size - 4) * 1.5) + "pt";
	// set the time
	var time = "";
	// minutes
	var timeadd = parseInt(frame / 3600) + ":";
	while (timeadd.length < 3) timeadd = "0" + timeadd;
	time += timeadd;
	// seconds
	timeadd = parseInt((frame / 60) % 60) + ":";
	while (timeadd.length < 3) timeadd = "0" + timeadd;
	time += timeadd;
	// miliseconds
	timeadd = String(parseInt((frame % 60) * 16.667));
	while (timeadd.length < 3) timeadd = "0" + timeadd;
	time += timeadd;
	
	// draw the timer
	var ptop = (bh + hmargin + (parseInt(info.style.fontSize) * 1.33 * 3)) + "px";
	var pleft = ((w - 500) / 2);
	document.getElementById("time").innerHTML = "<p style= \"font-family: Share Tech Mono; color: silver; font-size:" + (tile_size + 2) + 
		"pt; position: absolute; width: 500px; left:" +
		pleft + "px; text-align: center; top:" + ptop + ";\">" + time + "</p>";
		
	// currently not using the slowdown rate feature
	if (false) {//(state == STATE_VICTORY || state == STATE_LOSE) {
		var s_rate;
		s_rate = frame / 60 * 1001.4; //16.69
		s_rate = Math.trunc(((s_rate / (e_time - s_time)) - 1) * 10000) / -100;
		s_rate += "%";
		
		document.getElementById("time").innerHTML += "<p style= \"font-family: Share Tech Mono; color: #E00000; position: absolute; width: 500px; left: " +
		Math.trunc(pleft * 1.5) + "px; text-align: right; top:" + ptop + ";\">Slowdown rate: " + s_rate + "</p>";
	}
}


function draw_menu_solo() {
	info.innerHTML = ""; // clear string
	var width = tile_size * 10;
	var ptop = (h / 3.3);
	var ptopt = (hmargin - (parseInt(info.style.fontSize) + 8) * 2);
	var pleft = ((w - width) / 2);
	var pm = w / 2;
	
	info.style.fontSize = (tile_size - 4) + "pt";
	switch (mode) {
	case TETRIS_D:
	info.innerHTML = "<p style=\"color: #0000F0; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptopt + "px; text-align: center; background-image: linear-gradient(to right, #00000000, #000000 50%, #00000000); font-size: " +
		(tile_size + 4) + "pt;\">DOUBLES</p>";
		
	info.innerHTML += "<div style=\"color: silver; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptop + "px; text-align: center;\">" +
		"<p" + (menu_option == 0 ? " class=\"st-selected2\" " : "") + ">Short</p>" +
		"<p" + (menu_option == 1 ? " class=\"st-selected2\" " : "") + ">Medium</p>" +
		"<p" + (menu_option == 2 ? " class=\"st-selected2\" " : "") + ">Long</p>" +
		"<p" + (menu_option == 3 ? " class=\"st-selected2\" " : "") + ">Infinite</p></div>";
	break;
	case TETRIS: default:
	info.innerHTML = "<p style=\"color: #F00000; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptopt + "px; text-align: center; background-image: linear-gradient(to right, #00000000, #000000, #00000000); font-size: " +
		(tile_size + 4) + "pt;\">ARCADE</p>";
		
	info.innerHTML += "<div style=\"color: silver; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptop + "px; text-align: center;\">" +
		"<p" + (menu_option == 0 ? " class=\"st-selected1\" " : "") + ">Easy</p>" +
		"<p" + (menu_option == 1 ? " class=\"st-selected2\" " : "") + ">Normal</p>" +
		"<p" + (menu_option == 2 ? " class=\"st-selected3\" " : "") + ">Hard</p>" +
		"<p" + (menu_option == 3 ? " class=\"st-selected4\" " : "") + ">Infinite</p></div>";
	break;
	case TETRIS_P:
	info.innerHTML = "<p style=\"color: #F020C0; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptopt + "px; text-align: center; background-image: linear-gradient(to right, #00000000, #000000 50%, #00000000); font-size: " +
		(tile_size + 4) + "pt;\">SPECIAL</p>";
		
	ptop = hmargin + bh / 2 - (parseInt(info.style.fontSize) / 2);
	info.innerHTML += "<div style=\"color: silver; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptop + "px; text-align: center;\">" +
		"<p class=\"st-selected1\">PLACEBO</p></div>";
	break;
	case TETRIS_EX:
	info.innerHTML = "<p style=\"color: #C020C0; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptopt + "px; text-align: center; background-image: linear-gradient(to right, #00000000, #000000 50%, #00000000); font-size: " +
		(tile_size + 4) + "pt;\">EXTRA</p>";
		
	info.innerHTML += "<div style=\"color: silver; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptop + "px; text-align: center;\">" +
		"<p" + (menu_option == 0 ? " class=\"st-selected1\" " : "") + ">PLUS</p>" +
		"<p" + (menu_option == 1 ? " class=\"st-selected4\" " : "") + ">Extra</p>" +
		"<p" + (menu_option == 2 ? " class=\"st-selected5\" " : "") + ">Exceed</p>" +
		"<p" + (menu_option == 3 ? " class=\"" + ( frame_game % 4 == 0 ? "st-selected3\"" : "st-selected5\"") : "") + ">DEMON</p></div>";
	break;
	}
	
	// draw my arrows
	ctx.fillStyle = "#000000";
	ctx.beginPath();
	ctx.moveTo(pm + (tile_size * 10), ptopt + (tile_size * 3));
	ctx.lineTo(pm + (tile_size * 13), ptopt + (tile_size * 4));
	ctx.lineTo(pm + (tile_size * 10), ptopt + (tile_size * 4));
	ctx.closePath();
	ctx.fill();
	// left arrow
	ctx.beginPath();
	ctx.moveTo(pm - (tile_size * 10), ptopt + (tile_size * 3));
	ctx.lineTo(pm - (tile_size * 13), ptopt + (tile_size * 4));
	ctx.lineTo(pm - (tile_size * 10), ptopt + (tile_size * 4));
	ctx.closePath();
	ctx.fill();
	
}

function draw_end_msg() {
	var width = tile_size * 14;
	var ptop = h / 3;
	var pleft = ((w - width) / 2);
	
	var message = "GAME OVER";
	if (win) {
		let modemsg = "???";
		switch (mode) {
		case TETRIS_EX:
			if (difficulty == 2) modemsg = "EXTRA";
			if (difficulty == 3) modemsg = "EXCEED";
			break;
		case TETRIS_P:
			modemsg = "PLUS"; break;
		case TETRIS:
			switch (difficulty) {
			case EASY: modemsg = "EASY"; break;
			case NORMAL: modemsg = "NORMAL"; break;
			case HARD: modemsg = "HARD"; break;
			}
			break;
		default:
			switch (difficulty) {
			case SHORT: modemsg = "SHORT"; break;
			case MEDIUM: modemsg = "MEDIUM"; break;
			case LONG: modemsg = "LONG"; break;
			}
			break;
		}
		message = "EXCELLENT! " + modemsg + "&nbsp;MODE CLEAR!";
		if (max_rank(rank)) message = "CONGRATULATIONS! YOU&nbsp;ARE " + modemsg + "&nbsp;MASTER!";
		
		// PLUS mode messages
		if (mode == TETRIS_P) {
			if (ex_rank < 11) message = "EXCELLENT!<br/>But...<br/>Let's&nbsp;do&nbsp;better next&nbsp;time.";
			if (ex_rank == 16) message = "EXCELLENT!<br/>Now do it without cheating.";
		}
		if (mode == DEMON_PRE) {
			message = "PATHETIC!<br/>Are&nbsp;you<br/>even&nbsp;trying?";
		}
		// "EXCELLENT! But... Let's do better next time." (torikan'd at lv 10/15)
		// "OUTSTANDING! But... Let's do better next time." (torikan'd at lv 20)
		// "OUTSTANDING! But... the hand of god is still far away." (no gm at lv25)
		// "OUTSTANDING! YOU ARE GRAND!" (gm at lv25)
		// "WOW! INCREDIBLE! YOU ARE DEMON MASTER!!" (dm at lv25)
	}
	
	info.innerHTML += "<p style=\"color: " + getTileColor(player_num) + "; position: absolute; width: " + width + "px; left:" +
		pleft + "px; top:" + ptop + "px; text-align: center; font-size: " +
		(tile_size + 6) + "pt;\">" + message + "</p>";
	
}

function draw_ready() {
	info.innerHTML = ""; // clear string
	var width = tile_size * 10;
	var ptop = (h / 3) + "px";
	var pleft = ((w - width) / 2) + "px";
	var word = "READY !";
	
	if (state_frame < 40) word = "READY";
	else if (state_frame < 80) word = "SET";
	else word = "GO!!";
	
	info.innerHTML = "<p style=\"color: " + getTileColor(player_num) + "; position: absolute; width: " + width + "px; left:" +
		pleft + "; top:" + ptop + "; text-align: center; font-size: " + (tile_size * 1.5) + "pt;\">" + word + "</p>";
}

function draw_rank() {
	var pleft = (bw + (wmargin * 1.1)) + "px";
	var ptop = (hmargin + (bh * 0.2)) + "px";
	
	
	var r_color = "silver";
	// flash for special rank
	if (frame_game % 4 != 0) {
		switch (mode) {
		case DEMON: r_color = "red"; break;
		case TETRIS_P: if (ex_rank > 7) r_color = "gold"; break;
		// r_color = "#F00000"; break;
		default:
			switch (difficulty) {
				case NORMAL: if (rank >= 10) r_color = "gold"; break; // starting s1
				case HARD: if (rank >= 20) r_color = "gold"; break; // starting m1
			} break;
		}
	}
	if (max_rank(rank)) r_color = "gold";
	
	//info.style.fontSize = ((tile_size - 4) * 1.5) + "pt";
	info.innerHTML += "<p style= \"font-family: Share Tech Mono; color: silver; position: absolute; white-space:nowrap; left:" +
		pleft + "; top:" + ptop + ";\"><span style=\"font-size: " + Math.trunc(tile_size * 2) + "pt; color: " + r_color + ";\">" + get_rank() + "</span><br/>" +
		get_next_points_string() + "<br/>Score: " + score + "</p>";
}

function get_rank() {
	// blank rank, do not show rank
	if (rank == 0) return " ";
	
	// ranking for plus mode
	if (mode == DEMON || mode == DEMON_PRE) {
		switch (rank) {
		case 1: return "1";
		case 2: return "2";
		case 3: return "3";
		case 4: return "4";
		case 5: return "5";
		case 6: return "S";
		case 7: return "SA";
		case 8: return "SB";
		case 9: return "SC";
		case 10: return "SD";
		case 11: return "X";
		case 12: return "XA";
		case 13: return "XB";
		case 14: return "XC";
		case 15: return "XD";
		case 16: return "W";
		case 17: return "WA";
		case 18: return "WB";
		case 19: return "WC";
		case 20: return "WD";
		case 21: return "M";
		case 22: return "MA";
		case 23: return "MB";
		case 24: return "MC";
		case 25: return "MD";
		case 26: return "GM";
		case 27: return "DM";
		}
	}
	if (mode == TETRIS_P) {
		// m route
		if (ex_rank > 7) {
			if (rank == 14) return "M";
			if (rank == 24) return "PM";
			else if (rank > 14) return "M" + (rank - 14);
		}
		// normal route
		if (rank <= 9) return "P" + rank;
		return "S" + (rank - 9);
	}
	
	switch (difficulty) {
	case EASY:
		if (rank <= 9) return "E" + rank;
		else if (rank == 10) return "EM"; // easy master
		break;
	case HARD:
		if (rank < 10) return "H" + rank;
		else if (rank < 19) return "S" + (rank - 9);
		else if (rank == 19) return "M";
		else if (rank < 29) return "M" + (rank - 19);
		else if (rank >= 29) return "HM"; // hard master
		break;
	case INFINITE:
		return "I" + rank;
		break;
	default: // normal
		if (rank < 10) return "N" + rank;
		else if (rank < 19) return "S" + (rank - 9);
		else if (rank == 19) return "M";
		else if (rank >= 20) return "NM";
		break;
	}
	
	// ????
	return rank;
}

// recursive method to figure out how many rank points you need
function get_next_points(with_rank) {
	var next_points = 100;
	switch (mode) {
	case TETRIS_EX: return -1; // TODO:: rank for EX modes
	case DEMON: case DEMON_PRE: return -1;
	case TETRIS_P:
		switch (with_rank) {
		case 0: return 100;
		case 1: next_points = 200; break;
		case 2: case 3: case 4: case 5: next_points = 250; break;
		case 6: case 7: case 8: case 9: next_points = 300; break;
		case 10: case 11: case 12: case 13: case 14: next_points = 400; break;
		case 15: case 16: case 17: case 19: case 20: case 21: next_points = 500; break;
		case 22: next_points = 600; break;
		
		case 18: if (ex_rank < 8) return -1; // normal route escape clause
				else next_points = 500; break;
		case 23: return -2; // m route escape clause
		case 24: return -1; // m route escape clause
		default: next_points = 300; break;
		}
		break;
	default:
		switch (difficulty) {
		case EASY: // EHHH EZ MODO?? // needs 2.8k
			if (with_rank == 0) return 100;
			else if (with_rank < 3) next_points = 200;
			else if (with_rank == 3) next_points = 300;
			else if (with_rank == 9) return -2; // penultimate
			else if (with_rank == 10) return -1; // em
			else next_points = 400;
			break;
		case NORMAL: // no mal modo
			if (with_rank == 20) return -1; // max rank
			if (with_rank == 0) return 100;
			else if (with_rank < 3) next_points = 200; // n1-3
			else if (with_rank < 7) next_points = 300; // n1-3
			else if (with_rank < 10) next_points = 400; // n grades
			else if (with_rank >= 19) return -2; // n master
			else next_points = 500; // s grades
			break;
		case INFINITE: 
			if (with_rank == 0) return 100;
			next_points = (Math.trunc(with_rank / 10) + 2) * 100;
			break;
		case HARD:
			if (with_rank == 0) return 100;
			else if (with_rank < 10) next_points = 200;
			else if (with_rank < 19) next_points = 300;
			else if (with_rank < 28) next_points = 600; // m grades
			else if (with_rank == 28) return -2; // h master
			else if (with_rank == 29) return -1; // max rank
			break;
		} break;
	}
	
	if (with_rank <= 0) return 3; // panic exit clause
	return next_points + get_next_points(with_rank - 1);
}

function get_next_points_string() {
	if (rank == 0) return "";
	var next_points = get_next_points(rank);
	if (next_points == -2) return "Next Rank at: ??? pts"; // unknown
	if (next_points == -1) return ""; // undefined
	else return "Next Rank at: " + get_next_points(rank) + " pts";
}
	
// return the color to use when drawing board
function getTileColor(pno) {
	switch (pno) {
	case 1: return "#F00000"; // player 1 color
	case 2: return "#00F0F0"; // player 2 color
	case 3: return "#F0F000"; // player 3 color
	case 4: return "#C010F0"; // player 4 color
	case 5: return "#303030"; // player 5 color
	case 6: return "#00F000"; // player 6 color
	case 7: return "#F08000"; // player 7 color
	case 8: return "#F020C0"; // player 8 color
	case 9: return "#D04010"; // player 9 color
	case 10:return "#0000F0"; // player 10 color
	case 11:return "#E0E0C0"; // player 9 color 2
	}
	// default color, this should never show up
	return "#CCCCCC";
}
	
// return the color to use when drawing the 20g blur
function getBlurColor(pno) {
	switch (pno) {
	case 1: return "#F0000040"; // player 1 color
	case 2: return "#00F0F040"; // player 2 color
	case 3: return "#F0F00040"; // player 3 color
	case 4: return "#C010F040"; // player 4 color
	case 5: return "#30303040"; // player 5 color
	case 6: return "#00F00040"; // player 6 color
	case 7: return "#F0800040"; // player 7 color
	case 8: return "#F020C040"; // player 8 color
	case 9: return "#D0401040"; // player 9 color
	case 10:return "#0000F040"; // player 10 color
	case 11:return "#E0E0C040"; // player 9 color 2
	}
	// default color, this should never show up
	return "#CCCCCC";
}

function playercoord(curr) {
	if (mode < TETRIS_D) return 4;
	return (curr.player * 6 - 3);
}

// adds the flying sparks
function add_spinspark(curr, dir) {
	if (!draw_vfx) return;
	var blockx;
	var blocky;
	var j; // which block
	if (dir == 0) {
		dir = vfx_rng.next_int() % 2;
		if (dir == 0) dir = -1;
	}
	
	// first, determine how many spinsparks to generate. it is a random number between 2 and 7
	var sparkcount = vfx_rng.next_int() % 3 + 2;
	
	// recursively generate sparks
	for (let i = 0; i < sparkcount; ++i) {
		j = vfx_rng.next_int() % 4; // determine from which block to generate the spark
		
		// determines location
		blockx = wmargin + (curr.coll[j][0] * tile_size);
		blocky = hmargin - ((curr.coll[j][1] - board_height) * tile_size);
		// actual add
		spinsparks.push([blockx + (vfx_rng.next_int() % tile_size), blocky - (vfx_rng.next_int() % tile_size),
		((vfx_rng.next_int() % (tile_size * 2))/ 10 + tile_size * 0.15) * dir, (vfx_rng.next_int() % (tile_size * 2)) / -10 - tile_size * 0.15]);
	}
}

// adds a 20g blur to the canvas
function add_quickblur(x, y, x2, player) {
	// global x correction
	// x correction for o block
	if (x2 == 2) x += 1;
	
	// blur to add. it is an array of values.
	// 0 = x, 1 = y, 2 = w, 3 = h, 4 = c, 5 = l
	var blur = [x, y, x2, board_height, player, board_height - y];
	// add blur
	canvas_blur.push(blur);
}

// clears the canvas
function clear_canvas() {
	ctx.clearRect(0, 0, w, h);
	underlay_drawn = false;
}

function loadBG() {
	bg_no = 0;
	updateBG();
	let img = document.createElement('img');
	img.src = "bg/dbg20.png";
	img.onload = function () {
		document.getElementById("loadscreen").parentNode.removeChild(document.getElementById("loadscreen"));
	}
	return;
}

function updateBG() {
	let max_bg = 20;
	// laziest bg fix ever lmao
	if (bg_no > max_bg) bg_no = max_bg;
	/*if (!draw_bg) document.getElementById("bg").style.display = "none";
	else {
		document.getElementById("bg").style.display = "initial";
		if (mode == DEMON && bg_no >= 5) document.getElementById("bg").style.background = "#000000 url(" + bg_img[bg_no + 15].src + ")  no-repeat center top / contain; }";
		else {
			document.getElementById("bg").style.background = "url(" + bg_img[bg_no].src + ")  no-repeat center top / cover";
			//document.getElementById("bg").appendChild(bg_img[bg_no]);
		}
	}
	
	return;*/
	for (let no = 0; no <= max_bg; ++no) {
		document.getElementById("bg" + no).style.display = "none";
		document.getElementById("dbg" + no).style.display = "none";
	}
	if (draw_bg) {
		if (mode == DEMON && bg_no >= 5) document.getElementById("dbg" + (bg_no - 5)).style.display = "initial";
		else document.getElementById("bg" + bg_no).style.display = "initial";
	}
		
		
	//} else document.body.style.background = "";
}