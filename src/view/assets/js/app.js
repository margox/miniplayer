window.miniPlayer = function () {

    'use strict';

    var playlist = localStorage['__mini_player_list__'] ? JSON.parse(localStorage['__mini_player_list__']) : [];
    var player = new Player(playlist);
    var i = 0;
    player.vue.$on('playlistchanged', function(playlist) {
        localStorage['__mini_player_list__'] = JSON.stringify(playlist);
    });

}();