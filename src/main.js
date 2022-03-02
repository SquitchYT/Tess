const time1 = new Date().getTime();

const yargs = require("yargs")
const argv = yargs.options({
    "newtab": {
        describe: "Launch in a new tab"
    },
    "launch-profil": {
        describe: "Profil to launch"
    },
    "launch-page": {
        describe: "Page to launch"
    },
    "command": {
        alias: "e",
        describe: "Command to launch instead of profil"
    },
    "workdir": {
        alias: "cd",
        describe: "Default directory for the new tab"
    }
}).parse(process.argv, (_, __, output) => {
    if (output) {
      output = output.replace(/\[.*?\]/g, '');
      console.log(output);
      process.exit()
    }
})

const pty = require("node-pty");
const Child_Proc = require("child_process");
const { Worker } = require("worker_threads");

const fs = require("fs");
const mkdir = require("mkdirp");
const net = require("net");

const Color = require("./utils/color");

const OsInfomations = require("./utils/osinfo");
const osData = new OsInfomations();

const { app, ipcMain : ipc, screen, dialog } = require("electron");
const path = require("path");

let getProcessTree;
if (osData.os == "win32") { getProcessTree = require("windows-process-tree").getProcessTree; }

let resizeTimeout;

const customWMIntegration = ["KDE", "X-Cinnamon", "GNOME", "Budgie:GNOME"]; // Add other here

let config, colors;
!function LoadConfig() {
    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", "utf-8");
        config = JSON.parse(file);
    } catch (_) {
        let toWrite= `{"theme":"default","background":"full","cursorStyle":"block","transparencyValue":"75","imageBlur":"3","imageLink":"","plugin":[],"shortcut":[{"id":1,"action":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","control":"CTRL + T"},{"id":2,"action":"Config","control":"CTRL + P"},{"id":3,"action":"Paste","control":"CTRL + V"},{"id":6,"action":"Copy","control":"CTRL + C"},{"id":12,"action":"Close","control":"CTRL + W"}],"profil":[{"id":1,"programm":"${osData.os == "win32" ? "powershell.exe" : "sh -c $SHELL"}","name":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","icon":"Default"}],"defaultProfil":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","terminalFontSize":"15"}`;
        config = JSON.parse(toWrite);

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        fs.writeFile(osData.homeDir + "/Applications/tess/config/tess.config", toWrite, (err) => {
            console.log(err)
        })
    }

    if (config.background == "image" && config.imageLink.startsWith("./")) {
        config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf(".") + 1);
    }

    config.bufferSize = config?.bufferSize ? config.bufferSize : 4000

    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8");
        colors = JSON.parse(file);
    } catch (_) {
        let toWrite = "{ \"terminal\": { \"theme\": { \"foreground\": \"#979FAD\", \"background\": \"#282C34\", \"black\": \"#3c4045\", \"red\": \"#ff5370\", \"green\": \"#97f553\", \"yellow\": \"#d19a66\", \"blue\": \"#61aeef\", \"magenta\": \"#c679dd\", \"cyan\": \"#57b6c2\", \"white\": \"#ABB2BF\", \"brightBlack\": \"#59626f\", \"brightRed\": \"#e06c75\", \"brightGreen\": \"#c3e88d\", \"brightYellow\": \"#e5c17c\", \"brightBlue\": \"#61AEEF\", \"brightMagenta\": \"#C679DD\", \"brightCyan\": \"#56B6C2\", \"brightWhite\": \"#abb2bf\" } }, \"app\": { \"textColor\": \"#979FAD\", \"tabActive\": \"#2F333D\", \"tabInactive\": \"#21252B\" , \"topBar\": \"#21252B\", \"background\":\"#21252B\", \"secondaryBackground\": \"#2F333D\", \"backgroundHover\": \"#2D3339\", \"buttonRadius\": 20 } }";
        colors = JSON.parse(toWrite);
        
        mkdir.sync(osData.homeDir + "/Applications/tess/config/theme");
        fs.writeFile(osData.homeDir + "/Applications/tess/config/theme/default.json", toWrite, (err) => {
            console.log(err)
        });
    }

    colors.app.appBackground = colors?.app?.appBackground ? colors.app.appBackground : colors.terminal.theme.background;
}();

if (osData.os == "win32") {
    updateJumpMenu();
}

if (osData.wm == "win" || customWMIntegration.includes(osData.wm)) {
    console.log("custom Title Bar Integration is supported.")
}

let BrowserWindow;
let workers = [];
let mainWindow;
let shells = [];

//Modifier getting with args
let customWorkdir;
let customCommand;
let newTab;
let launchProfil;
let launchPage;

// Optimizing this !!!
if ((argv.workdir || argv.cd) || osData.os == "win32") {
    customWorkdir = (argv.workdir || argv.cd) || osData.homeDir;
}
if (argv.command || argv.e) {
    customCommand = argv.command || argv.e;
}
if (argv.newtab) {
    newTab = true;
}
if (argv["launch-profil"]) {
    launchProfil = argv["launch-profil"];
}
if (argv["launch-page"]) {
    launchPage = argv["launch-page"];
}
if (launchProfil) {
    let finded = false;
    config.profil.forEach((el) => {
        if (el.name == launchProfil) {
            launchProfil = el;
            finded = true;
        }
    })
    if (!finded) {
        launchProfil = undefined
    }
}

console.log("\x1b[33m[WARNING]\x1b[0m Tess is currently under development. You use a development release. You can have damage deal to your system.");

if (osData.os == "win32" && config.background != "transparent" && config.background != "image" && config.background != "full") {
    BrowserWindow = require("electron-acrylic-window").BrowserWindow
} else if (osData.os != "win32" && config.background != "transparent" && config.background != "image" && config.background != "full") {
    BrowserWindow = require("glasstron").BrowserWindow;
} else {
    BrowserWindow = require("electron").BrowserWindow
}

if (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind" && osData.os != "win32") {
    app.commandLine.appendSwitch("disable-gpu");

}

if (osData.os == "linux") { app.commandLine.appendSwitch("no-sandbox"); }

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
    let TCPServer = net.createServer((socket) => {
        socket.on("data", (data) => {
            try {
                mainWindow.webContents.send("openNewPage", data.toString());
            } catch (_) { }
        })
    })
    TCPServer.listen(osData.os == "win32" ? `\\\\?\\pipe\\tess-${process.pid}` : `/tmp/tess-${process.pid}.sock`);

    let bgColor = new Color(colors.terminal.theme.background, config.transparencyValue);

    let needFrame = !(osData.wm == "win" || osData.supportCustomTitleBar);
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
        icon: "/usr/share/pixmaps/tess.png",
        blur: needBlur,
        blurType: config.background,
        blurGnomeSigma: 100,
        blurCornerRadius: 0,
        backgroundColor: !needTransparent ? colors.terminal.theme.background : "#00ffffff",
        vibrancy: {
            theme: bgColor.hexa,
            effect: config.background,
            useCustomWindowRefreshMethod: true,
            disableOnBlur: (config.disableOnBlur != undefined ? config.disableOnBlur == "true" : true)
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: colors.app.topBar,
            symbolColor: colors.app.textColor
        },
        show: osData.os == "win32" ? false : true
    });

    mainWindow.removeMenu();
    mainWindow.loadFile("./src/ui/page/app/index.html");
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.on("resize",() =>{
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            try {
                mainWindow.webContents.send("resize");
            } catch (_) { }
        }, 150);
    });

    mainWindow.on("did-finish-load", () => {
        mainWindow.show();
    })

    let profilToLaunch;
    config.profil.forEach((el) => {
        if (el.name == config.defaultProfil) {
            profilToLaunch = el;
        }
    })

    let loadOptions = {
        page: launchPage,
        profil: (launchProfil) ? launchProfil : profilToLaunch,
        workdir: customWorkdir,
        customCommand: customCommand
    }

    if (osData.os == "win32") {
        app.on('browser-window-focus', () => {
            try {
                mainWindow.webContents.send("focus");
            } catch (_) { }
        })
        app.on('browser-window-blur', (e, win) => {
            if (!win.webContents.isDevToolsFocused()) {
                try {
                    mainWindow.webContents.send("unfocus");
                } catch (_) { }
            }
        })
    }

    mainWindow.on("ready-to-show", () => {
        try {
            mainWindow.webContents.send("loaded", {
                config: config,
                colors: colors,
                loadOptions: loadOptions

            });
            if (osData.os == "win32") { mainWindow.webContents.send("app-reduced-expanded", mainWindow.isMaximized()); }
        } catch (_) { }
    });

    mainWindow.on("will-move", () => {
        if (BrowserWindow.getFocusedWindow().isMaximized()) { BrowserWindow.getFocusedWindow().unmaximize() }
    })
}


ipc.on("new-term", (e, data) => {
    let Command, prog, args;

    if (osData.os == "win32") {
        Command = data.shell.split(".exe ")

        prog = Command[0]
        prog += (Command[0] != data.shell) ? ".exe" : ""

        if (prog.trim() == data.shell.trim()) { // No args provided
            args = []
        } else {
            Command.shift()
            args = Command[0].split(" ")
        }
    } else {
        Command = data.shell.split(" ");
        prog = Command[0]
        Command.shift()
        args = Command
    }
    
    prog = getProcessPath(osData.os != "win32" ? prog.trim() : path.basename(prog.trim()))

    if (prog == undefined && osData.os == "win32") { prog = getProcessPath("powershell.exe"); }
    else if (prog == undefined && osData != "win32") { prog = "sh"; args = ["-c", "$SHELL"]; }

    let workdir = data.workdir

    let shell = pty.spawn(prog.trim(), args, {
        name: "xterm-color",
        cols: data.cols,
        rows: data.rows,
        cwd:  (workdir) ? workdir : process.env.HOME,
        env: process.env
    });
    
    shell.onExit(() => {
        try {
            mainWindow.webContents.send("close-tab", {
                index: data.index,
            });
            if (osData.os != "win32") { shell.kill(); }
        } catch (_) { } 
    });

    shell.onData((datas) => {
        try {
            mainWindow.webContents.send("pty-data", {
                index: data.index,
                data: datas,
                processName: osData.os == "win32" ? "" : shell.process
            });
        } catch (_) { }

        if (osData.os == "win32") {
            !function updateTabName(pid) {
                getProcessTree(pid, (tree) => {
                    while(tree.children.length != 0) {
                        tree = tree.children[0]
                    }
    
                    try {
                        mainWindow.webContents.send("rename-tab", {
                            index: data.index,
                            name: tree.name,
                        });
                    } catch (_) { }
                })
            }(shell.pid);
        }
    });

    shells.push({
        index: data.index,
        shell: shell
    });

    setTimeout(() => {
        try {
            mainWindow.webContents.send("resize");
        } catch (_) { }
    }, 175);
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

    if (newTab) {
        !function connectToTessInstance(count=0) {
            let pid = getTessInstance(count)
            if (pid == 0) {
                if (needTransparent && osData.os != "win32") {
                    setTimeout(() => {
                        openWindow(config, colors);
                    }, 300);
                } else {
                    openWindow(config, colors);
                }
            } else {
                const client = net.createConnection({ path: osData.os == "win32" ? `\\\\?\\pipe\\tess-${pid}` : `/tmp/tess-${pid}.sock` }, () => {
                    let profilToLaunch;
                    config.profil.forEach((el) => {
                        if (el.name == config.defaultProfil) {
                            profilToLaunch = el
                        }
                    })
        
                    let loadOptions = {
                        page: launchPage,
                        profil: (launchProfil) ? launchProfil : profilToLaunch,
                        workdir: customWorkdir,
                        customCommand: customCommand
                    }
        
                    client.write(JSON.stringify(loadOptions));
                    process.exit();
                });
                
                client.on("error", (e) => {
                    client.end();
                    if (e["code"] == "ENOENT") {
                        connectToTessInstance(count + 1)
                    } else {
                        if (needTransparent && osData.os != "win32") {
                            setTimeout(() => {
                                openWindow(config, colors);
                            }, 300);
                        } else {
                            openWindow(config, colors);
                        }
                    }
                })
            }
        }(0);

        
    } else {
        if (needTransparent && osData.os != "win32") {
            setTimeout(() => {
                openWindow(config, colors);
            }, 300);
        } else {
            openWindow(config, colors);
        }
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
    if (mainWindow != undefined) {
        mainWindow.close();
    } else {
        app.quit();
    }
});

ipc.on("minimize", () => {
    BrowserWindow.getFocusedWindow().minimize();
});

ipc.on("reduce-expand", (e, _) => {
    let maximized = BrowserWindow.getFocusedWindow().isMaximized();
    maximized ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize();
    setTimeout(() => {
        BrowserWindow.getFocusedWindow().webContents.send("resize");
    }, 400);

    if (osData.os == "win32") {
        try {
            mainWindow.webContents.send("app-reduced-expanded", !maximized);
        } catch (_) { }
    }

    e.reply("reduced-expanded", !maximized)
});

ipc.on("resize", (_, data) => {
    shells.forEach((el) => {
        try {
            el.shell.resize(data.cols, data.rows);   
        } catch (_) { }
    });
});

ipc.on("load-end", () => {
    let time2 = new Date().getTime();
    let time = time2 - time1;
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Launched in ${time}ms`);
});

ipc.on("get-theme", (e) => {
    e.returnValue = colors;
});

ipc.on("get-config", (e) => {
    e.returnValue = config;
});

ipc.on("reload", () => {
    if (osData.os == "win32") { 
        app.relaunch();
        mainWindow.close();
        //app.exit();
    } else {
        Child_Proc.exec("tess");
        mainWindow.close();
    }
});

ipc.on("shortcut", (e, state) => {
    try {
        BrowserWindow.getFocusedWindow().webContents.send("shortcutStateUpdate", state);
    } catch (_) { }
});

ipc.on("reloadConfig", () => {
    reloadConfig();

    try {
        BrowserWindow.getFocusedWindow().webContents.send("newConfig", {config: config, color: colors});
    } catch (_) { }
});

function reloadConfig() {
    try {
        let file = fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", "utf-8");
        config = JSON.parse(file);
    } catch (_) {
        let toWrite = `{"theme":"default","background":"full","cursorStyle":"block","transparencyValue":"75","imageBlur":"3","imageLink":"","plugin":[],"shortcut":[{"id":1,"action":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","control":"CTRL + T"},{"id":2,"action":"Config","control":"CTRL + P"},{"id":3,"action":"Paste","control":"CTRL + V"},{"id":6,"action":"Copy","control":"CTRL + C"},{"id":12,"action":"Close","control":"CTRL + W"}],"profil":[{"id":1,"programm":"${osData.os == "win32" ? "powershell.exe" : "sh -c $SHELL"}","name":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","icon":"Default"}],"defaultProfil":"${osData.os == "win32" ? "Powershell" : "Default Shell"}","terminalFontSize":"15"}`;
        config = JSON.parse(toWrite);

        mkdir.sync(osData.homeDir + "/Applications/tess/config");
        fs.writeFile(osData.homeDir + "/Applications/tess/config/tess.config", toWrite, (err) => {
            console.log(err)
        });
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
        fs.writeFile(osData.homeDir + "/Applications/tess/config/theme/default.json", toWrite, (err) => {
            console.log(err)
        });
    }

    colors.app.appBackground = colors?.app?.appBackground ? colors.app.appBackground : colors.terminal.theme.background

    if (osData.os == "win32") {
        updateJumpMenu();
    }
}

ipc.on("debug", (_, data) => {
    console.log("DEBUG: " + data);
});

ipc.on("openFileDialog", (e, data) => {
    let result = dialog.showOpenDialog(data);
    result.then((res) => {
        e.returnValue = res.filePaths[0];
    }).catch((err) => {
        console.log(err);
    });
});

function getTessInstance(line_number=0) {
    try {
        if (osData.os != "win32") {
            let result = Child_Proc.execSync("ps -C tess").toString();
            let PIDLine = result.split("\n")

            if ((PIDLine.length - 1) <= line_number) {
                return 0;
            }
        
            let regex = /[0-9]+/i;
            return regex.exec(PIDLine[line_number+1])[0];
        } else {
            let result = Child_Proc.execSync('C:\\Windows\\System32\\tasklist.exe /FI "IMAGENAME eq tess.exe"').toString();
            let PIDLine = result.split("\n");

            if ((PIDLine.length - 3) <= line_number) {
                return 0;
            }
            
            let regex = /[0-9]+/i;
            return regex.exec(PIDLine[line_number + 3])[0];
        }
    } catch (_) {
        return 0;
    }
}

function updateJumpMenu () {
    app.setJumpList([
        {
            type: "tasks",
            items: [
                {
                    type: "task",
                    title: "New Tab",
                    description: "Open a new tab inside Tess",
                    program: process.execPath,
                    args: "--newtab"
                },
                {
                    type: "task",
                    title: "New Window",
                    description: "Open a new instance of Tess",
                    program: process.execPath
                }
            ]
        },
        {
            type: "custom",
            name: "Profils",
            items: getProfilJumpList()
        },
        {
            type: "custom",
            name: "Page",
            items: [
                {
                    type: "task",
                    title: "Config Page",
                    description: "Open config page on a new tab",
                    program: process.execPath,
                    args: "--newtab --launch-page=Config"
                }
            ]
        }
    ])
}

function getProfilJumpList () {
    let profilList = [];

    config.profil.forEach((el) => {
        let newInput = {
            type: "task",
            title: el.name,
            description: `Open profil ${el.name} on a new tab`,
            program: process.execPath,
            args: `--newtab --launch-profil="${el.name}"`
        }
        profilList.push(newInput);
    })

    return profilList;
}

function getProcessPath(process) {
    if (osData.os == "win32") {
        try {
            let result = Child_Proc.execSync(`C:\\Windows\\System32\\where.exe ${process}`, {stdio: "pipe"} ).toString();
            return(result.split("\n")[0])
        } catch (_) {
            return undefined
        }
    } else {
        try {
            let result = Child_Proc.execSync(`which ${process}`, {stdio: "pipe"}).toString();
            return result
        } catch (_) {
            return undefined
        }
    }
}

ipc.on("focus", () => {
    mainWindow.show();
})