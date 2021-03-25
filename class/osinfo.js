const Child_Proc = require('child_process');
const os = require('os')

class OsInfomations{
    constructor(){
        this._os = process.platform;
        this._wm = Child_Proc.execSync('echo $XDG_CURRENT_DESKTOP').toString();
        this._homedir = os.homedir();
    };

    get os(){
        return this._os;
    };

    get wm(){
        if (this._os != "win32" && this._os != "macos") {
            return this._wm;
        } else {
            return 'win';
        };
    };

    get homeDir() {
        return this._homedir;
    }
};

module.exports = OsInfomations