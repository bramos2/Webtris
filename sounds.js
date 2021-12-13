// se list
var se_block;
var se_clear;
var se_clearall;
var se_gamelose;
var se_gameover;
var se_gamewin;
var se_go;
var se_levelstop;
var se_levelup;
var se_lock;
var se_lockh;
var se_lockm;
var se_menuconfirm;
var se_menuselect;
var se_mes_cool;
var se_mes_excellent;
var se_mes_outstanding;
var se_prehold;
var se_prerotate;
var se_rankmax;
var se_rankup;
var se_ready;
var se_reset;
var se_rotate;
var se_rotateclick;
var se_rotatefail;

// bgm list
var bgm;

// bgm variables
var bgm_no; // number of bgm now playing
var bgm_lv;
var bgm_slv;
var bgm_timeout;
var fade_timeout;
var fading; // whether or not bgm is fading

// sound control variables
var play_se;
var play_bgm;

function init_audio() {
	// load sounds
	se_block = [new Audio("se/block1.mp3"),
				new Audio("se/block2.mp3"),
				new Audio("se/block3.mp3"),
				new Audio("se/block4.mp3"),
				new Audio("se/block5.mp3"),
				new Audio("se/block6.mp3"),
				new Audio("se/block7.mp3")
				];
	se_clear = [new Audio("se/clear.mp3"),
				new Audio("se/clear.mp3"),
				new Audio("se/clear.mp3"),
				new Audio("se/clear4.mp3"),
				];
	
	se_clearall = new Audio ("se/clearall.mp3");
	se_gamelose = new Audio ("se/gamelose.mp3");
	se_gameover = new Audio ("se/gameover.mp3");
	se_gamewin = new Audio ("se/gamewin.mp3");
	se_go = new Audio ("se/go.mp3");
	se_levelstop = new Audio("se/levelstop.mp3");
	se_levelup = new Audio("se/levelup.mp3");
	se_lock = new Audio("se/lock.mp3");
	se_lockm = new Audio("se/lockm.mp3");
	se_lockh = new Audio("se/lockh.mp3");
	se_menuconfirm = new Audio("se/menu_confirm.mp3");
	se_menuselect = new Audio("se/menu_select.mp3");
	se_mes_cool = new Audio("se/mes_cool.mp3");
	se_mes_excellent = new Audio("se/mes_wicked.mp3");
	se_mes_outstanding = new Audio("se/mes_outstanding.mp3");
	se_prehold = new Audio("se/prehold.mp3");
	se_prerotate = new Audio("se/prerotate.mp3");
	se_rankmax = new Audio("se/rankmax.mp3");
	se_rankup = new Audio("se/rankup.mp3");
	se_ready = new Audio("se/ready.mp3");
	se_reset = new Audio("se/reset.mp3");
	se_rotate = new Audio("se/rotate.mp3");
	se_rotateclick = new Audio("se/rotateclick.mp3");
	se_rotatefail = new Audio("se/rotatefail.mp3");
	
	// load bgm
	bgm = [];
	bgm[0] = new Audio("bgm/lv1.mp3");
	bgm[1] = new Audio("bgm/lv2.mp3");
	bgm[2] = new Audio("bgm/lv3.mp3");
	bgm[3] = new Audio("bgm/lv3m.mp3");
	bgm[4] = new Audio("bgm/lv4.mp3");
	bgm[5] = new Audio("bgm/lv4m.mp3");
	bgm[6] = new Audio("bgm/lv5.mp3");
	bgm[7] = new Audio("bgm/win.mp3");
	bgm[8] = new Audio("bgm/dlv1.mp3");
	bgm[9] = new Audio("bgm/dlv2.mp3");
	bgm[10] = new Audio("bgm/dlv3.mp3");
	bgm[11] = new Audio("bgm/dlv4.mp3");
	bgm[12] = new Audio("bgm/elv1.mp3");
	bgm[13] = new Audio("bgm/elv2.mp3");
	bgm[14] = new Audio("bgm/elv3.mp3");
	bgm[15] = new Audio("bgm/elv4.mp3");
	bgm[16] = new Audio("bgm/elv5.mp3");
	bgm[17] = new Audio("bgm/elv6.mp3");
	
	bgm_no = 0;
	bgm_lv = 0;
	bgm_slv = 0;
	
	// are we playing sound?
	play_se =  true;
	play_bgm = true;
	
	bgmTimeout = false;
	fadeTimeout = false;
}

function play(sound) {
	if (play_se) {
		if (typeof sound === 'undefined') return;
		
		if (sound instanceof Audio) {
			sound.currentTime = 0;
			sound.play();
		}
	}
}

function stop(sound) {
	if (typeof sound === 'undefined') return;
	
	if (sound instanceof Audio) {
		sound.currentTime = 0;
		sound.pause();
	}
}


function bgm_play(num){
	if (!play_bgm) {
		bgm_no = num;
		bgm[num].volume = 0; // volume fix
		return;
	}

	// run this if:
	// bgm passed is a valid bgm ID
		// the playing bgm isnt the same as the one asked for
		// OR the playing bgm isnt playing
	if (num >= 0 && (num != bgm_no || (bgm[bgm_no].paused))) {
		try {
			clear_timeouts();
			fading = false;
			
			// volume fix
			bgm[num].volume = 1;
			bgm[bgm_no].volume = 1;
			
			bgm[bgm_no].pause();
			bgm_no = num;
			
			if (num != 7) bgm[num].loop = true;
			bgm[num].currentTime = 0;
			bgm[num].play();
		} catch (err) {
			console.log(err);
		}
	}
}

function bgm_fade (num) {
	// exit clause for changed bgm
	if (bgm_no != num || bgm[num].volume == 0) return;
	if (!play_bgm) return;
	
	// actual fading
	bgm[num].volume -= 0.01;
	
	if (bgm[num].volume >= 0.01) {
		// continue to fade
		fadeTimeout = setTimeout(bgm_fade, 10, num);
	} else {
		// fading complete
		bgm[num].volume = 0;
		bgm[num].pause();
		clear_timeouts();
	}
}

function update_bgm (curr) {
	if (!play_bgm) return;
	if (fading) return;
	
	// bgm has already progressed
	if (curr.level < bgm_lv && curr.sublevel < bgm_slv) return;
	
	bgm_lv = curr.level;
	bgm_slv = curr.sublevel;
	
	// on these levels, bgm will fade
	if (mode == TETRIS_EX) {
		if (difficulty == 3) {
			switch (curr.level) {
			case 4: break;
			case 6: break;
			case 10: break;
			default: return;
			}
		} else {
			switch (curr.level) {
			case 3: break;
			case 7: break;
			case 11: break;
			default: return;
			}
		}
	} else if (mode == TETRIS_P) {
		switch (curr.level) {
		case 4: case 7: break;
		case 9: if (ex_rank == 9) return; break;
		case 10: break;
		case 15: break;
		default: return;
		}
	} else if (mode == DEMON || mode == DEMON_PRE) {
		if ((1 + curr.level) % 5 != 0) return;
		if (curr.sublevel < 75) { // do nothing
		} else {
			clearTimeout(fadeTimeout);
			bgm_fade(bgm_no);
			fading = true;
		}
	} else {
		switch (curr.level) {
		case 4: case 6: case 9: break;
		case 14: if ((mode == TETRIS && difficulty == HARD)) break; return; // bgm fade for hard mode
		default: return; // bgm is not fading ree
		}
	}
	
	if (curr.sublevel < 80) { // do nothing
	} else if (curr.sublevel == 80) {
		bgm[bgm_no].volume = 0.9;
	} else if (curr.sublevel < 90) {
		bgm[bgm_no].volume -= 0.05;
	} else {
		clearTimeout(fadeTimeout);
		bgm_fade(bgm_no);
		fading = true;
	}
}

function bgm_change(level) {
	if (mode == DEMON_PRE) return; // no bgm change
	var change_to;
	if (mode == TETRIS_EX) {
		if (difficulty == 3) {
			switch (level) {
			case 5: change_to = 15; break;
			case 7: change_to = 16; break;
			case 11: change_to = 17; break;
			}
		} else {
			switch (level) {
			case 4: change_to = 13; break;
			case 8: change_to = 14; break;
			case 12: change_to = 15; break;
			}
		}
	} else if (mode == TETRIS_P) {
		switch (level) {
		case 5: if (ex_rank == 5) change_to = 3; else change_to = 2; break; // bgm change lv2->lv3
		case 8: if (ex_rank == 8) change_to = 5; else change_to = 4; break; // bgm change lv3->lv4
		case 11: change_to = 6; break; // bgm change lv4->lv5
		default: return;
		}
	} else if (mode == DEMON) {
		if (level % 5 == 0) change_to = Math.trunc(level / 5) + 7;
		else return;
	} else {
		switch (level) {
		case 5: change_to = 2; break; // bgm change lv2->lv3
		case 7: change_to = 4; break; // bgm change lv3->lv4
		case 10:change_to = 6; break; // bgm change lv4->lv5
		default: return;
		}
	}
	
	// don't change to an earlier bgm
	if (change_to <= bgm_no) return;
	
	// no lv3 bgm change for easy mode
	if (mode == TETRIS && difficulty == EASY && level == 3) return;
	
	bgm_play(change_to);
}

function clear_timeouts() {
	if (fadeTimeout != false) clearTimeout(fadeTimeout);
	fadeTimeout = false;
}