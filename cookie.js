var cookie_allowSaving;

function loadCookies() {
	var cookie = document.cookie;
	var decodedCookie = decodeURIComponent(document.cookie);
	var cookieArray = decodedCookie.split(';');
	var cc;
	if (cookie.length == 0) return; // no cookies ):
	// now reading cooks
	cookie_allowSaving = false;
	for (let i = 0; i < cookieArray.length; ++i) {
		cc = cookieArray[i].split('=');
		
		if (cc[0].includes("bgm")) if (cc[1] == "0") toggle_music();
		if (cc[0].includes("sfx")) if (cc[1] == "0") toggle_sfx();
		if (cc[0].includes("grid")) if (cc[1] == "1") toggle_grid(); // off by default
		if (cc[0].includes("outline")) if (cc[1] == "0") toggle_outline();
		if (cc[0].includes("vfx")) if (cc[1] == "0") toggle_vfx();
		if (cc[0].includes("ghost")) if (cc[1] == "0") toggle_ghost();
		if (cc[0].includes("background")) if (cc[1] == "0") toggle_bg();
		if (cc[0].includes("underlay")) if (cc[1] == "0") toggle_underlay();
		if (cc[0].includes("autoresize")) if (cc[1] == "1") toggle_autoresize(); // off by default
		if (cc[0].includes("int_size")) change_tilesize(cc[1]);
		if (cc[0].includes("int_pcolor")) change_player(parseInt(cc[1]));
		if (cc[0].includes("t_sdrop")) if (cc[1] == "0") toggle_t_sdrop();
		if (cc[0].includes("t_hold")) if (cc[1] == "0") toggle_t_hold();
		if (cc[0].includes("t_ezpre")) if (cc[1] == "1") toggle_t_ezpre(); // off by default
		
		// sets the controls for playay
		if (cc[0].includes("p1_controls")) {
			cc = cc[1].split("|");
			setPlayerControls(0, cc);
		}
		if (cc[0].includes("p2_controls")) {
			cc = cc[1].split("|");
			setPlayerControls(1, cc);
		}
	}
	cookie_allowSaving = true;
	saveCookies();
}

function saveCookies() {
	if (!cookie_allowSaving) return;
	document.cookie="bgm=" + (play_bgm == true ? "1" : "0");
	document.cookie="sfx=" + (play_se ? "1" : "0");
	document.cookie="grid=" + (draw_grid ? "1" : "0");
	document.cookie="outline=" + (draw_outline ? "1" : "0");
	document.cookie="vfx=" + (draw_vfx ? "1" : "0");
	document.cookie="ghost=" + (draw_ghost ? "1" : "0");
	document.cookie="background=" + (draw_bg ? "1" : "0");
	document.cookie="underlay=" + (draw_underlay ? "1" : "0");
	document.cookie="autoresize=" + (autoresize ? "1" : "0");
	document.cookie="t_sdrop=" + (toggle_sdrop ? "1" : "0");
	document.cookie="t_hold=" + (toggle_hold ? "1" : "0");
	document.cookie="t_ezpre=" + (toggle_ezpre ? "1" : "0");
	if (typeof tile_size !== 'undefined') document.cookie="int_size=" + tile_size;
	if (typeof player_num !== 'undefined') document.cookie="int_pcolor=" + player_num;
	document.cookie="p1_controls=" + controlsToString(0);
	document.cookie="p2_controls=" + controlsToString(1);
}

function controlsToString(pno) {
	return key_up[pno] + "|" + key_down[pno] + "|" + key_left[pno] + "|" + key_right[pno] + 
			"|" + key_lrotate[pno] + "|" + key_rrotate[pno] + "|" + key_hold[pno];
}

function setPlayerControls(player, c_in) {
	key_up[player] = parseInt(c_in[0]);
	key_down[player] = parseInt(c_in[1]); 
	key_left[player] = parseInt(c_in[2]); 
	key_right[player] = parseInt(c_in[3]);
	key_lrotate[player] = parseInt(c_in[4]);
	key_rrotate[player] = parseInt(c_in[5]);
	key_hold[player] = parseInt(c_in[6]);
	reset_controls_div(0);
}