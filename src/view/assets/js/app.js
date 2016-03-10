~function () {

    'use strict';

    var playlist = localStorage['__mini_player_list__'] ? JSON.parse(localStorage['__mini_player_list__']) : [];
    Player.list(playlist).on('listchange', function(list) {
        localStorage['__mini_player_list__'] = JSON.stringify(list);
    });

}();
