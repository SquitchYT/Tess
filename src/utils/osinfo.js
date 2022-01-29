const Child_Proc = require("child_process");
const os = require("os");
const fs = require("fs");
const { ipcRenderer : ipc } = require("electron");

class OsInfomations{
    constructor(){
        this._os = process.platform;
        this._wm = Child_Proc.execSync("echo $XDG_CURRENT_DESKTOP").toString().trim();
        this._homedir = os.homedir();
    }

    get os(){
        return this._os;
    }

    get wm(){
        if (this._os != "win32" && this._os != "macos") {
            return this._wm;
        } else {
            return "win";
        }
    }

    get homeDir() {
        return this._homedir;
    }

    get closeTitleBarButton() {
        let close_button = document.createElement('div');

        if (this._wm == "KDE") {
            close_button.style.width = "18px";
            close_button.style.height = "18px";
            close_button.classList.add('close-button-KDE', "icon-KDE");

            close_button.addEventListener("click", () => {
                ipc.send("close");
            })
        } else {
            close_button.style.width = "18px";
            close_button.style.height = "18px";
            close_button.style.background = "#ff00ee"
        }
        
        return close_button;
    }

    get expandTitleBarButton() {
        let expand_reduce_button = document.createElement("div");
        expand_reduce_button.style.width = "20px";
        expand_reduce_button.style.height = "20px";
        expand_reduce_button.classList.add("expand-button-KDE", "icon-KDE");

        expand_reduce_button.addEventListener("click", () => {
            ipc.send("reduce-expand");
            ipc.on("reduced-expanded", (_, maximized) => {
                if (maximized) {
                    expand_reduce_button.classList.remove("expand-button-KDE")
                    expand_reduce_button.classList.add("reduce-button-KDE")
                } else {
                    expand_reduce_button.classList.add("expand-button-KDE")
                    expand_reduce_button.classList.remove("reduce-button-KDE")
                }
            })
        })

        return expand_reduce_button
    }

    get minimizeTitleBarButton() {
        let minimize_button = document.createElement("div");
        minimize_button.style.width = "18px";
        minimize_button.style.height = "18px";
        minimize_button.classList.add("minimize-button-KDE", "icon-KDE");

        minimize_button.addEventListener("click", () => {
            ipc.send("minimize")
        })

        return minimize_button
    }

    get currentWindowTheme() {
        let currentTheme = undefined;
        /*try { // For KDE, need to be fix later
            let data = fs.readFileSync("/home/clement/.config/kwinrc")
            let aa = data.toString().split("\n");
            let name_to_define_for_loop = false

            aa.forEach((el) => {
                if (el == "[org.kde.kdecoration2]") {
                    name_to_define_for_loop = true
                } else if (el.startsWith("[")) {
                    name_to_define_for_loop = false
                }

                if (name_to_define_for_loop && el.startsWith("theme=")) {
                    currentTheme = el.split("=")[1]
                }
            })
        } finally {
            return currentTheme
        }*/

        return currentTheme
    }

    get supportCustomTitleBar() {
        let supportCustomTitleBar = false;
        try {
            switch (this._wm) {
                case "KDE":
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximize-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximize-hover-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximize-active-symbolic.svg");
        
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximized-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximized-hover-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-maximized-active-symbolic.svg");
        
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-minimize-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-minimize-hover-symbolic.svg");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/breeze-minimize-active-symbolic.svg");
        
                    fs.readFileSync("/usr/share/themes/Breeze/assets/titlebutton-close-active@2.png");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/titlebutton-close-hover@2.png");
                    fs.readFileSync("/usr/share/themes/Breeze/assets/titlebutton-close@2.png");
                    supportCustomTitleBar = true;
            }

        } catch {
            supportCustomTitleBar = false;
        } finally {
            return supportCustomTitleBar
        }
    }
}


module.exports = OsInfomations;