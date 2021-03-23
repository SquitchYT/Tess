const time1 = new Date().getTime()

const { app, BrowserWindow, ipcMain : ipc, screen, remote } = require('electron')

const pty = require("node-pty");
const Child_Proc = require('child_process');
const { Worker } = require('worker_threads');

const fs = require('fs')

const OsInfomations = require('./class/osinfo');
const osData = new OsInfomations()

const sh = osData.os == "win32" ? "powershell.exe" : "bash"

app.commandLine.appendSwitch('disable-gpu');


! function LoadModules(){
    const DiscordWorker = new Worker('./worker/discord-rpc.js')
    
    DiscordWorker.on('online', () => {
        console.log('Discord Module is Loaded !!')
    })

    DiscordWorker.on('message', (message) => {
        console.log(message)
    })

    // Add error and exit statement
}();


let mainWindow;
let shells = []

function openWindow(config, colors) {
    let needFrame = osData.wm == "win" || osData == "macos" ? false : true;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    const appwidth = width - (width >> 2)
    const appheight = height - (height >> 2)
    const minwidth = Math.floor( (width - (width >> 1)) / 1.47 )
    const minheight = Math.floor( (height - (height >> 1)) / 1.4 )

    console.log(osData.wm)

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

    //mainWindow.removeMenu()
    mainWindow.loadFile("src/index.html")
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    mainWindow.on('resize',() =>{
        setTimeout(() => {
            try {
                mainWindow.webContents.send('resize')
            } catch (err) {
                console.log(err)
            }
        }, 500);
    })

    mainWindow.on("ready-to-show", () => {
        try {
            mainWindow.webContents.send('loaded', {
                config: config,
                colors: colors
            })
        } catch (err) {
            console.log(err)
        }
    })


    ipc.on("load-end", (e, ea) => {
        time2 = new Date().getTime()
        time = time2 - time1
        console.log("launch in :" + time + "ms")
    })
}


ipc.on('new-term', (e, data) => {
    let Command = data.shell

    try {
        Child_Proc.execSync(data.shell)
    } catch (error) {
        Command = sh
    }

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
            })
        } catch (err) {
            console.log(err)
        }
    })

    let s = {
        index: data.index,
        shell: shell
    }

    shells.push(s)
})

ipc.on('terminal-data', (e, data) => {
    shells.forEach((el) => {
        if (el.index == data.index) {
            el.shell.write(data.data)
        } 
    })
})


// App events
app.on("ready", () => {

    let config;
    let colors;

    colors = {
        terminal: {
            theme: {
                foreground: "#fff",
                background: "#000",
            }
        },
        app: {
            tab_background: "#000",
            tab_foreground: "#aabbcc",
            text_color: "#fff"
        }
    }

    try {
        file = fs.readFileSync("config/tess.config", 'utf-8')
    } catch (error) {
        console.log(error);
    }

    config = JSON.parse(file)

    try {
        file = fs.readFileSync('config/theme/' + config.theme + '.json', 'utf-8')
    } catch (error) {
        console.log(error)
    }
    
    colors = JSON.parse(file)

    setTimeout(() => {
        openWindow(config, colors)
    }, 50);

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
            el.shell.write('exit\r')
            el.shell.kill()
            shells.splice(y, 1)
        }
        y++;
    })
})

ipc.on('close', (e,data) => {
    app.quit();
})

ipc.on('reduce', (e, data) => {
    BrowserWindow.getFocusedWindow().minimize();
    setTimeout(() => {
        BrowserWindow.getFocusedWindow().webContents.send('resize');
    }, 500);
})

ipc.on('to-define-name', () => {
    BrowserWindow.getFocusedWindow().isMaximized() ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize();
    setTimeout(() => {
        BrowserWindow.getFocusedWindow().webContents.send('resize');
    }, 500);
})

ipc.on('resize', (e, data) => {
    shells.forEach((el) => {
        el.shell.resize(data.cols, data.rows)
    })
})