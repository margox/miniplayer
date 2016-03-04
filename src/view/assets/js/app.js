window.miniPlayer = function () {

    'use strict';

    var playlist = localStorage['__mini_player_list__'] ? JSON.parse(localStorage['__mini_player_list__']) : [];
    var player = new Player(playlist);
    var i = 0;
    player.vue.$on('playlistchanged', function(playlist) {
        localStorage['__mini_player_list__'] = JSON.stringify(playlist);
    });

    // TODO 将player模块分离出来，作为audio对象的扩展，扩展功能如下：
    // 1.支持列表
    // 2.播放模式

}();