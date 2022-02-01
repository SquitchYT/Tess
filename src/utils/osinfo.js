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
        } else if (this._wm == "X-Cinnamon") {
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

                    let svg_text = fs.readFileSync(el.filename).toString();

                    if (el.colorize) {
                        let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                        svg_text = svg_text.replaceAll(regex, el.colorize);
                    }
                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    new_layer.innerHTML = svg_text;

                    close_button.appendChild(new_layer)
                })
            }

            close_button.style.height = "18px";
            close_button.style.width = "18px";
            close_button.style.position = "relative";
            close_button.style.marginLeft = "8px";
            close_button.classList.add("close-cinnamon")
        }

        close_button.addEventListener("click", () => {
            ipc.send("close");
        })
        
        return close_button;
    }

    get expandTitleBarButton() {
        let expand_reduce_button = document.createElement("div");

        if (this._wm == "KDE") {
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
        } else if (this._wm == "X-Cinnamon") {
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

                    let svg_text = fs.readFileSync(el.filename).toString();

                    if (el.colorize) {
                        let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                        svg_text = svg_text.replaceAll(regex, el.colorize);
                    }
                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    new_layer.innerHTML = svg_text;
                    expand_reduce_button.appendChild(new_layer)
                })
            }

            expand_reduce_button.style.height = "18px";
            expand_reduce_button.style.width = "18px";
            expand_reduce_button.style.position = "relative";
            expand_reduce_button.style.marginLeft = "8px";
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
        
                            let svg_text = fs.readFileSync(el.filename).toString();
        
                            if (el.colorize) {
                                console.log(el.colorize)
                                let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                                svg_text = svg_text.replaceAll(regex, el.colorize);
                            }
                            if (el.shade) {
                                new_layer.style.filter = "brightness(" + el.shade + ")"
                            }
        
                            new_layer.innerHTML = svg_text;
                            expand_reduce_button.appendChild(new_layer)
                        })
                    }
                })
            })
        }

        return expand_reduce_button
    }

    get minimizeTitleBarButton() {
        let minimize_button = document.createElement("div");

        if (this._wm == "KDE") {
            minimize_button.style.width = "18px";
            minimize_button.style.height = "18px";
            minimize_button.classList.add("minimize-button-KDE", "icon-KDE");
        } else if (this._wm == "X-Cinnamon") {
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

                    let svg_text = fs.readFileSync(el.filename).toString();

                    console.log(el)

                    if (el.colorize) {
                        let regex = /#(?:[a-f\d]{3}){1,2}\b/g
                        svg_text = svg_text.replaceAll(regex, el.colorize);
                    }
                    if (el.shade) {
                        new_layer.style.filter = "brightness(" + el.shade + ")"
                    }

                    new_layer.innerHTML = svg_text;

                    minimize_button.appendChild(new_layer)
                })
            }

            minimize_button.style.height = "18px";
            minimize_button.style.width = "18px";
            minimize_button.style.position = "relative";
            minimize_button.style.marginLeft = "8px";
            minimize_button.classList.add("minimize-cinnamon");
        }

        minimize_button.addEventListener("click", () => {
            ipc.send("minimize")
        })

        return minimize_button
    }

    get currentWindowTheme() {
        let currentTheme = undefined;

        switch (this._wm) {
            case "X-Cinnamon":
                currentTheme = Child_Proc.execSync("gsettings get org.cinnamon.desktop.wm.preferences theme").toString().trim().replaceAll("'", "");
        }

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
                case "X-Cinnamon":
                    let theme = this.currentWindowTheme;
                    
                    let theme_location = undefined;
                    let metacity_theme_file;

                    let name_to_find = ["normal-focused_close", "normal-focused_maximize", "normal-focused_minimize", "maximized-focused_maximize"]

                    try {
                        metacity_theme_file = fs.readFileSync("/usr/share/themes/" + theme + "/metacity-1/metacity-theme-3.xml").toString();
                        theme_location = "/usr/share/themes/" + theme + "/metacity-1/";
                    } catch {
                        try {
                            metacity_theme_file = fs.readFileSync("/home/clement/.themes/" + theme + "/metacity-1/metacity-theme-3.xml").toString();
                            theme_location = "/home/clement/.themes/" + theme + "/metacity-1";
                        } catch {}
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

                    name_to_find.forEach((current_name_to_find) => { //TODO get windows style_set key from windows correcpondoing to type=normal after get name of normal and maximized windows for get good icon
                        metacity_theme.metacity_theme.frame_style.forEach((el) => {
                            if (el["@_name"] == current_name_to_find.split("_")[0].replace("-", "_")) {
                                el.button.forEach((el) => {
                                    let action_to_get = ["normal", "prelight", "pressed"]
                                    if (el["@_function"] == current_name_to_find.split("_")[1] && action_to_get.includes(el["@_state"])) {
                                        let current_icon_type = !current_name_to_find.startsWith("maximized") ? el["@_function"] : "unmaximize"
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

                    this.titlebar_buttons = titlebar_buttons
                    supportCustomTitleBar = true
            }

        } catch (e) {
            console.log(e)
            supportCustomTitleBar = false;
        } finally {
            return supportCustomTitleBar
        }
    }

    valueFromConstantMetacity(const_name, theme) {
        let value = undefined
        let shade = undefined
        theme.metacity_theme.constant.forEach((el) => {
            if (el["@_name"] == const_name) {
                console.log(el["@_value"])
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

    getValueFromGTKConstant(const_name, theme_name) {
        //todo get corerct theme icon name
        let file_location = "/usr/share/themes/Mint-Y/gtk-3.0/gtk-dark.css"

        let value = undefined
        let aa = fs.readFileSync(file_location).toString();
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
}


module.exports = OsInfomations;