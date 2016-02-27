window.miniPlayer = function () {

    'use strict';

    var playlist = [
            {
                'name' : 'Arrival to Earth',
                'artist' : 'Steve Jablonsky',
                'cover' : 'http://test.com/assets/images/other/1.jpeg',
                'src' : 'http://test.com/assets/songs/SteveJablonsky-ArrivaltoEarth.mp3'
            },
            {
                'name' : 'The Return Home',
                'artist' : 'Audio Machine',
                // 'cover' : 'http://test.com/assets/images/other/2.jpeg',
                'src' : 'http://test.com/assets/songs/AudioMachine-TheReturnHome.mp3'
            },
            {
                'name' : 'When It All Falls Down',
                'artist' : 'Audio Machine',
                'cover' : 'http://test.com/assets/images/other/3.jpeg',
                'src' : 'http://test.com/assets/songs/AudioMachine-WhenItAllFallsDown.mp3'
            },
            {
                'name' : 'Pacific Rim',
                'artist' : 'Ramin Djawadi',
                'cover' : 'http://test.com/assets/images/other/4.jpeg',
                'src' : 'http://test.com/assets/songs/RaminDjawadi-PacificRim.mp3'
            },
            {
                'name' : '闯将令',
                'artist' : '黄英华',
                'cover' : 'http://test.com/assets/images/other/5.jpeg',
                'src' : 'http://test.com/assets/songs/黄英华-闯将令.mp3'
            },
        ];

    var player = new Player(playlist);

    return player;

}();