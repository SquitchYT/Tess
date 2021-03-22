const Child_Proc = require('child_process');

class OsInfomations{
    constructor(){
        this._os = process.platform;
        this._wm = Child_Proc.execSync('echo $XDG_CURRENT_DESKTOP').toString();
    };

    get os(){
        return this._os;
    };

    get wm(){
        if (this._os != "win32" && this._os != "macos") {
            return this._wm;
        } else {
            return 'win'
        }
    };
};

module.exports = OsInfomations