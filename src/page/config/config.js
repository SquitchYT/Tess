require = parent.require // for get the good require function

const { ipcRenderer } = require("electron");
const fs = require("fs")
const root = document.documentElement;

const savePop = document.querySelector(".save-alert");

const colors = ipcRenderer.sendSync("get-theme");
let config = ipcRenderer.sendSync("get-config");
let newConfig = JSON.parse(JSON.stringify(config));

const OsInfomations = require('../../../class/osinfo');
const osData = new OsInfomations();

const themeDropDownMenu = document.querySelector("drop-down-menu[parameters='theme']");

const pluginSection = document.querySelector(".plugin")

const saveButton = document.querySelector(".saveButton");
const cancelButton = document.querySelector(".cancelButton");
const saveReloadButton = document.querySelector(".saveReloadButton");

root.style.setProperty('--background', colors?.terminal?.theme?.background);
root.style.setProperty("--item-background", colors?.app?.general?.background)
root.style.setProperty("--item-foreground", colors?.app?.general?.foreground)
root.style.setProperty("--item-textcolor", colors?.app?.general?.text_color)
root.style.setProperty("--item-radius", colors?.app?.general?.button_radius + "px")
root.style.setProperty("--item-green", colors?.terminal?.theme?.green)
root.style.setProperty("--item-red", colors?.terminal?.theme?.red)
root.style.setProperty("--app-background", colors?.terminal?.theme?.background);

document.addEventListener("DOMContentLoaded", () => {
    let elements = document.querySelectorAll(".no-transition");
    setTimeout(() => {
        elements.forEach((el) => {
            el.classList.add("transition")
        })
    }, 300);
})

function loadConfig() {
    // Load all theme inside menu
    fs.readdir(osData.homeDir + "/Applications/tess/config/theme", (err, files) => {
        if (err) {
            console.log(err);
        } else {
            let themeList = "";
            files.forEach((file) => {
                if (file.endsWith(".json") && file != "default.json") {
                    themeList += file.split(".json")[0] + ";"
                }
            })
            themeList += "default";
            themeDropDownMenu.setAttribute("input-list", themeList);
        }
    })

    // Set default value for drop down menu
    setTimeout(() => {
        const dropDownMenu = document.querySelectorAll("drop-down-menu");
        dropDownMenu.forEach((el) => {
            el.setAttribute("selected-value", newConfig[el.getAttribute("parameters")])
            el.addEventListener("update", () => {
                newConfig[el.getAttribute("parameters")] = el.getAttribute("selected-value")
                checkUpdate();
            })
        })
    }, 50);

    // Load Plugin Section
    fs.readdir(osData.homeDir + "/Applications/tess/plugins", (err, plugins) => {
        if (err) {
            console.log(err);
        } else {
            pluginSection.innerHTML = "";
            let title = document.createElement("h3");
            title.innerText = "Plugin";
            pluginSection.appendChild(title);
            plugins.forEach((plugin) => {
                let newPluginSwitchOptions = document.createElement("div");
                newPluginSwitchOptions.classList.add("plugin-props");
    
                let description = document.createElement("div");
                description.classList.add("description");
    
                let title = document.createElement("span");
                title.classList.add("title")
                title.innerHTML = plugin;
                /*let details = document.createElement("span");
                details.classList.add("details")
                details.innerHTML = "TODO : get plugins description"*/
    
                description.appendChild(title);
                //description.appendChild(details);
    
                newPluginSwitchOptions.appendChild(description);
    
                let switchButton = document.createElement("switch-button");
                switchButton.setAttribute("state", false)
                
                if (newConfig.plugin.includes(plugin)) {
                    switchButton.setAttribute("state", true)
                }
    
                switchButton.addEventListener("updatedValue", () => {
                    if (switchButton.getAttribute("state") == "true") {
                        newConfig.plugin.push(plugin)
                    } else {
                        newConfig.plugin.forEach((el, index) => {
                            if (el == plugin) {
                                newConfig.plugin.splice(index, 1);
                            }
                        })
                    }
                    checkUpdate()
                })
    
                newPluginSwitchOptions.appendChild(switchButton);
                pluginSection.appendChild(newPluginSwitchOptions);
            })
        }
    })
}

saveButton.addEventListener("click", () => {
    // add processing rounded icon animated
    fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", JSON.stringify(newConfig));
    config = JSON.parse(JSON.stringify(newConfig));
    checkUpdate();
})

saveReloadButton.addEventListener("click", () => {
    // add processing rounded icon animated
    fs.writeFileSync(osData.homeDir + "/Applications/tess/config/tess.config", JSON.stringify(newConfig));
    config = JSON.parse(JSON.stringify(newConfig));
    ipcRenderer.send("reload")
})

cancelButton.addEventListener("click", () => {
    // add processing rounded icon animated
    newConfig = JSON.parse(JSON.stringify(config));
    loadConfig();
    checkUpdate();
})

function checkUpdate() {
    if (JSON.stringify(config) == JSON.stringify(newConfig)) {
        savePop.classList.remove("visible")
    } else {
        savePop.classList.add("visible");
    }
}

loadConfig();