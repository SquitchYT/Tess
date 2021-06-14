const time1 = new Date().getTime();

const { app, BrowserWindow, ipcMain : ipc, screen } = require('electron');
const argv = require("yargs").argv

const pty = require("node-pty");
const Child_Proc = require('child_process');
const { Worker } = require('worker_threads');

const fs = require('fs');
const mkdir = require('mkdirp')

const OsInfomations = require('./class/osinfo');
const osData = new OsInfomations();

//const sh = osData.os == "win32" ? "powershell.exe" : "bash";

let config, colors;
let workers = [];
let mainWindow;
let shells = [];


//Detect if workdir specified
let customWorkdir;
if (argv.workdir) {
    customWorkdir = argv.workdir
}


console.log("[WARNING] Tess is currently under development. You use an development release. You can have damage deal to your system")

!function LoadConfig() {
    try {
        file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", 'utf-8');
        config = JSON.parse(file);
    } catch (error) {
        let toWrite= '{"theme":"default","background": "full","cursorStyle": "block","transparency_value": 0.65,"image_blur":1,"imageLink":"","plugin":[],"shortcut":{"CTRL + T": "bash","CTRL + W": "Close","CTRL + C": "Copy","CTRL + V": "Paste","CTRL + P": "Config"}}'

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        mkdir.sync(osData.homeDir + "/.config/")

        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", toWrite);
        config = JSON.parse(toWrite)
    }

    if (config.background == "image" && config.imageLink.startsWith('./')) {
        config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf('.') + 1)
    }

    try {
        file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8");
        colors = JSON.parse(file);
    } catch (error) {
        let toWrite = '{"terminal":{"theme":{"foreground":"#979FAD","background":"#282C34","black":"#3c4045","red":"#ff5370","green":"#97f553","yellow":"#d19a66","blue":"#61aeef","magenta":"#c679dd","cyan":"#57b6c2","white":"#ABB2BF","brightBlack":"#59626f","brightRed":"#e06c75","brightGreen":"#c3e88d","brightYellow":"#e5c17c","brightBlue":"#61AEEF","brightMagenta":"#C679DD","brightCyan":"#56B6C2","brightWhite":"#abb2bf"}},"app":{"tab":{"panel":{"background":"#21252B"},"active":{"background":"#2F333D"},"inactive":{"background":"#21252B"},"text":{"color":"#979FAD","size":11.5}},"general":{"text_color":"#979FAD","foreground":"#2F333D","background":"#21252B","button_radius":20}}}'
        colors = JSON.parse(toWrite)
        
        mkdir.sync(osData.homeDir + "/Applications/tess/config/theme");
        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/theme/default.json", toWrite);
    }
}();


if (config.background == "transparent") {
    app.commandLine.appendSwitch('disable-gpu');
}

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
        transparent: config.background == "transparent",
        frame: needFrame,
        icon: "/usr/bin/Tess.png"
    });

    mainWindow.removeMenu();
    mainWindow.loadFile("src/page/app/index.html");
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
        }, 175);
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
        cwd:  (customWorkdir) ? customWorkdir : process.env.HOME,
        env: process.env,
    })
    customWorkdir = ""; //Reset Workdir

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
    if (config.background == "transparent") {
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

ipc.on("get-theme", (event) => {
    event.returnValue = colors;
})

ipc.on("get-config", (event) => {
    event.returnValue = config;
})

ipc.on("reload", () => {
    app.relaunch();
    //Child_Proc.exec("tess");
    app.exit();
})