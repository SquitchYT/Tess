const Child_Proc = require("child_process");
const os = require("os");

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
        /*Need to be DONE*/ 
    }

    get reduceTitleBarButton() {
        /*Need to be DONE*/ 
    }

    get expandTitleBarButton() {
        /*Need to be DONE*/ 
    }

    get minimizeTitleBarButton() {
        /*Need to be DONE*/ 
    }

    get titleBarButtonsWidth() {
        /*Need to be DONE*/ 

        return this.os == "win32" ? 0 : 150
    }

    get titleBarButtonWidth () {
        /*Need to be DONE*/ 
    }
}


module.exports = OsInfomations;