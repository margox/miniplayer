window.Player = (function() {

    'use strict';

    if (!Array.prototype.findIndex) {

        Array.prototype.findIndex = function(predicate) {

            if (this === null) {
                throw new TypeError('Array.prototype.findIndex called on null or undefined');
            }

            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }

            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return i;
                }
            }

            return -1;

        }

    }

    function getRandom(min, max) {

        return Math.floor(min + Math.random() * (max - min));

    }

    function Player(playlist) {

        this.__guid = 1;
        this.__ready = false;
        this.__timmer = null;
        this.__element = document.querySelector('#player');
        this.__init(playlist);

        this.__remote = require('electron').remote;
        this.__dialog = this.__remote.require('dialog');

    }

    Player.prototype = {

        __init : function(playlist) {

            this.__initDate(playlist)
                .__initVue()
                .__initAudioObj()
                .__initEvents()
                .__ready = true;
            this.__element.classList.add('ready');
            return this;

        },

        __initDate : function(playlist) {

            this.data = {};
            this.data.playlist = (playlist instanceof Array) ? this.__buildPlayList(playlist) : [];
            this.data.config = localStorage['__mini_player_config__'] ? JSON.parse(localStorage['__mini_player_config__']) : {
                'volume' : 0.8,
                'muted' : false,
                'current' : 0,
                'mode' : 1
            };
            this.data.temp = {
                'name' : '',
                'artist' : '',
                'album' : '',
                'cover' : '',
                'playing' : false,
                'played' : 0,
                'buffered' : 0,
                'playedTime' : 0,
                'totalTime' : 0,
                'buffering' : false,
                'showlist' : false,
                'locked' : true
            };
            return this;

        },

        __initVue : function() {

            var __that = this;

            this.vue = new Vue({
                el : '#player',
                data : this.data,
                methods : {
                    toggleList: function() {
                        this.temp.showlist = !this.temp.showlist;
                    },
                    removeSong: function(id) {
                        var __index = this.playlist.findIndex(function(item) {
                            return item.id === id;
                        });
                        this.playlist.splice(__index, 1);
                        this.$emit('removeSong', __index);
                    },
                    playSong: function(id) {
                        if (id !== this.config.current) {
                            this.config.current = id;
                            this.$emit('changeIndex', this.config.current);
                            this.$emit('play');
                        }
                    },
                    jumpProgress: function(event) {
                        var elepos = event.target.getBoundingClientRect();
                        this.$emit('jumpProgress', (event.clientX - elepos.left) / elepos.width);
                    },
                    toggleMode: function() {
                        if (this.config.mode < 3) {
                            this.config.mode ++;
                        } else {
                            this.config.mode = 1;
                        }
                        this.$emit('changeMode', this.config.mode);
                    },
                    skipPrev: function() {
                        var __id = this.config.current;
                        var __index = this.playlist.findIndex(function(item) {
                            return item.id === __id;
                        });
                        if (this.config.mode === 2) {
                            __index = getRandom(0, this.playlist.length);
                        } else {
                            __index = __index === 0 ? this.playlist.length - 1 : __index - 1;
                        }
                        this.config.current = this.playlist[__index].id;
                        this.$emit('changeIndex', this.config.current);
                        this.$emit('play');
                    },
                    playPause: function() {
                        this.temp.playing = !this.temp.playing;
                        this.temp.playing ? this.$emit('play') : this.$emit('pause');
                    },
                    skipNext: function() {
                        var __id = this.config.current;
                        var __index = this.playlist.findIndex(function(item) {
                            return item.id === __id;
                        });
                        if (this.config.mode === 2) {
                            __index = getRandom(0, this.playlist.length);
                        } else {
                            __index = __index === this.playlist.length - 1 ? 0 : __index + 1;
                        }
                        this.config.current = this.playlist[__index].id;
                        this.$emit('changeIndex', this.config.current);
                        this.$emit('play');
                    },
                    playNext: function() {
                        var __id = this.config.current;
                        var __index = this.playlist.findIndex(function(item) {
                            return item.id === __id;
                        });
                        if (this.config.mode === 2) {
                            __index = getRandom(0, this.playlist.length);
                            this.config.current = this.playlist[__index].id;
                        } else if (this.config.mode === 1) {
                            __index = __index === this.playlist.length - 1 ? 0 : __index + 1;
                            this.config.current = this.playlist[__index].id;
                        }
                        this.$emit('changeIndex', this.config.current);
                        this.$emit('play');
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
                        this.config.volume = __volume / 1000000;
                        this.$emit('changeVolume', this.config.volume);
                    },
                    toggleMute: function() {
                        this.config.muted = !this.config.muted;
                        this.$emit('toggleMute', this.config.muted);
                    },
                    initMeta: function(meta) {
                        this.temp.name = meta.name;
                        this.temp.artist = meta.artist;
                        this.temp.cover = meta.cover;
                        this.temp.playedTime = 0;
                        this.temp.totalTime = meta.duration;
                        this.temp.buffered = meta.buffered;
                    },
                    updateMeta: function(meta) {
                        this.temp.playedTime = meta.currentTime;
                        this.temp.totalTime = meta.duration;
                        this.temp.buffered = meta.buffered;
                    },
                    lock: function() {
                        this.temp.locked = true;
                    },
                    unlock: function() {
                        this.temp.locked = false;
                    },

                    // advanced functions
                    selectLocalAudios: function() {
                        __that.__dialog.showOpenDialog({
                            'title' : '添加本地音乐文件',
                            'properties' : ['openFile', 'multiSelections'],
                            'filters' : [
                                {
                                    'name' : '音乐文件',
                                    'extensions' : ['mp3']
                                }
                            ]
                        }, function (data) {
                            __that.__getLocalAudios(data);
                        });
                    }
                }
            });
            this.vue.$watch('config', function() {
                localStorage['__mini_player_config__'] = JSON.stringify(this.config);
            },{deep: true});
            this.vue.$watch('playlist', function() {
                this.$emit('playlistchanged', this.playlist);
            });
            return this;

        },

        __initAudioObj : function() {
            this.audio = new Audio();
            this.audio.volume = this.data.config.volume;
            this.audio.muted = this.data.config.muted;
            this.audio.autobuffer = true;
            this.vudio = new Vudio(this.audio, document.querySelector('#waveform'), {
                waveform : {
                    maxHeight: 60,
                    width: 1,
                    color: [
                        [0, '#f00'],
                        [0.5, '#f00'],
                        [0.5, '#f90'],
                        [1, '#f90']
                    ],
                    shadowBlur: 20
                }
            });
            //this.vudio.dance()
            return this;
        },
        __initEvents : function() {
            var __that = this;

            // vue events
            this.vue
                .$on('changeIndex', function(index) {
                    var __id = index;
                    var __index = this.playlist.findIndex(function(item) {
                        return item.id === __id;
                    });
                    __that.audio.src = this.playlist[__index].src;
                    __that.audio.crossOrigin = "anonymous";
                    //__that.audio.play();
                })
                .$on('play', function() {
                    var __id = this.config.current;
                    var __index = this.playlist.findIndex(function(item) {
                        return item.id === __id;
                    });
                    if (this.playlist.length === 0 || __index > this.playlist.length - 1) {
                        return false;
                    }
                    if (__index === -1) {
                        __index = 0;
                        this.config.current = this.playlist[__index].id;
                    }
                    if (!__that.audio.src) {
                        __that.audio.src = this.playlist[__index].src;
                        __that.audio.crossOrigin = "anonymous";
                    }
                    this.temp.playing = true;
                    //clearTimeout(__that.__timmer);
                    __that.audio.play();
                    __that.vudio.dance();
                })
                .$on('pause', function() {
                    __that.audio.pause();
                    //__that.__timmer = setTimeout(function() {
                        __that.vudio.pause();
                    //}, 1000);
                })
                .$on('changeVolume', function(volume) {
                    __that.audio.volume = volume;
                })
                .$on('toggleMute', function(muted) {
                    __that.audio.muted = muted;
                })
                .$on('jumpProgress', function(progress) {
                    if (this.temp.totalTime) {
                        __that.audio.currentTime = this.temp.totalTime * progress;
                    }
                })
                .$on('ended', function(){
                    this.playNext();
                    this.initMeta({
                        name : '切换中',
                        artist : '请稍候',
                        cover : null,
                        duration: 0,
                        totalTime: 0,
                        buffered: []
                    });
                });

            // audio object events
            this.audio.addEventListener('loadedmetadata', function() {
                var __id = __that.data.config.current;
                var __index = __that.data.playlist.findIndex(function(item) {
                    return item.id === __id;
                });
                __that.vue.initMeta({
                    name : __that.vue.playlist[__index].name,
                    artist : __that.vue.playlist[__index].artist,
                    cover : __that.vue.playlist[__index].cover,
                    duration : __that.audio.duration,
                    buffered : __that.audio.buffered
                });
            });
            this.audio.addEventListener('canplay', function() {
                __that.vue.unlock();
            });
            this.audio.addEventListener('pause', function() {
                __that.vue.$emit('pause');
            });
            this.audio.addEventListener('timeupdate', function() {
                var __id = __that.data.config.current;
                var __index = __that.data.playlist.findIndex(function(item) {
                    return item.id === __id;
                });
                __that.vue.updateMeta({
                    name : __that.vue.playlist[__index].name,
                    artist : __that.vue.playlist[__index].artist,
                    cover : __that.vue.playlist[__index].cover,
                    currentTime : __that.audio.currentTime,
                    duration : __that.audio.duration,
                    buffered : __that.audio.buffered
                });
            });
            this.audio.addEventListener('ended', function() {
                __that.vue.$emit('ended');
            });
            this.audio.addEventListener('abort', function() {
                __that.vue.$emit('abort');
            });
            this.audio.addEventListener('error', function() {
                __that.vue.$emit('error', __that.audio.error);
                __that.vue.$emit('pause');
            });

            return this;
        },
        __buildPlayList : function(list) {
            var __result = [];
            var __that = this;
            list.forEach(function(item, index) {
                if (item.src) {
                    __result.push({
                        'id' : __that.__getGuid(),
                        'name' : item.name || '未知歌曲',
                        'artist' : item.artist || '未知艺术家',
                        'album' : item.album || '未知专辑',
                        'cover' : item.cover || null,
                        'trashed' : false,
                        'src' : item.src
                    });
                }
            });
            return __result;
        },
        __getAudioCover : function(image) {
            var base64String = "";
            if (!image) {
                return null;
            } else {
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
	            return "data:" + image.format + ";base64," + window.btoa(base64String);
            }
        },
        __getLocalAudios : function(pathArray) {

            var __index = 0;
            var __that = this;

            __getAudioMeta(__index);

            function __getAudioMeta(__index) {
                if (__index < pathArray.length) {
                    new jsmediatags.Reader(pathArray[__index])
                    .read({
                        onSuccess: function(tag) {
                            __that.addSongs({
                                'name' : tag.tags.title,
                                'album' : tag.tags.album,
                                'artist' : tag.tags.artist,
                                'cover' : __that.__getAudioCover(tag.tags.picture),
                                'src' : pathArray[__index]
                            });
                            __index ++;
                            __getAudioMeta(__index);
                        }
                    });
                }
            }

        },
        __getGuid : function() {
            this.__guid += 1;
            return this.__guid;
        },
        getData : function() {
            return this.data;
        },
        addSongs : function(songs) {
            var __that = this;
            var __tempList = [];
            if (Object.prototype.toString.call(songs) === '[object Array]') {
                __tempList = Array.from(__that.data.playlist);
                Array.prototype.push.apply(__tempList, __that.__buildPlayList(songs));
                __that.data.playlist = __tempList;
            } else if (Object.prototype.toString.call(songs) === '[object Object]') {
                __that.addSongs([songs]);
            }
        }

    }

    return Player;

})();