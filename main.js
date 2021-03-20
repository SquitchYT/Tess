const time1 = new Date().getTime()

const { app, BrowserWindow, ipcMain : ipc, screen} = require('electron')

const pty = require("node-pty");
const Child_Proc = require('child_process');
const { Worker } = require('worker_threads');

const sh = process.platform == "win32" ? "powershell.exe" : "fish"

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

function openWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    const appwidth = width - (width >> 2)
    const appheight = height - (height >> 2)
    const minwidth = Math.floor( (width - (width >> 1)) / 1.47 )
    const minheight = Math.floor( (height - (height >> 1)) / 1.4 )

    mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        width : appwidth,
        height : appheight,
        minHeight : minheight,
        minWidth : minwidth,
        title : "Tess - Terminal",
        transparent : true,
        frame : true
    });

    //mainWindow.removeMenu()
    mainWindow.loadFile("src/index.html")
    mainWindow.on("closed", function() {
        mainWindow = null;
    });
    mainWindow.on('resize',() =>{
        try {
            mainWindow.webContents.send('resize')
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
        cols : data.cols,
        rows : data.rows,
        cwd: process.env.HOME,
        env: process.env,
    })

    shell.onData((datas) => {
        try {
            mainWindow.webContents.send('pty-data', {
                index : data.index,
                data : datas
            })
        } catch (err) {
            console.log(err)
        }
    })

    let s = {
        index : data.index,
        shell : shell
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
    setTimeout(() => {
        openWindow()
    }, 30);
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
    app.quit()
})

ipc.on('resize', (e, data) => {
    shells.forEach((el) => {
        el.shell.resize(data.cols, data.rows)
    })
})