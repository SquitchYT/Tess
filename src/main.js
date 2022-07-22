const time1 = new Date().getTime();

const yargs = require("yargs");
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
}).locale("en").parse(process.argv, (_, __, output) => {
    if (output) {
      output = output.replace(/\[.*?\]/g, '');
      console.log(output);
      process.exit()
    }
})

const pty = require("node-pty");
const Child_Proc = require("child_process");
const { Worker } = require("worker_threads");
const osData = new (require("./utils/osinfo"))();

const fs = require("fs");


fs.watch(osData.homeDir + "/Applications/tess/config/tess.config", (event, __) => {
    try {
        config = JSON.parse(fs.readFileSync(osData.homeDir + "/Applications/tess/config/tess.config", "utf-8"));

        if (config.background == "image" && config.imageLink.startsWith("./")) {
            config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf(".") + 1);
        }

        colors = JSON.parse(fs.readFileSync(osData.homeDir + "/Applications/tess/config/theme/" + config.theme + ".json", "utf-8"));

        config.experimentalProgressTracker = config?.experimentalProgressTracker.toString() ? config.experimentalProgressTracker.toString() == "true" : false;
        config.experimentalShowProcessUpdateIndicator = config?.experimentalShowProcessUpdateIndicator?.toString() ? config.experimentalShowProcessUpdateIndicator.toString() == "true" : false;

        colors.app.appBackground = colors?.app?.appBackground ? colors.app.appBackground : colors.terminal.theme.background;
        colors.app.primary = colors?.app?.primary ? colors.app.primary : colors.terminal.theme.blue;

        if (osData.os == "win32") {
            updateJumpMenu();
            if (useCustomTitleBarIntegration) {
                mainWindow.setTitleBarOverlay({
                    color: colors.app.topBar,
                    symbolColor: colors.app.textColor,
                    height: 30
                })
            }
        }

        mainWindow.webContents.send("newConfig", {config: config, color: colors});  
    } catch (_) {}
})


const mkdir = require("mkdirp");
const net = require("net");

const Color = require("./utils/color");

let useCustomTitleBarIntegration = false;

const { app, ipcMain : ipc, screen, dialog } = require("electron");
const path = require("path");

let getProcessTree;
if (osData.os == "win32") { getProcessTree = require("windows-process-tree").getProcessTree; }

let resizeTimeout;

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
            console.log(err);
        })
    }

    if (config.background == "image" && config.imageLink.startsWith("./")) {
        config.imageLink = osData.homeDir + "/Applications/tess/config" + config.imageLink.substring(config.imageLink.indexOf(".") + 1);
    }

    config.bufferSize = config?.bufferSize ? config.bufferSize : 4000;
    config.lineHeight = config?.lineHeight ? config.lineHeight : 1;
    config.experimentalProgressTracker = config?.experimentalProgressTracker?.toString() ? config.experimentalProgressTracker.toString() == "true" : false;
    config.experimentalShowCloseWarningPopup = config?.experimentalShowCloseWarningPopup?.toString() ? config.experimentalShowCloseWarningPopup.toString() == "true" : false;
    config.experimentalShowProcessUpdateIndicator = config?.experimentalShowProcessUpdateIndicator?.toString() ? config.experimentalShowProcessUpdateIndicator.toString() == "true" : false;
    config.experimentalPopupExclusionList = config?.experimentalPopupExclusionList ? config.experimentalPopupExclusionList : "fish, bash, zsh, powershell, cmd";
    config.experimentalCustomTitleBar = config?.experimentalCustomTitleBar?.toString() ? config.experimentalCustomTitleBar.toString() == "true" : false;

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
    colors.app.primary = colors?.app?.primary ? colors.app.primary : colors.terminal.theme.blue;
}();

if (osData.os == "win32") {
    updateJumpMenu();
}

let BrowserWindow;
let workers = [];
let mainWindow;
let shells = [];

let customWorkdir;
let customCommand;
let newTab;
let launchProfil;
let launchPage;

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
    launchProfil = argv["launch-profil"].toLowerCase();
}
if (argv["launch-page"]) {
    launchPage = argv["launch-page"].toLowerCase();
}
if (launchProfil) {
    let finded = false;
    config.profil.forEach((el) => {
        if (el.name.toLowerCase() == launchProfil) {
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

    let needBlur = (config.background == "acrylic" || config.background == "blurbehind");
    let needTransparent = (config.background == "transparent" || needBlur);
    let needFrame = !((config.experimentalCustomTitleBar && osData.supportCustomTitleBar) || (osData.os == "win32" && needTransparent));
    useCustomTitleBarIntegration = !needFrame

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
        titleBarStyle: !needFrame ? 'hidden' : false,
        titleBarOverlay: {
            color: colors.app.topBar,
            symbolColor: colors.app.textColor,
            height: 30
        },
        show: false
    });

    mainWindow.removeMenu();
    //mainWindow.openDevTools()
    mainWindow.loadFile("./src/ui/page/app/index.html");
    /*mainWindow.on("closed", () => {
        mainWindow = null;
    });*/
    mainWindow.on("resize",() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            try {
                mainWindow.webContents.send("resize");
                mainWindow.webContents.send("reduced-expanded", mainWindow.isMaximized());
            } catch {}
        }, 150);
    });

    let profilToLaunch;
    config.profil.forEach((el) => {
        if (el.name == config.defaultProfil) { profilToLaunch = el; }
    })

    let loadOptions = {
        page: launchPage,
        profil: (launchProfil) ? launchProfil : profilToLaunch,
        workdir: customWorkdir,
        customCommand: customCommand
    }

    mainWindow.on("ready-to-show", () => {
        try {
            mainWindow.webContents.send("loaded", {
                config: config,
                colors: colors,
                loadOptions: loadOptions
            });
        } catch { }
    });

    mainWindow.on("will-move", () => {
        if (BrowserWindow.getFocusedWindow().isMaximized()) { BrowserWindow.getFocusedWindow().unmaximize(); }
    })
}


ipc.on("new-term", (_, data) => {
    let command, prog, args;

    if (osData.os == "win32") {
        command = data.shell.split(".exe ");

        prog = command[0];
        prog += (command[0] != data.shell) ? ".exe" : "";

        if (prog.trim() == data.shell.trim()) { // No args provided
            args = [];
        } else {
            command.shift();
            args = command[0].split(" ");
        }
    } else {
        command = data.shell.split(" ");
        prog = command[0];
        command.shift();
        args = command;
    }
    prog = getProcessPath(osData.os != "win32" ? prog.trim() : path.basename(prog.trim()));

    if (prog == undefined && osData.os == "win32") { prog = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"; }
    else if (prog == undefined && osData != "win32") { prog = "sh"; args = ["-c", "$SHELL"]; }

    let workdir = data.workdir;
    let shell = pty.spawn(prog.trim(), args, {
        name: "xterm-256color",
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
        } catch { }

        if (osData.os == "win32") {
            !function updateTabName(pid) {
                getProcessTree(pid, (tree) => {
                    if (tree?.children) {
                        while(tree.children.length != 0) {
                            tree = tree.children[0]
                        }
                    }
                    try {
                        mainWindow.webContents.send("rename-tab", {
                            index: data.index,
                            name: tree.name,
                        });
                    } catch { }
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
        } catch { }
    }, 160);
});

ipc.on("terminal-data", (_, data) => {
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
        }();
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

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.exit();
    }
});

ipc.on("close-terminal", (_, data) => {
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
    if (!config.experimentalShowCloseWarningPopup) {
        mainWindow.close();
    } else {
        try {
            mainWindow.webContents.send("confirmClosingAll");
        } catch {}
    }
});
ipc.on("minimize", () => {
    BrowserWindow.getFocusedWindow().minimize();
});
ipc.on("reduce-expand", () => {
    BrowserWindow.getFocusedWindow().isMaximized() ? BrowserWindow.getFocusedWindow().unmaximize() : BrowserWindow.getFocusedWindow().maximize();
    setTimeout(() => {
        try {
            mainWindow.webContents.send("resize");
        } catch {}
    }, 300);
});

ipc.on("resize", (_, data) => {
    shells.forEach((el) => {
        try {
            el.shell.resize(data.cols, data.rows);   
        } catch (_) { }
    });
});

ipc.on("load-end", () => {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m Launched in ${new Date().getTime() - time1}ms`);
    mainWindow.show()
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
    } else {
        Child_Proc.exec("tess");
        mainWindow.close();
    }
});

ipc.on("shortcut", (_, state) => {
    try {
        BrowserWindow.getFocusedWindow().webContents.send("shortcutStateUpdate", state);
    } catch (_) { }
});

ipc.on("debug", (_, data) => {
    console.log("[DEBUG] " + data);
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
            items: [{
                type: "task",
                title: "Config Page",
                description: "Open config page on a new tab",
                program: process.execPath,
                args: "--newtab --launch-page=Config"
            }]
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
        } catch (_) { }
    } else {
        try {
            let result = Child_Proc.execSync(`which ${process}`, {stdio: "pipe"}).toString();
            return result
        } catch (_) { }
    }
    return undefined
}

ipc.on("focus", () => {
    mainWindow.show();
})

ipc.on("closeAll", () => {
    mainWindow.close()
})