window.Player = (function() {

    var default_config = {
        'volume' : 0.8,
        'muted' : false,
        'current' : 0,
        'mode' : 1,
        'dancing' : true
    };
    var config = localStorage['__mini_player_config__'] ? JSON.parse(localStorage['__mini_player_config__']) : {};

    // 初始数据
    var appData = {
        playlist : [],
        config : mergeOption(default_config, config),
        temp : {
            'ready' : true,
            'name' : '',
            'artist' : '',
            'cover' : '',
            'playing' : false,
            'currentTime' : '00:00',
            'duration' : '00:00',
            'progress' : 0,
            'showlist' : false
        }
    };

    // 页面元素
    var element = document.querySelector('#player');
    var waveformCanvas = document.querySelector('#waveform');

    // 初始化其他核心模块
    var xaudio = new XAudio();
    var vudio = new Vudio(xaudio[0], waveformCanvas, {
        width: 256,
        height: 50,
        accuracy: 128,
        waveform : {
            maxHeight: 40,
            color: ['rgba(255,255,255,.2)', 'rgba(255,255,255,0)'],
            verticalAlign: 'bottom'
        }
    });
    var remote = require('electron').remote;
    var dialog = remote.require('dialog');

    xaudio.mode(appData.config.mode)
         .volume(appData.config.volume)
         .muted(appData.config.muted);

    // 初始化vue
    var vue =  new Vue({
        el : element,
        data : appData,
        methods : {
            toggleList: function() {
                this.temp.showlist = !this.temp.showlist;
            },
            removeSong: function(index) {
                xaudio.remove(index);
            },
            playSong: function(index) {
                xaudio.play(index);
            },
            jumpProgress: function(event) {
                var elepos = event.target.getBoundingClientRect();
                xaudio.progress((event.clientX - elepos.left) / elepos.width * 100);
            },
            toggleMode: function() {
                if (this.config.mode < 3) {
                    this.config.mode ++;
                } else {
                    this.config.mode = 1;
                }
                xaudio.mode(this.config.mode);
            },
            skipPrev: function() {
                xaudio.prev();
            },
            skipNext: function() {
                xaudio.next();
            },
            playPause: function() {
                xaudio.toggle();
            },
            changeVolume: function(event){
                var __volume = this.config.volume * 1000000;
                if (event.deltaY < 0) {
                    __volume < 1000000 && (__volume += 50000);
                } else {
                    __volume > 0 && (__volume -= 50000);
                }
                __volume > 1000000 && (__volume = 1000000);
                __volume < 0 && (__volume = 0);
                xaudio.volume(__volume / 1000000);
            },
            toggleMute: function() {
                xaudio.muted(!this.config.muted);
            },
            toggleWaveform: function() {
                this.config.dancing = !this.config.dancing;
                this.config.dancing ? vudio.dance() : vudio.pause();
            },
            selectLocalAudios: function() {
                dialog.showOpenDialog({
                    'title' : '添加本地音乐文件',
                    'properties' : ['openFile', 'multiSelections'],
                    'filters' : [
                        {
                            'name' : '音乐文件',
                            'extensions' : ['mp3']
                        }
                    ]
                }, function (data) {
                    getLocalAudios(data);
                });
            }
        }
    });

    vue.$watch('config', function() {
        localStorage['__mini_player_config__'] = JSON.stringify(this.config);
    },{deep: true});

    xaudio.on({
        'listload' : function(list) {
            this.index(appData.config.current);
        },
        'listchange' : function(list) {
            appData.playlist = JSON.parse(JSON.stringify(list));
        },
        'play' : function() {
            appData.temp.playing = true;
        },
        'pause' : function() {
            appData.temp.playing = false;
        },
        'ended' : function() {
            appData.temp.playing = false;
        },
        'error' : function() {
            appData.temp.playing = false;
        },
        'indexchange' : function(index) {
            appData.playlist = JSON.parse(JSON.stringify(this.list()));
            appData.config.current = index;
        },
        'modechange' : function(mode) {
            appData.config.mode = mode;
        },
        'volumechange' : function(volume) {
            appData.config.volume = volume;
        },
        'muted' : function(muted) {
            appData.config.muted = muted;
        },
        'loadedmetadata' : function() {

            var currentSong = appData.playlist[appData.config.current];

            appData.temp.name = currentSong.name;
            appData.temp.artist = currentSong.artist;
            appData.temp.currentTime = xaudio.currentTime(true);
            appData.temp.duration = xaudio.duration(true);

            new jsmediatags.Reader(appData.playlist[appData.config.current].src).read({
                onSuccess: function(tag) {
                    appData.temp.cover = getAudioCover(tag.tags.picture);
                }
            });

        },
        'timeupdate' : function() {
            appData.temp.currentTime = this.currentTime(true);
            appData.temp.duration = this.duration(true);
            appData.temp.progress = this.progress();
        }
    });

    function getAudioCover(image) {

        var base64String = "";

        if (!image) {
            return null;
        } else {
            for (var i = 0; i < image.data.length; i++) {
                base64String += String.fromCharCode(image.data[i]);
            }
            return "data:" + image.format + ";base64," + window.btoa(base64String);
        }

    }

    function getLocalAudios(pathArray) {

        if (!(pathArray instanceof Array)) {
            return;
        }
        getAudioMeta(pathArray, 0);

    }

    function mergeOption() {

        var result = {}

        Array.prototype.forEach.call(arguments, function(argument) {

            var prop;
            var value;

            for (prop in argument) {
                if (Object.prototype.hasOwnProperty.call(argument, prop)) {
                    if (Object.prototype.toString.call(argument[prop]) === '[object Object]') {
                        result[prop] = mergeOption(result[prop], argument[prop]);
                    } else {
                        result[prop] = argument[prop];
                    }
                }
            }

        });

        return result;

    }

    function getAudioMeta(pathArray, index) {

        if (index < pathArray.length) {
            new jsmediatags.Reader(pathArray[index]).read({
                onSuccess: function(tag) {
                    xaudio.add({
                        'name' : tag.tags.title,
                        'album' : tag.tags.album,
                        'artist' : tag.tags.artist,
                        'src' : pathArray[index]
                    });
                    getAudioMeta(pathArray, index + 1);
                }
            });
        }

    }

    return xaudio;

})();