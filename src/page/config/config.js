// eslint-disable-next-line no-global-assign
require = parent.require; // for get the good require function

const { ipcRenderer, shell } = require("electron");
const fs = require("fs");

const root = document.documentElement;

let colors = ipcRenderer.sendSync("get-theme");
let config = ipcRenderer.sendSync("get-config");

let currentProfilPage = 0;

const OsInfomations = require("../../../class/osinfo");
const osData = new OsInfomations();

const themeDropDownMenu = document.querySelector("drop-down-menu[parameters='theme']");
const profilDropDownMenu = document.querySelector("drop-down-menu[parameters='defaultProfil']");
const dropDownMenu = document.querySelectorAll("drop-down-menu");
const progressPicker = document.querySelectorAll("scroller-picker");
const switchButton = document.querySelectorAll("switch-button");
const filePickerEl = document.querySelectorAll("file-picker:not([type=\"profil-input\"])");
const inputs = document.querySelectorAll(".input-config");

const pluginSection = document.querySelector(".plugin");
const shortcutSection = document.querySelector(".shortcut");

const inputProfilName = document.querySelector(".profil-name");
const inputProfilCommand = document.querySelector(".profil-command");
const inputProfilIcon = document.querySelector(".profil-icon");
const inputProfilProcessName = document.querySelector(".profil-process-name");

const reloadRequireIcon = document.querySelector(".reload-require");
const leftSideMenuLink = document.querySelectorAll(".left-side-menu-link span");

/* NEW CONST FOR REWORK OF OPTIONS MENU*/
const menuIcon = document.getElementById("menu-icon");
const leftSideMenu = document.querySelector(".left-side-menu-items");
const pageCloseButton = document.querySelectorAll(".return-button");
const pages = document.querySelectorAll(".page");
const links = document.querySelectorAll(".link");

const noPluginMessage = document.querySelector(".no-plugin");

let shortcutList = [];

const shortcutAddBtn = document.querySelector(".shortcutAddButton");
const profilCreateBtn = document.querySelector(".profil-create");

ipcRenderer.on("config", (e, data) => {
    colors = data.color,
    setTheme();
});

ipcRenderer.on("newConfig", (e, data) => {
    config = data.config;
    colors = data.color;
    setTheme();
});

reloadRequireIcon.addEventListener("click", () => {
    ipcRenderer.send("reload");
});

leftSideMenuLink.forEach((el) => {
    el.addEventListener("click", () => {
        shell.openExternal(el.getAttribute("link"));
    });
});

let inputTimerName;
inputProfilName.addEventListener("input", () => {
    clearTimeout(inputTimerName);

    let newProfilList = "";
    config.profil.forEach((el) => {
        if (el.id == currentProfilPage) {
            el.name = inputProfilName.value;
            if (config.defaultProfil == inputProfilName.getAttribute("value")) {
                // update drop down menu for default profil
                config.defaultProfil = inputProfilName.value;
                profilDropDownMenu.setAttribute("selected-value", inputProfilName.value);
            }

            let name = document.querySelector("span[profil-id=\"" + currentProfilPage + "\"]");
            name.innerHTML = inputProfilName.value;

            config.shortcut.forEach((el) => {
                if (el.action == inputProfilName.getAttribute("value")) {
                    el.action = inputProfilName.value;
                }
            });

            loadShortcut();
            inputProfilName.setAttribute("value", inputProfilName.value);
        }
        newProfilList += el.name + ";";
    });
    profilDropDownMenu.setAttribute("input-list", newProfilList.substring(0, newProfilList.length - 1));

    inputTimerName = setTimeout(() => {
        saveUpdate();
    }, 450);
});

let inputCommandTimer;
inputProfilCommand.addEventListener("input", () => {
    clearTimeout(inputCommandTimer);

    config.profil.forEach((el) => {
        if (el.id == currentProfilPage) {
            el.programm = inputProfilCommand.value;
        }
    });

    inputCommandTimer = setTimeout(() => {
        saveUpdate();
    }, 450);
});
inputProfilIcon.addEventListener("update", () => {
    config.profil.forEach((el) => {
        if (el.id == currentProfilPage) {
            el.icon = inputProfilIcon.getAttribute("selected-value");
            saveUpdate();
        }
    });
});

inputProfilProcessName.addEventListener("click", () => {
    reloadRequireIcon.classList.remove("invisible");
    config.profil.forEach((el) => {
        if (el.id == currentProfilPage) {
            el.processName = inputProfilProcessName.getAttribute("state");
            saveUpdate();
        }
    });
})

function setTheme() {
    root.style.setProperty("--background", colors.app.appBackground);
    root.style.setProperty("--item-background", colors.app.background);
    root.style.setProperty("--item-background-hover", colors.app.backgroundHover);
    root.style.setProperty("--item-textcolor", colors.app.textColor);
    root.style.setProperty("--item-radius", colors.app.buttonRadius + "px");
    root.style.setProperty("--item-green", colors.terminal.theme?.green);
    root.style.setProperty("--item-red", colors.terminal.theme.red);
    root.style.setProperty("--item-yellow", colors.terminal.theme.yellow);
    root.style.setProperty("--app-background", colors.app.appBackground);
    root.style.setProperty("--app-dark-background", colors.app.secondaryBackground);
}

document.addEventListener("DOMContentLoaded", () => {
    let elements = document.querySelectorAll(".no-transition");
    setTimeout(() => {
        elements.forEach((el) => {
            el.classList.remove("no-transition");
        });
    }, 250);
});

/* NEW FUNCTION REWORK OPTIONS SCREEN*/
menuIcon.addEventListener("click", () => {
    leftSideMenu.parentNode.classList.toggle("menu-hidden");
    menuIcon.classList.toggle("menu-icon-close");
});

pageCloseButton.forEach((el) => {
    el.addEventListener("click", () => {
        el.parentNode.parentNode.classList.add("hidden-page");
        leftSideMenu.parentNode.classList.remove("menu-hidden");
        menuIcon.classList.remove("menu-icon-close");
    });
});

!function loadProfilOnMenu() {
    config.profil.forEach((el) => {
        let newProfilPage = document.createElement("div");
        newProfilPage.classList.add("profil-page");
        newProfilPage.setAttribute("link", "profil-page");
        newProfilPage.setAttribute("profil-id", el.id);
        newProfilPage.innerHTML = `
            <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            <span class="link-name profil-link-name" profil-id="${el.id}">${el.name}</span>
        `;
        
        let deleteIcon = document.createElement("span");
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");

        if (el.id != 1) {
            svg.setAttribute("viewBox", "0 0 20 20");
            svg.setAttribute("fill", "currentColor");

            path.setAttribute("fill-rule", "evenodd");
            path.setAttribute("clip-rule", "evenodd");
            path.setAttribute("d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");

            svg.appendChild(path);

            deleteIcon.classList.add("delete-profil");
            deleteIcon.appendChild(svg);
    
            deleteIcon.addEventListener("click", () => {
                deleteProfil(el.id);
            });
        }

        newProfilPage.addEventListener("click", (e) =>{
            if (e.target != deleteIcon && e.target != svg && e.target != path) {
                changeProfilPage(newProfilPage);
                menuIcon.classList.add("menu-icon-close");
            }
        });

        newProfilPage.appendChild(deleteIcon);
        leftSideMenu.appendChild(newProfilPage);
    });
}();

links.forEach((el) => {
    el.addEventListener("click", () => {
        links.forEach((el) => {
            el.classList.remove("selected-page");
        });
        let profilPage = document.querySelectorAll(".profil-page");
        profilPage.forEach((el) => {
            el.classList.remove("selected-page");
        });
        pages.forEach((el) => {
            el.classList.add("hidden-page");
            el.classList.add("page-animation");
        });
        let page = document.getElementById(el.getAttribute("link"));
        page.classList.add("page-animation");
        page.classList.remove("hidden-page");
        leftSideMenu.parentNode.classList.add("menu-hidden");
        el.classList.add("selected-page");
        menuIcon.classList.add("menu-icon-close");
        
        currentProfilPage = -1;
    });
});

function changeProfilPage(el) {
    let profilId = el.getAttribute("profil-id");
    currentProfilPage = profilId;

    config.profil.forEach((el) => {
        if (el.id == profilId) {
            inputProfilName.setAttribute("value", el.name);
            inputProfilName.value = el.name;
            inputProfilCommand.setAttribute("value", el.programm);
            inputProfilCommand.value = el.programm;
            inputProfilIcon.setAttribute("selected-value", el.icon);
            inputProfilProcessName.setAttribute("state", el.processName != undefined && (el.processName == "true" || el.processName == "false") ? el.processName == "true" : true);
        } 
    });

    let profilPage = document.querySelectorAll(".profil-page");
    profilPage.forEach((el) => {
        el.classList.remove("selected-page");
    });
    links.forEach((el) => {
        el.classList.remove("selected-page");
    });
    
    pages.forEach((el) => {
        el.classList.add("hidden-page");
        el.classList.add("page-animation");
    });

    let page = document.getElementById(el.getAttribute("link"));
    page.classList.add("page-animation");
    page.classList.remove("hidden-page");
    leftSideMenu.parentNode.classList.add("menu-hidden");
    el.classList.add("selected-page");
}

window.addEventListener("resize", () => {
    pages.forEach((el) => {
        el.classList.remove("page-animation");
    });
});

shortcutAddBtn.addEventListener("click", () => {
    let profils = "";
    config.profil.forEach((el) => {
        profils += el.name + ";";
    });
    profils = profils.substring(0, profils.length - 1);

    let shortcutId = 0;
    config.shortcut.forEach((el) => {
        shortcutId += el.id;
    });

    let shortcutLine = document.createElement("div");
    shortcutLine.classList.add("shortcutLine");
    shortcutLine.setAttribute("shortcut-id", shortcutId);

    shortcutLine.innerHTML = `
        <div>
            <drop-down-menu input-list="Close;Copy;Paste;Config;${profils}" shortcut-id="${shortcutId}"></drop-down-menu>
        </div>
        <div>
            <shortcut-picker shortcut-id="${shortcutId}"></shortcut-picker>
        </div>
        <div>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="edit-icon icon hidden" shortcut-id="${shortcutId}">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="valid-icon icon" shortcut-id="${shortcutId}">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="trash-icon icon" shortcut-id="${shortcutId}">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </div>
    `;

    shortcutList.push(shortcutId);
    shortcutSection.appendChild(shortcutLine);

    let validIcon = document.querySelectorAll(".valid-icon");
    validIcon.forEach((el) => {
        el.addEventListener("click", () => {
            if (document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value") != undefined && document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value") != undefined) {
                el.classList.add("hidden");
                document.querySelector(".edit-icon[shortcut-id='" + el.getAttribute("shortcut-id") + "'").classList.remove("hidden");
                document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").setAttribute("disable", "");
                document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").setAttribute("disable", "");
                let finded = false;
                config.shortcut.forEach((shortcut) => {
                    if (shortcut.id == el.getAttribute("shortcut-id")) {
                        shortcut.action = document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value");
                        shortcut.control = document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value");
                        saveUpdate();
                        finded = true;
                    }
                });
                if (!finded) {
                    let newShortcut = {
                        id: Number(el.getAttribute("shortcut-id")),
                        action: document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value"),
                        control: document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value")
                    };
                    config.shortcut.push(newShortcut);
                    saveUpdate();
                }
            }
        });
    });

    let editIcon = document.querySelectorAll(".edit-icon");
    editIcon.forEach((el) => {
        el.addEventListener("click", () => {
            el.classList.add("hidden");
            document.querySelector(".valid-icon[shortcut-id='" + el.getAttribute("shortcut-id") + "'").classList.remove("hidden");
            document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").removeAttribute("disable");
            document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").removeAttribute("disable");
        });
    });

    let deleteIcon = document.querySelectorAll(".trash-icon");
    deleteIcon.forEach((el) => {
        el.addEventListener("click", () => {
            let shortcutLine = document.querySelector("div[shortcut-id='" + el.getAttribute("shortcut-id") + "'");
            shortcutSection.removeChild(shortcutLine);
            shortcutList.forEach((shortcut, index, obj) => {
                if (shortcut == el.getAttribute("shortcut-id")) {
                    obj.splice(index, 1);
                    config.shortcut.forEach((shortcutObj, index, shortcutData) => {
                        if (shortcutObj.id == el.getAttribute("shortcut-id")) {
                            shortcutData.splice(index, 1);
                        }
                    }); 
                }
            });
            saveUpdate();
        });
    });
});

profilCreateBtn.addEventListener("click", () => {
    let newProfilId = 1;

    config.profil.forEach((el) => {
        newProfilId += el.id;
    });

    let newProfilPage = document.createElement("div");
    newProfilPage.classList.add("profil-page");
    newProfilPage.setAttribute("link", "profil-page");
    newProfilPage.setAttribute("profil-id", newProfilId);
    newProfilPage.innerHTML = `
        <svg class="link-icon" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
        </svg>
        <span class="link-name profil-link-name" profil-id="${newProfilId}">New Profile</span>
    `;
    
    let deleteIcon = document.createElement("span");
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    if (newProfilId != 1) {
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("fill", "currentColor");

        path.setAttribute("fill-rule", "evenodd");
        path.setAttribute("clip-rule", "evenodd");
        path.setAttribute("d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");

        svg.appendChild(path);

        deleteIcon.classList.add("delete-profil");
        deleteIcon.appendChild(svg);

        deleteIcon.addEventListener("click", () => {
            deleteProfil(newProfilId);
        });
    }

    newProfilPage.addEventListener("click", (e) =>{
        if (e.target != deleteIcon && e.target != svg && e.target != path) {
            changeProfilPage(newProfilPage);
            menuIcon.classList.add("menu-icon-close");
        }
    });

    newProfilPage.appendChild(deleteIcon);
    leftSideMenu.appendChild(newProfilPage);

    let newProfil = {
        id: newProfilId,
        name: "New Profile",
        programm: `${osData.os == "win32" ? "powershell.exe" : "sh -c $SHELL"}`,
        icon: "Default"
    };
    config.profil.push(newProfil);

    let newProfilList = "";
    config.profil.forEach((el) => {
        newProfilList += el.name;
        newProfilList += ";";
    });
    profilDropDownMenu.setAttribute("input-list", newProfilList.slice(0, -1));

    saveUpdate();
});



function loadConfig() {
    config.disableOnBlur = (config?.disableOnBlur != undefined ? config.disableOnBlur == "true" : true);
    config.bringAppToFront = config?.bringAppToFront == "true" ? "true" : "false";
    config.terminalFonts = (config?.terminalFonts ? config.terminalFonts : "Consolas, courier-new, courier, monospace");

    let profils = "";
    config.profil.forEach((el) => {
        el.processName = (el.processName != undefined && (el.processName == "true" || el.processName == "false") ? el.processName : "true")
        profils += el.name + ";";
    });
    profils = profils.substring(0, profils.length - 1);
    profilDropDownMenu.setAttribute("input-list", profils);

    // Load all theme inside menu
    fs.readdir(osData.homeDir + "/Applications/tess/config/theme", (err, files) => {
        if (err) {
            console.log(err);
        } else {
            let themeList = "";
            files.forEach((file) => {
                if (file.endsWith(".json") && file != "default.json") {
                    themeList += file.split(".json")[0] + ";";
                }
            });
            themeList += "default";
            themeDropDownMenu.setAttribute("input-list", themeList);
        }
    });

    progressPicker.forEach((el) => {
        el.removeAttribute("selected-value");
        el.setAttribute("selected-value", config[el.getAttribute("parameters")]);
        el.addEventListener("update", () => {
            config[el.getAttribute("parameters")] = el.getAttribute("selected-value");
            saveUpdate();
            if (el.getAttribute("reloadRequire") != undefined) {
                reloadRequireIcon.classList.remove("invisible");
            }
        });
    });
    setTimeout(() => {
        dropDownMenu.forEach((el) => {
            el.setAttribute("selected-value", config[el.getAttribute("parameters")]);
            el.addEventListener("update", () => {
                config[el.getAttribute("parameters")] = el.getAttribute("selected-value");
                saveUpdate();
                if (el.getAttribute("reloadRequire") != undefined) {
                    reloadRequireIcon.classList.remove("invisible");
                }
            });
        });
    }, 40);
    switchButton.forEach((el) => {
        el.setAttribute("state", config[el.getAttribute("parameters")]);
        el.addEventListener("updatedValue", () => {
            config[el.getAttribute("parameters")] = el.getAttribute("state");
            saveUpdate();
            if (el.getAttribute("reloadRequire") != undefined) {
                reloadRequireIcon.classList.remove("invisible");
            }
        });
    });
    filePickerEl.forEach((el) => {
        el.setAttribute("selected-value", config[el.getAttribute("parameters")]);
        el.addEventListener("update", () => {
            config[el.getAttribute("parameters")] = el.getAttribute("selected-value");
            if (el.getAttribute("reloadRequire") != undefined) {
                reloadRequireIcon.classList.remove("invisible");
            }
            saveUpdate();
        });
    });

    inputs.forEach((el) => {
        let timeout;
        el.value = config[el.getAttribute("parameters")];
        el.addEventListener("input", () => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                config[el.getAttribute("parameters")] = el.value;
                saveUpdate();
            }, 150)
        })
    })

    // Load Plugin Section
    fs.readdir(osData.homeDir + "/Applications/tess/plugins", (err, plugins) => {
        if (err || plugins.length == 0) {
            noPluginMessage.classList.remove("hidden")
        } else {
            plugins.forEach((plugin) => {
                let newPluginSwitchOptions = document.createElement("div");
                newPluginSwitchOptions.classList.add("plugin-props");
    
                let description = document.createElement("div");
                description.classList.add("description");
    
                let title = document.createElement("span");
                title.classList.add("title");
                title.innerHTML = plugin.replace("-", " ");
                let details = document.createElement("span");
                details.classList.add("details");
                //details.innerHTML = "TODO : get plugins description";
                details.innerHTML = plugin; // get plugin description
    
                description.appendChild(title);
                description.appendChild(details);
    
                newPluginSwitchOptions.appendChild(description);
    
                let switchButton = document.createElement("switch-button");
                switchButton.setAttribute("state", false);
                
                if (config.plugin.includes(plugin)) {
                    switchButton.setAttribute("state", true);
                }
    
                switchButton.addEventListener("updatedValue", () => {
                    if (switchButton.getAttribute("state") == "true") {
                        config.plugin.push(plugin);
                    } else {
                        config.plugin.forEach((el, index) => {
                            if (el == plugin) {
                                config.plugin.splice(index, 1);
                            }
                        });
                    }
                    reloadRequireIcon.classList.remove("invisible");
                    saveUpdate();
                });
    
                newPluginSwitchOptions.appendChild(switchButton);
                pluginSection.appendChild(newPluginSwitchOptions);
            });
        }
    });
}

function loadShortcut() {
    let profils = "";
    config.profil.forEach((el) => {
        profils += el.name + ";";
    });
    profils = profils.substring(0, profils.length - 1);

    shortcutList.forEach((el) => {
        let shortcutLine = document.querySelector(`.shortcutLine[shortcut-id='${el}'`);
        shortcutSection.removeChild(shortcutLine);
    });
    shortcutList = [];

    config.shortcut.forEach((el) => {
        let shortcutLine = document.createElement("div");
        shortcutLine.classList.add("shortcutLine");
        shortcutLine.setAttribute("shortcut-id", el.id);
        shortcutLine.innerHTML = `
            <div>
                <drop-down-menu input-list="Close;Copy;Paste;Config;${profils}" shortcut-id="${el.id}" selected-value="${el.action}" disable></drop-down-menu>
            </div>
            <div>
                <shortcut-picker selected-value="${el.control}" shortcut-id="${el.id}" disable></shortcut-picker>
            </div>
            <div>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="edit-icon icon" shortcut-id="${el.id}">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="valid-icon hidden icon" shortcut-id="${el.id}">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="trash-icon icon" shortcut-id="${el.id}">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
        `;

        shortcutSection.appendChild(shortcutLine);
        shortcutList.push(el.id);
    });

    let validIcon = document.querySelectorAll(".valid-icon");
    validIcon.forEach((el) => {
        el.addEventListener("click", () => {
            if (document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value") != undefined && document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value") != undefined) {
                el.classList.add("hidden");
                document.querySelector(".edit-icon[shortcut-id='" + el.getAttribute("shortcut-id") + "'").classList.remove("hidden");
                document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").setAttribute("disable", "");
                document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").setAttribute("disable", "");
                config.shortcut.forEach((shortcut) => {
                    if (shortcut.id == el.getAttribute("shortcut-id")) {
                        shortcut.action = document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value");
                        shortcut.control = document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").getAttribute("selected-value");
                        saveUpdate();
                    }
                });
            }
        });
    });

    let editIcon = document.querySelectorAll(".edit-icon");
    editIcon.forEach((el) => {
        el.addEventListener("click", () => {
            el.classList.add("hidden");
            document.querySelector(".valid-icon[shortcut-id='" + el.getAttribute("shortcut-id") + "'").classList.remove("hidden");
            document.querySelector("drop-down-menu[shortcut-id='" + el.getAttribute("shortcut-id") + "'").removeAttribute("disable");
            document.querySelector("shortcut-picker[shortcut-id='" + el.getAttribute("shortcut-id") + "'").removeAttribute("disable");
        });
    });

    let deleteIcon = document.querySelectorAll(".trash-icon");
    deleteIcon.forEach((el) => {
        el.addEventListener("click", () => {
            let shortcutLine = document.querySelector("div[shortcut-id='" + el.getAttribute("shortcut-id") + "'");
            shortcutSection.removeChild(shortcutLine);
            shortcutList.forEach((shortcut, index, obj) => {
                if (shortcut == el.getAttribute("shortcut-id")) {
                    obj.splice(index, 1);
                    config.shortcut.forEach((shortcutObj, index, shortcutData) => {
                        if (shortcutObj.id == el.getAttribute("shortcut-id")) {
                            shortcutData.splice(index, 1);
                        }
                    }); 
                    saveUpdate();
                }
            });
        });
    });
}
let saveUpdateTimeout;

function saveUpdate() {
    clearTimeout(saveUpdateTimeout)
    fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", JSON.stringify(config));
    saveUpdateTimeout = setTimeout(() => {
        ipcRenderer.send("reloadConfig");
    }, 500)
}

function deleteProfil(id) {
    let name = "";
    config.profil.forEach((el, index, list) => {
        if (el.id == id) {
            list.splice(index, 1);
            name = el.name;
        }
    });

    config.shortcut.forEach((el, index, list) => {
        if (el.action == name) {
            list.splice(index, 1);
        }
    });

    let newProfilList = "";
    config.profil.forEach((el) => {
        newProfilList += el.name;
        newProfilList += ";";
    });
    profilDropDownMenu.setAttribute("input-list", newProfilList.slice(0, -1));



    if (config.defaultProfil == name) {
        // update drop down menu for default profil
        config.defaultProfil = "Default Shell";
        profilDropDownMenu.setAttribute("selected-value", "Default Shell");
    }

    if (currentProfilPage == id) {
        let defaultShellProfilLink = document.querySelector("*[profil-id='1']");
        defaultShellProfilLink.click();
    }

    let currentProfilLink = document.querySelector(`*[profil-id="${id}"]`);
    leftSideMenu.removeChild(currentProfilLink);

    saveUpdate();
    loadShortcut();
}

setTheme();
loadConfig();
loadShortcut();