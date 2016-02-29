'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin') {
        app.quit();
    }
});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        'width' : 300,
        'height' : 428,
        'icon' : './view/assets/images/app_icon.png',
        'titleBarStyle' : 'hidden-inset',
        'resizable' : false,
        'webPreferences' : {
            'webSecurity' : false,
            'defaultEncoding' : 'UTF-8'
        }
    });

    mainWindow.loadURL('file://' + __dirname + '/view/index.html');
    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function() {
        //mainWindow = null;
        app.quit();
    });

});
