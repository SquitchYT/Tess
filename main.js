const time1 = new Date().getTime();

const argv = require("yargs").argv;

const pty = require("node-pty");
const Child_Proc = require("child_process");
const { Worker } = require("worker_threads");

const fs = require("fs");
const mkdir = require("mkdirp");

const Color = require("./class/color");

const OsInfomations = require("./class/osinfo");
const osData = new OsInfomations();

const { app, ipcMain : ipc, screen, dialog } = require("electron");

let getProcessTree;

let resizeTimeout;

if (osData.os == "win32") { getProcessTree = require("windows-process-tree").getProcessTree; }
const net = require("net");

let config, colors;
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

if (osData.os == "win32") {
    updateJumpMenu();
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

if (osData.os == "win32" && config.background != "transparent" && config.background != "image") {
    BrowserWindow = require("electron-acrylic-window").BrowserWindow
} else {
    BrowserWindow = require("glasstron").BrowserWindow;
}

if (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind" && osData.os != "win32") {
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
    let TCPServer = net.createServer((socket) => {
        socket.on("data", (data) => {
            try {
                mainWindow.webContents.send("openNewPage", data.toString());
            } catch (e) {
                console.log(e);
            }
        })
    })
    TCPServer.listen(osData.os == "win32" ? `\\\\?\\pipe\\tess-${process.pid}` : `/tmp/tess-${process.pid}.sock`);

    let bgColor = new Color(colors.terminal.theme.background, config.transparencyValue);

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
        icon: "/usr/share/pixmaps/tess.png",
        blur: needBlur,
        blurType: config.background,
        blurGnomeSigma: 100,
        blurCornerRadius: 0,
        vibrancy: {
            theme: bgColor.hexa,
            effect: config.background,
            useCustomWindowRefreshMethod: true,
            disableOnBlur: (config.disableOnBlur != undefined ? config.disableOnBlur == "true" : true)
        }
    });

    mainWindow.removeMenu();
    mainWindow.loadFile("src/page/app/index.html");
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    mainWindow.on("resize",() =>{
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            try {
                mainWindow.webContents.send("resize");
            } catch (err) {
                console.log(err);
            }
        }, 200);
    });

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

    if (osData.os == "win32") {
        app.on('browser-window-focus', () => {
            try {
                mainWindow.webContents.send("focus");
            } catch (e) {
                console.log(e);
            }
        })
        app.on('browser-window-blur', (e, win) => {
            if (!win.webContents.isDevToolsFocused()) {
                try {
                    mainWindow.webContents.send("unfocus");
                } catch (e) {
                    console.log(e);
                }
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
        } catch (err) {
            console.log(err);
        }
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


        if (prog.trim() == data.shell.trim()) {
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

    prog = getProcessPath(prog.trim())

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
        } catch (e) {
            console.log(e);
        } 
    });

    shell.onData((datas) => {
        try {
            mainWindow.webContents.send("pty-data", {
                index: data.index,
                data: datas,
                processName: osData.os == "win32" ? "" : shell.process
            });
        } catch (err) {
            console.log(err);
        }

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
                    } catch (err) {
                        console.log(err);
                    }
                })
            }(shell.pid);
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

    if (newTab) {
        const client = net.createConnection({ path: osData.os == "win32" ? `\\\\?\\pipe\\tess-${getTessInstance()}` : `/tmp/tess-${getTessInstance()}.sock` }, () => {
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
            client.end()
    
            if (needTransparent && osData.os != "win32") {
                setTimeout(() => {
                    openWindow(config, colors);
                }, 300);
            } else {
                openWindow(config, colors);
            }


        })
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

    if (osData.os == "win32") {
        try {
            mainWindow.webContents.send("app-reduced-expanded", BrowserWindow.getFocusedWindow().isMaximized());
        } catch (err) {
            console.log(err);
        }
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
    console.log(`\x1b[32m[SUCCESS]\x1b[0m launch in: ${time}ms`);
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

    if (osData.os == "win32") {
        updateJumpMenu();
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

function getTessInstance() {
    try {
        if (osData.os != "win32") {
            let result = Child_Proc.execSync("ps -C tess").toString();
            let PIDLine = result.split("\n")
        
            let regex = /[0-9]+/i;
            return regex.exec(PIDLine[1])[0];
        } else {
            let result = Child_Proc.execSync('tasklist /FI "IMAGENAME eq tess.exe"').toString();
            let PIDLine = result.split("\n")
            
            let regex = /[0-9]+/i;
            return regex.exec(PIDLine[3])[0];
        }
    } catch {
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
            let result = Child_Proc.execSync(`where.exe ${process}`, {stdio: "pipe"} ).toString();
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