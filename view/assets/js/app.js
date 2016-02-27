window.miniPlayer = function () {

    'use strict';

    var playlist = localStorage['__mini_player_list__'] ? JSON.parse(localStorage['__mini_player_list__']) : [];
    var player = new Player(playlist);
    player.vue.$on('playlistchanged', function(list) {
        localStorage['__mini_player_list__'] = JSON.stringify(list);
    });

}();