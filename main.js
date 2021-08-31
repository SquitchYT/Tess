const time1 = new Date().getTime();

const electron = require("electron");
const argv = require("yargs").argv;

const pty = require("node-pty");
const Child_Proc = require("child_process");
const { Worker } = require("worker_threads");

const fs = require("fs");
const mkdir = require("mkdirp");

const Color = require("./class/color")

const OsInfomations = require("./class/osinfo");
const osData = new OsInfomations();

const { app, ipcMain : ipc, screen, dialog } = require("electron");

let BrowserWindow;

let config, colors;
let workers = [];
let mainWindow;
let shells = [];

//Modifier getting with args
let customWorkdir;
let customCommand;

if (argv.workdir || argv.cd) {
    customWorkdir = argv.workdir || argv.cd;
}
if (argv.command || argv.e) {
    customCommand = argv.command || argv.e;
}
console.log("\x1b[33m[WARNING]\x1b[0m Tess is currently under development. You use an development release. You can have damage deal to your system");

!function LoadConfig() {
    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", "utf-8");
        config = JSON.parse(file);
    } catch (error) {
        let toWrite= `{"theme":"default","background":"full","cursorStyle":"block","transparencyValue":"75","imageBlur":"3","imageLink":"","plugin":[],"shortcut":[{"id":1,"action":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","control":"CTRL + T"},{"id":2,"action":"Config","control":"CTRL + P"},{"id":3,"action":"Paste","control":"CTRL + V"},{"id":6,"action":"Copy","control":"CTRL + C"},{"id":12,"action":"Close","control":"CTRL + W"}],"profil":[{"id":1,"programm":"${osData.os == "win32" ? "powershell.exe" : "sh -c $SHELL"}","name":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","icon":"Default"}],"defaultProfil":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","terminalFontSize":"15"}`;

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        mkdir.sync(osData.homeDir + "/.config/");

        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", toWrite);
        config = JSON.parse(toWrite);
    }

    if (config.background == "image" && config.imageLink.startsWith("./")) {
        config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf(".") + 1);
    }

    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8");
        colors = JSON.parse(file);
    } catch (error) {
        let toWrite = "{ \"terminal\": { \"theme\": { \"foreground\": \"#979FAD\", \"background\": \"#282C34\", \"black\": \"#3c4045\", \"red\": \"#ff5370\", \"green\": \"#97f553\", \"yellow\": \"#d19a66\", \"blue\": \"#61aeef\", \"magenta\": \"#c679dd\", \"cyan\": \"#57b6c2\", \"white\": \"#ABB2BF\", \"brightBlack\": \"#59626f\", \"brightRed\": \"#e06c75\", \"brightGreen\": \"#c3e88d\", \"brightYellow\": \"#e5c17c\", \"brightBlue\": \"#61AEEF\", \"brightMagenta\": \"#C679DD\", \"brightCyan\": \"#56B6C2\", \"brightWhite\": \"#abb2bf\" } }, \"app\": { \"textColor\": \"#979FAD\", \"tabActive\": \"#2F333D\", \"tabInactive\": \"#21252B\" , \"topBar\": \"#21252B\", \"background\":\"#21252B\", \"secondaryBackground\": \"#2F333D\", \"backgroundHover\": \"#2D3339\", \"buttonRadius\": 20 } }";
        colors = JSON.parse(toWrite);
        
        mkdir.sync(osData.homeDir + "/Applications/tess/config/theme");
        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/theme/default.json", toWrite);
    }
}();

if (osData.os == "win32" && config.background != "transparent" && config.background != "image") {
    BrowserWindow = require("electron-acrylic-window").BrowserWindow
} else {
    BrowserWindow = require("glasstron").BrowserWindow;
}

if (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind") {
    app.commandLine.appendSwitch("disable-gpu");
}

!function LoadModules(){
    config.plugin.forEach((el) => {
        let worker = new Worker(osData.homeDir + "/Applications/tess/plugins/" + el + "/" + el + ".js");
        workers.push(worker);
    });

    workers.forEach((el) => {
        el.on("online", () => {
            console.log("\x1b[32m[SUCCESS]\x1b[0m " + "Module is Loaded !!");
        });
    
        el.on("message", (message) => {
            console.log("\x1b[32m[SUCCESS]\x1b[0m " + message);
        });
    });
}();

function openWindow(config, colors) {
    let color = new Color(colors.terminal.theme.background, config.transparencyValue);
    console.log("Hexa:", color.hexa);

    let needFrame = (osData.os == "win32") ? false : true;
    let needBlur = (config.background == "acrylic" || config.background == "blurbehind") ? true : false;
    let needTransparent = (config.background == "transparent" || needBlur) ? true : false;

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const appwidth = width - (width >> 2);
    const appheight = height - (height >> 2);
    const minwidth = Math.floor( (width - (width >> 1)) / 1.47 );
    const minheight = Math.floor( (height - (height >> 1)) / 1.4 );


    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        width: appwidth,
        height: appheight,
        minHeight: minheight,
        minWidth: minwidth,
        title: "Tess - Terminal",
        transparent: needTransparent,
        frame: needFrame,
        icon: "/usr/bin/Tess.png",
        blur: needBlur,
        blurType: config.background,
        blurGnomeSigma: 100,
        blurCornerRadius: 0,
        vibrancy: {
            theme: color.hexa,
            effect: config.background,
            useCustomWindowRefreshMethod: true,
            disableOnBlur: true
         }
    });

    mainWindow.removeMenu();
    mainWindow.loadFile("src/page/app/index.html");
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.on("resize",() =>{
        setTimeout(() => {
            try {
                mainWindow.webContents.send("resize");
            } catch (err) {
                console.log(err);
            }
        }, 100);
    });

    mainWindow.on("ready-to-show", () => {
        try {
            mainWindow.webContents.send("loaded", {
                config: config,
                colors: colors
            });
            mainWindow.webContents.send("app-reduced-expanded", BrowserWindow.getFocusedWindow().isMaximized());
        } catch (err) {
            console.log(err);
        }
    });
    //if (osData.os == "win32" && config.background == "acrylic" && mainWindow.getDWM().supportsAcrylic()) { fix_acrylic_window(mainWindow); }

    mainWindow.on("will-move", () => {
        //if (BrowserWindow.getFocusedWindow().isMaximized()) { BrowserWindow.getFocusedWindow().unmaximize() }
    })
}


ipc.on("new-term", (e, data) => {
    // Check if command exist
    let Command = (customCommand || data.shell).split(" ");
    let prog = Command[0];
    Command.shift();
    let args = Command;

    let shell = pty.spawn(prog, args, {
        name: "xterm-color",
        cols: data.cols,
        rows: data.rows,
        cwd:  (customWorkdir) ? customWorkdir : process.env.HOME,
        env: process.env,
    });
    customWorkdir = ""; // Reset Workdir
    customCommand = ""; // Reset Command
    
    shell.onExit(() => {
        try {
            mainWindow.webContents.send("close-tab", {
                index: data.index,
            });
            shell.kill();
        } catch (e) {
            console.log(e);
        } 
    });

    shell.onData((datas) => {
        try {
            mainWindow.webContents.send("pty-data", {
                index: data.index,
                data: datas,
                processName: shell.process
            });
        } catch (err) {
            console.log(err);
        }
    });

    let s = {
        index: data.index,
        shell: shell
    };

    shells.push(s);
});

ipc.on("terminal-data", (e, data) => {
    shells.forEach((el) => {
        if (el.index == data.index) {
            el.shell.write(data.data);
        } 
    });
});


// App events
app.on("ready", () => {
    let needTransparent = (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind") ? true : false;
    if (needTransparent && osData.os != "win32") {
        setTimeout(() => {
            openWindow(config, colors);
        }, 275);
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
        openWindow();
    }
});


ipc.on("close-terminal", (e, data) => {
    let y = 0;
    shells.forEach((el) => {
        if (el.index == data) {
            el.shell.kill();
            shells.splice(y, 1);
        }
        y++;
    });
});

ipc.on("close", () => {
    app.quit();
});

ipc.on("reduce", () => {
    BrowserWindow.getFocusedWindow().minimize();
});

ipc.on("reduce-expand", () => {
    BrowserWindow.getFocusedWindow().isMaximized() ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize();
    setTimeout(() => {
        BrowserWindow.getFocusedWindow().webContents.send("resize");
    }, 400);

    try {
        mainWindow.webContents.send("app-reduced-expanded", BrowserWindow.getFocusedWindow().isMaximized());
    } catch (err) {
        console.log(err);
    }
});

ipc.on("resize", (e, data) => {
    shells.forEach((el) => {
        try {
            el.shell.resize(data.cols, data.rows);   
        } catch (e) {
            console.log(e);
        }
    });
});

ipc.on("load-end", () => {
    let time2 = new Date().getTime();
    let time = time2 - time1;
    console.log("launch in :" + time + "ms");
});

ipc.on("get-theme", (event) => {
    event.returnValue = colors;
});

ipc.on("get-config", (event) => {
    event.returnValue = config;
});

ipc.on("reload", () => {
    if (osData.os == "win32") { 
        app.relaunch();
        app.exit();
        return;
    }
    Child_Proc.exec("tess");
    app.exit();
});

ipc.on("shortcut", (e, state) => {
    try {
        BrowserWindow.getFocusedWindow().webContents.send("shortcutStateUpdate", state);
    } catch (e) {
        console.log(e);
    }
});

ipc.on("reloadConfig", () => {
    reloadConfig();

    try {
        BrowserWindow.getFocusedWindow().webContents.send("newConfig", {config: config, color: colors});
    } catch (e) {
        console.log(e);
    }
});

function reloadConfig() {
    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", "utf-8");
        config = JSON.parse(file);
    } catch (_) {
        let toWrite = `{"theme":"default","background":"full","cursorStyle":"block","transparencyValue":"75","imageBlur":"3","imageLink":"","plugin":[],"shortcut":[{"id":1,"action":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","control":"CTRL + T"},{"id":2,"action":"Config","control":"CTRL + P"},{"id":3,"action":"Paste","control":"CTRL + V"},{"id":6,"action":"Copy","control":"CTRL + C"},{"id":12,"action":"Close","control":"CTRL + W"}],"profil":[{"id":1,"programm":"${osData.os == "win32" ? "powershell.exe" : "sh -c $SHELL"}","name":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","icon":"Default"}],"defaultProfil":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","terminalFontSize":"15"}`;

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        mkdir.sync(osData.homeDir + "/.config/");

        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", toWrite);
        config = JSON.parse(toWrite);
    }

    if (config.background == "image" && config.imageLink.startsWith("./")) {
        config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf(".") + 1);
    }

    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8");
        colors = JSON.parse(file);
    } catch (_) {
        let toWrite = "{ \"terminal\": { \"theme\": { \"foreground\": \"#979FAD\", \"background\": \"#282C34\", \"black\": \"#3c4045\", \"red\": \"#ff5370\", \"green\": \"#97f553\", \"yellow\": \"#d19a66\", \"blue\": \"#61aeef\", \"magenta\": \"#c679dd\", \"cyan\": \"#57b6c2\", \"white\": \"#ABB2BF\", \"brightBlack\": \"#59626f\", \"brightRed\": \"#e06c75\", \"brightGreen\": \"#c3e88d\", \"brightYellow\": \"#e5c17c\", \"brightBlue\": \"#61AEEF\", \"brightMagenta\": \"#C679DD\", \"brightCyan\": \"#56B6C2\", \"brightWhite\": \"#abb2bf\" } }, \"app\": { \"textColor\": \"#979FAD\", \"tabActive\": \"#2F333D\", \"tabInactive\": \"#21252B\" , \"topBar\": \"#21252B\", \"background\":\"#21252B\", \"secondaryBackground\": \"#2F333D\", \"backgroundHover\": \"#2D3339\", \"buttonRadius\": 20 } }";
        colors = JSON.parse(toWrite);
        
        mkdir.sync(osData.homeDir + "/Applications/tess/config/theme");
        fs.writeFileSync(osData.homeDir + "/Applications/tess/config/theme/default.json", toWrite);
    }
}

ipc.on("debug", (e, data) => {
    console.log(data);
});

ipc.on("openFileDialog", (e, data) => {
    let result = dialog.showOpenDialog(data);
    result.then((res) => {
        e.returnValue = res.filePaths[0];
    }).catch((err) => {
        console.log(err);
    });
});

function fix_acrylic_window(win, pollingRate = 60){
    win.on("will-move", (e) => {
        e.preventDefault();

        // Track if the user is moving the window
        if(win._moveTimeout)
            clearTimeout(win._moveTimeout);

        win._moveTimeout = setTimeout(
            () => {
                win._isMoving = false;
                clearInterval(win._moveInterval);
                win._moveInterval = null;
            }, 1000/pollingRate);

		// Start new behavior if not already
		if(!win._isMoving){
			win._isMoving = true;
			if(win._moveInterval)
				return false;

			// Get start positions
			win._moveLastUpdate = 0;
			win._moveStartBounds = win.getBounds();
			win._moveStartCursor = electron.screen.getCursorScreenPoint();

			// Poll at (refreshRate * 10) hz while moving window
			win._moveInterval = setInterval(() => {
				const now = Date.now();
				if(now >= win._moveLastUpdate + (1000/pollingRate)){
					win._moveLastUpdate = now;
					const cursor = electron.screen.getCursorScreenPoint();

					// Set new position
					win.setBounds({
						x: win._moveStartBounds.x + (cursor.x - win._moveStartCursor.x),
						y: win._moveStartBounds.y + (cursor.y - win._moveStartCursor.y),
						width: win._moveStartBounds.width,
						height: win._moveStartBounds.height
					});
				}
			}, 1000/(pollingRate * 10));
		}
	});

	// Replace window resizing behavior to fix mouse polling rate bug
	win.on("will-resize", (e) => {
        const now = Date.now();
        if(!win._resizeLastUpdate)
            win._resizeLastUpdate = 0;

        if(now >= win._resizeLastUpdate + (1000/40))
            win._resizeLastUpdate = now;
        else { e.preventDefault(); }

    });
}