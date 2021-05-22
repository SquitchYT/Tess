const time1 = new Date().getTime();

const { app, BrowserWindow, ipcMain : ipc, screen } = require('electron');

const pty = require("node-pty");
const Child_Proc = require('child_process');
const { Worker } = require('worker_threads');

const fs = require('fs');
const mkdir = require('mkdirp')

const OsInfomations = require('./class/osinfo');
const osData = new OsInfomations();

const sh = osData.os == "win32" ? "powershell.exe" : "bash";

app.commandLine.appendSwitch('disable-gpu');

let config, colors;
let workers = [];
let mainWindow;
let shells = [];

!function LoadConfig() {
    try {
        file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", 'utf-8');
        config = JSON.parse(file);
    } catch (error) {
        config = {
            "theme": "tokyo-night",
            "terminal": {
                "cursor": "block"
            },
            "shortcut": {
                "CTRL + T": "bash",
                "CTRL + W": "Close",
                "CTRL + C": "Copy",
                "CTRL + V": "Paste"
            },
            "transparency": false,
            "transparency_value": 0.64,
            "image": false,
            "image_blur": 2,
            "plugin" : []
        }

        let toWrite = JSON.stringify(config);

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", toWrite);
    }

    if (config.image && config.image.startsWith('./')) {
        config.image = osData.homeDir + "/Applications/tess/config" + config.image.substring(config.image.indexOf('.') + 1)
    }

    try {
        file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8");
        colors = JSON.parse(file);
    } catch (error) {
        colors = {
            "terminal": {
                "theme": {
                    "foreground": "#9195c9",
                    "background": "#282d42"
                }
            },
            "app": {
                "tab_background": "#24283b",
                "tab_foreground": "#2f344d",
                "text_color": "#fff"
            }
        }

        let toWrite = JSON.stringify(colors);

        mkdir.sync(osData.homeDir + "/Applications/tess/config/theme");
        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", toWrite);
    }
}();


!function LoadModules(){
    config.plugin.forEach((el) => {
        let worker = new Worker(osData.homeDir + "/Applications/tess/plugins/" + el + "/" + el + ".js");
        workers.push(worker);
    });

    workers.forEach((el) => {
        el.on('online', () => {
            console.log('Module is Loaded !!');
        });
    
        el.on('message', (message) => {
            console.log(message);
        });
    })
}();

function openWindow(config, colors) {
    let needFrame = osData.wm == "win" || osData.wm == "macos" ? false : true;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const appwidth = width - (width >> 2);
    const appheight = height - (height >> 2);
    const minwidth = Math.floor( (width - (width >> 1)) / 1.47 );
    const minheight = Math.floor( (height - (height >> 1)) / 1.4 );


    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width: appwidth,
        height: appheight,
        minHeight: minheight,
        minWidth: minwidth,
        title: "Tess - Terminal",
        transparent: config.transparency,
        frame: needFrame
    });

    mainWindow.removeMenu();
    mainWindow.loadFile("src/index.html");
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    mainWindow.on('resize',() =>{
        setTimeout(() => {
            try {
                mainWindow.webContents.send('resize')
            } catch (err) {
                console.log(err);
            }
        }, 200);
    })

    mainWindow.on("ready-to-show", () => {
        try {
            mainWindow.webContents.send('loaded', {
                config: config,
                colors: colors
            })
        } catch (err) {
            console.log(err);
        }
    })
}


ipc.on('new-term', (e, data) => {
    // Add check if command exist (in the path)
    let Command = data.shell;

    let shell = pty.spawn(Command, [], {
        name: "xterm-color",
        cols: data.cols,
        rows: data.rows,
        cwd: process.env.HOME,
        env: process.env,
    })

    shell.onData((datas) => {
        try {
            mainWindow.webContents.send('pty-data', {
                index: data.index,
                data: datas
            });
        } catch (err) {
            console.log(err);
        }
    })

    let s = {
        index: data.index,
        shell: shell
    };

    shells.push(s);
})

ipc.on('terminal-data', (e, data) => {
    shells.forEach((el) => {
        if (el.index == data.index) {
            el.shell.write(data.data);
        } 
    })
})


// App events
app.on("ready", () => {
    if (config.transparency) {
        setTimeout(() => {
            openWindow(config, colors);
        }, 55);
    } else {
        openWindow(config, colors);
    }
});

app.on("window-all-closed", function() {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    if (mainWindow == null) {
        createWindow();
    }
});


ipc.on("close-terminal", (e, data) => {
    let y = 0
    shells.forEach((el) => {
        if (el.index == data) {
            el.shell.write('exit\r');
            el.shell.kill();
            shells.splice(y, 1);
        }
        y++;
    })
})

ipc.on('close', () => {
    app.quit();
})

ipc.on('reduce', () => {
    BrowserWindow.getFocusedWindow().minimize();
})

ipc.on('to-define-name', () => {
    BrowserWindow.getFocusedWindow().isMaximized() ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize();
    setTimeout(() => {
        BrowserWindow.getFocusedWindow().webContents.send('resize');
    }, 400);
})

ipc.on('resize', (e, data) => {
    shells.forEach((el) => {
        el.shell.resize(data.cols, data.rows);
    });
})

ipc.on("load-end", () => {
    time2 = new Date().getTime();
    time = time2 - time1;
    console.log("launch in :" + time + "ms");
})