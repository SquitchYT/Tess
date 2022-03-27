const Child_Proc = require("child_process");
const os = require("os");
const fs = require("fs");
const { ipcRenderer : ipc } = require("electron");
const { XMLParser } = require("fast-xml-parser");

class OsInfomations{
    constructor(){
        this._os = process.platform;
        this._wm = Child_Proc.execSync("echo $XDG_CURRENT_DESKTOP").toString().trim();
        this._homedir = os.homedir();
        this._theme_mode = undefined;
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

    get titleBarButtonOrder() {
        // c: Close
        // m: Expand / Minimize
        // r: Reduce (in taskbar)
        let buttonOrder = "rrrmrc"
        let temp = "";

        switch (this._wm) {
            case "X-Cinnamon":
                buttonOrder = ""
                temp = Child_Proc.execSync("gsettings get org.cinnamon.desktop.wm.preferences button-layout").toString().trim().replaceAll("'", "");
                temp = temp.split(":")
                temp[0].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "lc"
                            break;
                        case "maximize":
                            buttonOrder += "lm"
                            break;
                        case "minimize":
                            buttonOrder += "lr"
                            break;
                    }
                })
                temp[1].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "rc"
                            break;
                        case "maximize":
                            buttonOrder += "rm"
                            break;
                        case "minimize":
                            buttonOrder += "rr"
                            break;
                    }
                })
                break;
            case "KDE":
            case "Unity":
                buttonOrder = ""
                temp = Child_Proc.execSync("gsettings get org.gnome.desktop.wm.preferences button-layout").toString().trim().replaceAll("'", "");
                temp = temp.split(":")
                temp[0].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "lc"
                            break;
                        case "maximize":
                            buttonOrder += "lm"
                            break;
                        case "minimize":
                            buttonOrder += "lr"
                            break;
                    }
                })
                temp[1].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "rc"
                            break;
                        case "maximize":
                            buttonOrder += "rm"
                            break;
                        case "minimize":
                            buttonOrder += "rr"
                            break;
                    }
                })
                break;
            case "Budgie:GNOME":
                buttonOrder = ""
                temp = Child_Proc.execSync("gsettings get com.solus-project.budgie-wm button-layout").toString().trim().replaceAll("'", "");
                temp = temp.split(":")
                temp[0].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "lc"
                            break;
                        case "maximize":
                            buttonOrder += "lm"
                            break;
                        case "minimize":
                            buttonOrder += "lr"
                            break;
                    }
                })
                temp[1].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "rc"
                            break;
                        case "maximize":
                            buttonOrder += "rm"
                            break;
                        case "minimize":
                            buttonOrder += "rr"
                            break;
                    }
                })
                break;
            case "MATE":
                buttonOrder = ""
                temp = Child_Proc.execSync("gsettings get org.mate.Marco.general button-layout").toString().trim().replaceAll("'", "");
                console.log("MATTTTE", temp)
                temp = temp.split(":")
                temp[0].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "lc"
                            break;
                        case "maximize":
                            buttonOrder += "lm"
                            break;
                        case "minimize":
                            buttonOrder += "lr"
                            break;
                    }
                })
                temp[1].split(",").forEach((el) => {
                    switch (el) {
                        case "close":
                            buttonOrder += "rc"
                            break;
                        case "maximize":
                            buttonOrder += "rm"
                            break;
                        case "minimize":
                            buttonOrder += "rr"
                            break;
                    }
                })
                break;
        }

        return buttonOrder.match(/.{2}/g).reverse().join("")
    }

    get closeTitleBarButton() {
        let close_button = document.createElement('div');

        if (this._theme_mode == "breeze") {
            close_button.style.width = "18px";
            close_button.style.height = "18px";
            close_button.classList.add('close-button-KDE', "icon-KDE");
        } else if (this._theme_mode == "metacity") {
            for (const [state_mode, value] of Object.entries(this.titlebar_buttons["close"])) {
                value.forEach((el, index) => {
                    let new_layer = document.createElement("div");
                    new_layer.style.width = "100%";
                    new_layer.style.height = "100%";
                    new_layer.style.position = "absolute";
                    new_layer.style.order = index;
                    new_layer.style.display = "flex";
                    new_layer.style.justifyContent = "center";
                    new_layer.style.alignItems = "center";
                    new_layer.classList.add("cinnamon-close-" + state_mode)

                    if (el.filename.endsWith(".svg")) {
                        let svg_text = fs.readFileSync(el.filename).toString();

                        if (el.colorize) {
                            let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                            svg_text = svg_text.replaceAll(regex, el.colorize);
                        }

                        new_layer.innerHTML = svg_text;
                    } else {
                        new_layer.style.background = "url('" + el.filename + "')";
                        new_layer.style.backgroundSize = "cover";
                    }

                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    close_button.appendChild(new_layer)
                })
            }

            if (this.wm == "Unity") {
                close_button.style.height = "22px";
                close_button.style.width = "22px";
            } else {
                close_button.style.height = "18px";
                close_button.style.width = "18px";
            }

            close_button.style.position = "relative";
            close_button.style.marginLeft = "10px";
            close_button.classList.add("close-cinnamon")
        } else {
            close_button.style.width = "22px";
            close_button.style.height = "22px";
            close_button.classList.add('close-button-adwaita', "icon-adwaita");
        }

        close_button.addEventListener("click", () => {
            ipc.send("close");
        })
        
        return close_button;
    }

    get expandTitleBarButton() {
        let expand_reduce_button = document.createElement("div");

        if (this._theme_mode == "breeze") {
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
        } else if (this._theme_mode == "metacity") {
            for (const [state_mode, value] of Object.entries(this.titlebar_buttons["maximize"])) {
                value.forEach((el, index) => {
                    let new_layer = document.createElement("div");
                    new_layer.style.width = "100%";
                    new_layer.style.height = "100%";
                    new_layer.style.position = "absolute";
                    new_layer.style.order = index;
                    new_layer.style.display = "flex";
                    new_layer.style.justifyContent = "center";
                    new_layer.style.alignItems = "center";
                    new_layer.classList.add("cinnamon-maximize-" + state_mode)

                    if (el.filename.endsWith(".svg")) {
                        let svg_text = fs.readFileSync(el.filename).toString();

                        if (el.colorize) {
                            let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                            svg_text = svg_text.replaceAll(regex, el.colorize);
                        }

                        new_layer.innerHTML = svg_text;
                    } else {
                        new_layer.style.background = "url('" + el.filename + "')";
                        new_layer.style.backgroundSize = "cover";
                    }

                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    expand_reduce_button.appendChild(new_layer)
                })
            }

            if (this.wm == "Unity") {
                expand_reduce_button.style.height = "22px";
                expand_reduce_button.style.width = "22px";
            } else {
                expand_reduce_button.style.height = "18px";
                expand_reduce_button.style.width = "18px";
            }

            expand_reduce_button.style.position = "relative";
            expand_reduce_button.style.marginLeft = "10px";
            expand_reduce_button.classList.add("maximize-cinnamon")

            expand_reduce_button.addEventListener("click", () => {
                ipc.send("reduce-expand");
                ipc.on("reduced-expanded", (_, maximized) => {
                    expand_reduce_button.innerHTML = "";
                    
                    for (const [state_mode, value] of Object.entries(this.titlebar_buttons[(!maximized ? "maximize" : "unmaximize")])) {
                        value.forEach((el, index) => {
                            let new_layer = document.createElement("div");
                            new_layer.style.width = "100%";
                            new_layer.style.height = "100%";
                            new_layer.style.position = "absolute";
                            new_layer.style.order = index;
                            new_layer.style.display = "flex";
                            new_layer.style.justifyContent = "center";
                            new_layer.style.alignItems = "center";
                            new_layer.classList.add("cinnamon-maximize-" + state_mode)
        
                            if (el.filename.endsWith(".svg")) {
                                let svg_text = fs.readFileSync(el.filename).toString();
        
                                if (el.colorize) {
                                    let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                                    svg_text = svg_text.replaceAll(regex, el.colorize);
        
                                }
                                new_layer.innerHTML = svg_text;
                            } else {
                                new_layer.style.background = "url('" + el.filename + "')";
                                new_layer.style.backgroundSize = "cover";
                            }

                            if (el.shade) {
                                new_layer.style.filter = "brightness(" + el.shade + ")"
                            }
        
                            expand_reduce_button.appendChild(new_layer)
                        })
                    }
                })
            })
        } else {
            expand_reduce_button.style.width = "22px";
            expand_reduce_button.style.height = "22px";
            expand_reduce_button.classList.add("expand-button-adwaita", "icon-adwaita");

            expand_reduce_button.addEventListener("click", () => {
                ipc.send("reduce-expand");
                ipc.on("reduced-expanded", (_, maximized) => {
                    if (maximized) {
                        expand_reduce_button.classList.remove("expand-button-adwaita")
                        expand_reduce_button.classList.add("reduce-button-adwaita")
                    } else {
                        expand_reduce_button.classList.add("expand-button-adwaita")
                        expand_reduce_button.classList.remove("reduce-button-adwaita")
                    }
                })
            })
        }

        return expand_reduce_button
    }

    get minimizeTitleBarButton() {
        let minimize_button = document.createElement("div");

        if (this._theme_mode == "breeze") {
            minimize_button.style.width = "18px";
            minimize_button.style.height = "18px";
            minimize_button.classList.add("minimize-button-KDE", "icon-KDE");
        } else if (this._theme_mode == "metacity") {
            for (const [state_mode, value] of Object.entries(this.titlebar_buttons["minimize"])) {
                value.forEach((el, index) => {
                    let new_layer = document.createElement("div");
                    new_layer.style.width = "100%";
                    new_layer.style.height = "100%";
                    new_layer.style.position = "absolute";
                    new_layer.style.order = index;
                    new_layer.style.display = "flex";
                    new_layer.style.justifyContent = "center";
                    new_layer.style.alignItems = "center";
                    new_layer.classList.add("cinnamon-minimize-" + state_mode)

                    if (el.filename.endsWith(".svg")) {
                        let svg_text = fs.readFileSync(el.filename).toString();

                        if (el.colorize) {
                            let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                            svg_text = svg_text.replaceAll(regex, el.colorize);
                        }                            
                        new_layer.innerHTML = svg_text;
                    } else {
                        new_layer.style.background = "url('" + el.filename + "')";
                        new_layer.style.backgroundSize = "cover";
                    }

                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    minimize_button.appendChild(new_layer)
                })
            }

            if (this.wm == "Unity") {
                minimize_button.style.height = "22px";
                minimize_button.style.width = "22px";
            } else {
                minimize_button.style.height = "18px";
                minimize_button.style.width = "18px";
            }

            minimize_button.style.position = "relative";
            minimize_button.style.marginLeft = "10px";
            minimize_button.classList.add("minimize-cinnamon");
        } else {
            minimize_button.style.width = "22px";
            minimize_button.style.height = "22px";
            minimize_button.classList.add("minimize-button-adwaita", "icon-adwaita");
        }

        minimize_button.addEventListener("click", () => {
            ipc.send("minimize");
        })

        return minimize_button;
    }

    get currentWindowTheme() {
        let currentTheme = undefined;

        switch (this._wm) {
            case "X-Cinnamon":
                currentTheme = Child_Proc.execSync("gsettings get org.cinnamon.desktop.wm.preferences theme").toString().trim().replaceAll("'", "");
                break;
            case "Budgie:GNOME":
            case "Unity":
                currentTheme = Child_Proc.execSync("gsettings get org.gnome.desktop.interface gtk-theme").toString().trim().replaceAll("'", "");
                break;
            case "MATE":
                currentTheme = Child_Proc.execSync("gsettings get org.mate.Marco.general theme").toString().trim().replaceAll("'", "");
                break;
        }

        return currentTheme
    }

    get supportCustomTitleBar() {
        let theme = this.currentWindowTheme;
        let supportCustomTitleBar = false;

        if (theme == undefined) { return; }

        try {
            let theme_location = undefined;
            let metacity_theme_file;

            try {
                metacity_theme_file = fs.readFileSync("/usr/share/themes/" + theme + "/metacity-1/metacity-theme-3.xml").toString();
                theme_location = "/usr/share/themes/" + theme + "/metacity-1/";
            } catch {
                metacity_theme_file = fs.readFileSync(this.homeDir + "/.themes/" + theme + "/metacity-1/metacity-theme-3.xml").toString();
                theme_location = this.homeDir + "/.themes/" + theme + "/metacity-1";
            }

            let metacity_theme = new XMLParser({ignoreAttributes: false, attributeNamePrefix : "@_"}).parse(metacity_theme_file)

            let titlebar_buttons = {
                close: {
                    normal: [],
                    prelight: [],
                    pressed: []
                },
                maximize: {
                    normal: [],
                    prelight: [],
                    pressed: []
                },
                minimize: {
                    normal: [],
                    prelight: [],
                    pressed: []
                },
                unmaximize: {
                    normal: [],
                    prelight: [],
                    pressed: []
                }
            }

            let windowMetacityName = this.getTestToDefine(metacity_theme)
            let name_to_find = [windowMetacityName[0] + "*close", windowMetacityName[0] + "*maximize", windowMetacityName[0] + "*minimize", windowMetacityName[1] + "*maximize"]

            name_to_find.forEach((current_name_to_find) => {
                metacity_theme.metacity_theme.frame_style.forEach((el) => {
                    if (el["@_name"] == current_name_to_find.split("*")[0].replaceAll("-", "_")) {
                        el.button.forEach((el) => {
                            let action_to_get = ["normal", "prelight", "pressed"]
                            if (el["@_function"] == current_name_to_find.split("*")[1] && action_to_get.includes(el["@_state"])) {
                                let current_icon_type = current_name_to_find.startsWith(windowMetacityName[0]) ? el["@_function"] : "unmaximize"
                                let current_icon_mode = el["@_state"]
                                metacity_theme.metacity_theme.draw_ops.forEach((draw_ops_el) => {
                                    if (draw_ops_el["@_name"] == el["@_draw_ops"]) {
                                        let images = draw_ops_el.image
            
                                        if (Array.isArray(images)) {
                                            images.forEach((el) => {
                                                let name_to_to_define = this.valueFromConstantMetacity(el["@_colorize"], metacity_theme)
                                                titlebar_buttons[current_icon_type][current_icon_mode].push({filename: theme_location + "/" +  el["@_filename"], colorize: name_to_to_define.color, shade: name_to_to_define.shade})
                                            })
                                        } else {
                                            let name_to_to_define = this.valueFromConstantMetacity(images["@_colorize"], metacity_theme)
                                            titlebar_buttons[current_icon_type][current_icon_mode].push({filename: theme_location + "/" +  images["@_filename"], colorize: name_to_to_define.color, shade: name_to_to_define.shade})
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
            })

            this.titlebar_buttons = titlebar_buttons;
            supportCustomTitleBar = true;
            this._theme_mode = "metacity"
        } catch {
            if (this._wm == "KDE") {
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
                this._theme_mode = "breeze"
            } else {
                supportCustomTitleBar = true;
                this._theme_mode = "adwaita"
            }
        } finally {
            return supportCustomTitleBar
        }
    }

    valueFromConstantMetacity(const_name, theme) {
        let value = undefined
        let shade = undefined
        theme.metacity_theme.constant.forEach((el) => {
            if (el["@_name"] == const_name) {
                if (el["@_value"].startsWith("#")) {
                    value = el["@_value"]
                } else if (el["@_value"].startsWith("gtk:custom")) {
                    let test = el["@_value"].split("gtk:custom(")[1].replaceAll(")", "");
                    let name_to_define_both_mm = this.getValueFromGTKConstant(test.split(",")[0])

                    value = name_to_define_both_mm ? name_to_define_both_mm : el["@_value"].split(",")[1].split(")")[0]
                } else if (el["@_value"].startsWith("shade/gtk:custom")) {
                    let test = el["@_value"].split("shade/gtk:custom(")[1].replaceAll(")", "");
                    let name_to_define_both_mm = this.getValueFromGTKConstant(test.split(",")[0])

                    value = name_to_define_both_mm ? name_to_define_both_mm : el["@_value"].split(",")[1].split(")")[0]
                    shade = el["@_value"].split(",")[1].split(")")[1].replace("/", "")
                }
            }
        })

        return {color: value, shade: shade}
    }

    getValueFromGTKConstant(const_name) {
        let gtk_theme = Child_Proc.execSync("gsettings get org.cinnamon.desktop.interface gtk-theme").toString().trim().replaceAll("'", "");
        let aa = undefined
        let value = undefined
        try {
            aa = fs.readFileSync("/usr/share/themes/" + gtk_theme + "/gtk-3.0/gtk-dark.css").toString()
        } catch {
            try {
                aa = fs.readFileSync("/usr/share/themes/" + gtk_theme + "/gtk-3.0/gtk.css").toString()
            } catch {
                try {
                    aa = fs.readFileSync(this.homeDir + "/.themes/" + gtk_theme + "/gtk-3.0/gtk-dark.css").toString()
                } catch {
                    try {
                        aa = fs.readFileSync(this.homeDir + "/.themes/" + gtk_theme + "/gtk-3.0/gtk.css").toString()
                    } catch {
                        return value
                    }
                }
            }
        }

        aa.split("\n").forEach((el) => {
            if (el.startsWith("@define-color")) {
                let line_const_name = el.split(" ")[1]
                if (line_const_name == const_name) {
                    value = el.split(" ")[2].replace(";", "")
                }
            }
        })

        return value
    }

    getTestToDefine(theme) {
        let normal_mode = undefined;
        let maximized_mode = undefined;
        theme.metacity_theme.window.forEach((el1) => {
            if (el1["@_type"] == "normal") {
                theme.metacity_theme.frame_style_set.forEach((el2) => {
                    if (el2["@_name"] == el1["@_style_set"]) {
                        el2.frame.forEach((el3) => {
                            if (["normal", "maximized"].includes(el3["@_state"]) && el3["@_focus"] == "yes") {
                                (el3["@_state"] == "normal") ? normal_mode = el3["@_style"] : maximized_mode = el3["@_style"]
                            }
                        })
                    }
                })
            }
        })

        return [normal_mode.replaceAll("_", "-"), maximized_mode.replaceAll("_", "-")]
    }
}


module.exports = OsInfomations;