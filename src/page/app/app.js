const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const { WebLinksAddon } = require("xterm-addon-web-links");
const { LigaturesAddon } = require("xterm-addon-ligatures");

const { ipcRenderer : ipc, clipboard, shell } = require("electron");

const Color = require("../../../class/color");

const topbar = document.querySelector(".topbar");

topbar.addEventListener("dblclick", () => {
    if (osData.os == "win32") {
        ipc.send("reduce-expand");
    }
});

const tabs = document.querySelector(".tabs-tab");
const terminals = document.querySelector(".terminals");
const body = document.body;
const root = document.documentElement;
const target = document.getElementById("test");
const osInformations = require("../../../class/osinfo");

const dropDownArrow = document.getElementById("show-all-shell");
const quickAccessMenu = document.querySelector(".quick-menu");
const quickMenuInner = document.querySelector(".inner-quick-menu");

const quickDefault = document.getElementById("quick-default");
const quickConfig = document.getElementById("quick-config");
//const quickMarket = document.getElementById("quick-market");

const quickDefaultName = document.getElementById("quick-default-name");
const quickDefaultShortcut = document.getElementById("quick-default-shortcut");
const quickDefaultIcon = document.getElementById("quick-default-icon");

const quickConfigShortcut = document.getElementById("quick-config-shortcut");

const quickMenuShellBox = document.querySelector(".quick-menu-other");

const quickMenuNoOtherShell = document.getElementById("quick-no-other-shell")


let previousBackgroundStyle = undefined;


quickDefault.addEventListener("click", () => {
    openDefaultProfil();
})

quickConfig.addEventListener("click", () => {
    CreateNewTerminal("Config", "Config", "../../img/gear.svg");
})

dropDownArrow.addEventListener("mouseover", () => {
    quickAccessMenu.classList.add("quick-visible");
    let maxLeft = window.innerWidth - quickAccessMenu.getBoundingClientRect()["width"] - 10
    let left = dropDownArrow.offsetLeft - quickAccessMenu.getBoundingClientRect()["width"] / 2 < maxLeft ? dropDownArrow.offsetLeft - quickAccessMenu.getBoundingClientRect()["width"] / 2 : maxLeft
    quickAccessMenu.style.left = `${left}px`
    setTimeout(() => {
        quickMenuInner.classList.add("pointer-event");
    }, 180);
})

dropDownArrow.addEventListener("mouseleave", () => {
    quickAccessMenu.classList.remove("quick-visible");
    quickMenuInner.classList.remove("pointer-event");
})

quickAccessMenu.addEventListener("mouseover", () => {
    quickAccessMenu.classList.add("quick-visible");
    setTimeout(() => {
        quickMenuInner.classList.add("pointer-event");
    }, 50);
})

quickAccessMenu.addEventListener("mouseleave", () => {
    quickAccessMenu.classList.remove("quick-visible");
})

function closeQuickAccessMenu() {
    quickAccessMenu.classList.remove("quick-visible");
    quickMenuInner.classList.remove("pointer-event");
}


const osData = new osInformations();

if (osData.wm != "win" && osData.wm != "macos") {
    let titleBarButton = document.querySelectorAll(".app-button");
    titleBarButton.forEach(element => {
        element.remove();
    });
} else {
    document.getElementById("close").addEventListener("click", () => {
        ipc.send("close");
    });
    document.getElementById("reduce").addEventListener("click", () => {
        ipc.send("reduce");
    });
    document.getElementById("screen-size").addEventListener("click", () => {
        ipc.send("reduce-expand");
    });
}

ipc.on("app-reduced-expanded", (_, maximazed) => {
    let reduceIcon = document.getElementById("reduceIcon");
    let expandIcon = document.getElementById("expandIcon");

    if (maximazed) {
        reduceIcon.classList.remove("app-button-hidden");
        expandIcon.classList.add("app-button-hidden");
    } else {
        expandIcon.classList.remove("app-button-hidden");
        reduceIcon.classList.add("app-button-hidden");
    }
});

ipc.on("focus", () => {
    document.querySelectorAll(".app-button").forEach((el) => {
        el.classList.remove("app-button-unfocus")
    })
})

ipc.on("unfocus", () => {
    document.querySelectorAll(".app-button").forEach((el) => {
        el.classList.add("app-button-unfocus")
    })
})

const shortcutAction = ["Close", "Copy", "Paste", "OpenShell"];
const CustomPage = [
    {
        name: "Config",
        onePage: true,
        icon: "../../img/gear.svg"
    }
];

let cols;
let rows;
let terminalsList = [];
let n = 0;
let index = 0;

let config;
let colors;

let fontSize;
let shortcut = [];
let canShortcut = true;

let tabOrderToAdd = 0;

let maxIndex = 1;

ipc.on("shortcutStateUpdate", (e, state) => {
    canShortcut = state;
});


ipc.on("pty-data", (e, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data);
            let tab = document.querySelector(".tab-" + data.index);
            if (data.processName != "" && !tab.hasAttribute("profil-named")) {
                let process = data.processName.split("/");
                tab.innerHTML = process[process.length - 1][0].toUpperCase() + process[process.length - 1].slice(1);
            }
        } 
    });
});

ipc.on("rename-tab", (_, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            let tab = document.querySelector(".tab-" + data.index);
            if (!tab.hasAttribute("profil-named")) {
                tab.innerHTML = data.name.split(".exe")[0][0].toUpperCase() + data.name.split(".exe")[0].slice(1);
            }
        } 
    });
});

ipc.on("loaded", (_, data) => {
    config = data.config;
    colors = data.colors;
    let loadOptions = data.loadOptions;

    previousBackgroundStyle = config.background

    HandleShortcut();

    fontSize = (config.terminalFontSize != undefined) ? config.terminalFontSize : 14;
    const bgColor = new Color(colors.terminal.theme.background, config.transparencyValue / 100);

    let needTransparent = (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind");
    if (needTransparent) {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty("--opacity", (config.transparencyValue / 100) + 0.21);
        root.style.setProperty("--background", colors.terminal.theme.background);
        colors.terminal.theme.background = "transparent";
    } else if (config.background == "image") {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty("--opacity", (config.transparencyValue / 100) + 0.21);
        root.style.setProperty("--background-image", 'url("' + config.imageLink + '")');
        root.style.setProperty("--background", colors.terminal.theme.background);
        root.style.setProperty("--blur", "blur(" + config.imageBlur +"px)");
        colors.terminal.theme.background = "transparent";
    } else {
        root.style.setProperty("--background", colors.terminal.theme.background);
    }

    colors.terminal.theme.background = "transparent";

    root.style.setProperty("--tab-panel-background", colors.app.topBar);
    root.style.setProperty("--quick-access-menu-color", colors.app.topBar);
    root.style.setProperty("--tab-active-background", colors.app.tabActive);
    root.style.setProperty("--tab-inactive-background", colors.app.tabInactive);
    root.style.setProperty("--tab-text-color", colors.app.textColor);
    root.style.setProperty("--tab-text-size", colors?.app?.text?.size ? colors?.app?.tab?.text?.size + "px ": "12px");
    root.style.setProperty("--general-text-color", colors.app.textColor);
    root.style.setProperty("--tab-hover", colors.app.backgroundHover);

    body.style.color = colors.app.textColor;

    openNewPage(loadOptions);

    document.getElementById("new-tab").addEventListener("click", () => {
        openDefaultProfil();
    });

    updateQuickMenu();

    ipc.send("load-end");
});

function HandleShortcut() {
    shortcut = [];

    config.shortcut.forEach((el) => {
        let newShortcut= {
            ctrl : false,
            shift : false,
            alt: false,
            key : el.control.slice(-1).toUpperCase(),
            action : el.action
        };

        if (el.control.includes("CTRL")) {
            newShortcut.ctrl = true;
        } if (el.control.includes("ALT")) {
            newShortcut.alt = true;
        } if (el.control.includes("SHIFT")) {
            newShortcut.shift = true;
        }

        shortcut.push(newShortcut);
    });
}

function CreateNewTerminal(toStart, name, icon, workdir, processNamed) {
    if (config?.bringAppToFront == "true") {
        ipc.send("focus");
    }

    if (onlyOnePage(toStart) && checkIfPageAlreadyOpened(toStart) && checkIfCustomPage(toStart)) 
    {
        terminalsList.forEach((el) => {
            if (el?.customPage == toStart) {
                let tab = document.querySelector(".tab-all-" + el.index)
                focusTerm(el.index, tab)
            }
        })

        return
    }

    closeQuickAccessMenu()

    if (icon == undefined) { icon = "Default"; }

    if (checkIfCustomPage(toStart)) {
        CustomPage.forEach((el) => {
            if (el.name == toStart && el.icon) {
                icon = el.icon;
            }
        })
    }

    let tab = document.createElement("div");
    tab.classList.add("tab", "tab-all-" + index, "tab-active");
    tab.setAttribute("index", index + 1);
    tab.style.order = index + 1;

    maxIndex = index;

    let tab_link = document.createElement("div");

    /**********************
    **** mouseUp event ****
    **********************/
    tab_link.addEventListener("mouseup", () => {
        changeTabOrder(tab, tab_link);
        tab.setAttribute("dragged", "false");
    });
    tab.addEventListener("mouseup", () => {
        changeTabOrder(tab, tab_link);
        tab.setAttribute("dragged", "false");
    });
    tab_link.addEventListener("click", () => {
        changeTabOrder(tab, tab_link);
    });
    document.addEventListener("mouseup", () => {
        changeTabOrder(tab, tab_link);
    });

    tab_link.addEventListener("mousedown", (e) => {
        tab.setAttribute("mousedown", "true");
        tab.setAttribute("startDragX", `${e.clientX}`);
        tab.setAttribute("dragged", "false");
        tabOrderToAdd = 0;
        focusTerm(tab_link.classList[2], tab);
    });
    tab.addEventListener("mousedown", (e) => {
        tab.setAttribute("mousedown", "true");
        tab.setAttribute("startDragX", `${e.clientX}`);
        tab.setAttribute("dragged", "false");
        tabOrderToAdd = 0;
        focusTerm(tab_link.classList[2], tab);
    });

    document.addEventListener("mousemove", (e) => { // move that to global scope : optimizing
        if (tab.getAttribute("mousedown") == "true") {
            if (tab.getAttribute("dragged") != "true" && Math.abs(e.clientX - Number(tab.getAttribute("startDragX"))) > 15) {
                tab.setAttribute("dragged", "true");
            }

            if (tab.getAttribute("dragged") == "true") {
                tab.classList.add("overAll");
                tab.style.transform = `translateX(${e.clientX - Number(tab.getAttribute("startDragX"))}px)`;

                let a = e.clientX - Number(tab.getAttribute("startDragX"));
                let b = tab.getBoundingClientRect().width;
                tabOrderToAdd = Math.round(a / b);

                tab.setAttribute("orderToAdd", tabOrderToAdd);
            }
        }
    });

    tab_link.innerHTML = name;
    tab_link.classList.add("tab-link", "tab-" + index, index);
    if (!processNamed) { tab_link.setAttribute("profil-named", "true"); }

    let close_button = document.createElement("div");
    close_button.classList.add("close-button");
    close_button.setAttribute("close-button-number", index);

    close_button.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
    `;

    close_button.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (t.type == "Page") {
            Close(close_button.getAttribute("close-button-number"));
        } else {
            ipc.send("close-terminal", close_button.getAttribute("close-button-number"));
        }

        let tabs = document.querySelectorAll(".tab");
        let indexList = [];
        tabs.forEach((el) => {
            indexList.push(Number(el.getAttribute("index")));
        });

        maxIndex = Math.max(...indexList);
    });
    

    let logo = document.createElement("img");
    logo.src = (icon != "Default") ? icon : "../../img/default.png";
    logo.classList.add("logo");

    tab.appendChild(logo);
    tab.appendChild(tab_link);
    tab.appendChild(close_button);
    tabs.appendChild(tab);

    let termDiv = document.createElement("div");
    termDiv.classList.add("terms", "terminal-" + index, "visible");
    termDiv.setAttribute("number", index);

    logo.addEventListener("click", () => {
        focusTerm(tab_link.classList[2], tab);
    });

    tab.addEventListener("animationstart", () => {
        focusTerm(tab_link.classList[2], tab);
    });

    let t;
    if (checkIfCustomPage(toStart)) {
        let page = document.createElement("iframe");
        page.setAttribute("src", "../config/config.html");
        page.setAttribute("nodeintegration", "");
        termDiv.appendChild(page);

        page.classList.add("iframe");

        page.addEventListener("load", () => {
            let iFrameWindow = page.contentWindow;
            iFrameWindow.addEventListener("keydown", (e) => {
                setTimeout(() => {
                    if (canShortcut) {
                        ExecuteShortcut(e);
                    }
                }, 100);
            });
        });

        page.focus();

        t = {
            index: index,
            term: page,
            type: "Page",
            customPage: toStart
        };
    } else {
        if (!cols) resize();

        const fitAddon = new FitAddon();

        let term = new Terminal({
            cols: cols,
            rows: rows,
            theme: colors.terminal.theme,
            cursorStyle: config.cursorStyle,
            allowTransparency: true,
            fontSize: fontSize,
            cursorBlink: (config.cursorBlink == "true"),
            fontFamily: (config?.terminalFonts) ? config?.terminalFonts : "Consolas, courier-new, courier, monospace"
        });
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon(("click", (e, url) => {
            shell.openExternal(url);
        })));

        term.open(termDiv);

        let ligatureAddon = new LigaturesAddon()
        if (config.experimentalFontLigature == "true") {
            term.loadAddon(ligatureAddon)
        }

        fitAddon.fit()

        term.attachCustomKeyEventHandler((e) => {
            let o = ExecuteShortcut(e);
            return (o == undefined) ? false : o;
        });

        term.onData((e) => {
            ipc.send("terminal-data", {
                index: n,
                data: e
            });
        });

        let terms = document.getElementsByClassName("terms");
        let yy = document.getElementsByClassName("tab");

        let i = 0;
        while (i < terms.length) {
            let a = terms.item(i);
            let e = yy.item(i);
            e.style.background = colors?.app?.tab_background;
            a.classList.add("hidden");
            i++;
        }

        ipc.send("new-term", {
            index: index,
            rows: rows,
            cols: cols,
            shell: toStart,
            workdir: workdir
        });

        t = {
            index: index,
            term: term,
            type: "Terminal",
            fitAddon: fitAddon,
            ligatureAddon: ligatureAddon
        };
    }

    n = index;
    index++;
    terminals.appendChild(termDiv);
    terminalsList.push(t);
}


function focusTerm(index, tab) {
    let terms = document.getElementsByClassName("terms");
    let tabs = document.getElementsByClassName("tab");

    let i = 0;
    while (i < terms.length) {
        let a = terms.item(i);
        let r = tabs.item(i);
        a.classList.add("hidden");
        a.classList.remove("visible");

        r.classList.remove("tab-active");
        r.classList.add("tab-inactive");
        i++;  
    }

    tab.classList.remove("tab-inactive");
    tab.classList.add("tab-active");

    let termToView = document.querySelector(".terminal-" + index);
    termToView.classList.remove("hidden");
    termToView.classList.add("visible");

    n = index;
    setTimeout(() => {
        termToView.click();
        terminalsList.forEach((el) => {
            if (el.index == index) {
                el.term.focus();
            } 
        });
    }, 50);
}

function resize() {
    rows = 36;
    cols = 64;

    terminalsList.forEach((el) => {
        if (el.type == "Terminal") {
            try {
                rows = el.fitAddon.proposeDimensions().rows;
                cols = el.fitAddon.proposeDimensions().cols;
                el.fitAddon.fit()
                el.term._core.viewport._refresh();
            } catch (err) {
                console.log(err);
            }
        }
        
    });

    ipc.send("resize", {
        cols: cols,
        rows: rows
    });
}

function Close(index) {
    closeQuickAccessMenu()
    let te = document.querySelector(".terminal-" + index);
    let ta = document.querySelector(".tab-all-" + index);
    try {
        ta.remove();
        te.remove();   
    } catch (e) {
        console.log(e);
    }

    let y = 0;
    terminalsList.forEach((el) => {
        if (el.index == index) {
            if (el.type == "Terminal") {
                el.term.dispose();
            }
            terminalsList.splice(y, 1);
        }
        y++;
    });

    if (terminalsList.length === 0) {
        ipc.send("close");
    } else if (n == index){
        let i = {
            index: 0,
            dif: Infinity
        };
        terminalsList.forEach((el) => {
            if (Math.abs(index - el.index) < i.dif) {
                i.index = el.index;
                i.dif = Math.abs(index - el.index);
            }
        });

        let tab = document.querySelector(".tab-all-" + i.index);
        focusTerm(i.index, tab);
    }

    return false;
}

target.addEventListener("wheel", event => {
    event.preventDefault();
    target.scrollLeft += event.deltaY;
});

function ExecuteShortcut(e) {
    let result = true;
    let dos = false; // replace that by a 'Do' variable name
    shortcut.forEach((el) => {
        if (e.ctrlKey == el.ctrl && e.shiftKey == el.shift && e.altKey == el.alt && e.key.toUpperCase() == el.key && e.type == "keydown" && !dos) {
            dos = true;
            if (shortcutAction.includes(el.action)) {
                result = window[el.action](n);
            } else {
                if (checkIfCustomPage(el.action)) {
                    CreateNewTerminal(el.action, el.action);
                    result = false;
                } else {
                    config.profil.forEach((profil) => {
                        if (profil.name == el.action) {
                            CreateNewTerminal(profil.programm, profil.name, profil.icon, undefined, (profil.processName != undefined && (profil.processName == "true" || profil.processName == "false") ? profil.processName == "true" : true));
                            result = false;
                        }
                    }); 
                }
            }
        }
    });
    return result;
}

// eslint-disable-next-line no-unused-vars
function Paste() {
    terminalsList.forEach((el) => {
        if (el.index == n) {
            ipc.send("terminal-data", {
                index: n,
                data: clipboard.readFindText()
            });
        }
    });
    return false;
}

// eslint-disable-next-line no-unused-vars
function Copy() {
    let result = true;
    terminalsList.forEach((el) => {
        if (el.index == n && el.term.getSelection() != "") {
            clipboard.writeText(el.term.getSelection());
            result = false;
        }
    });
    return result;
}

setTimeout(() => {
    resize();
}, 150);

ipc.on("newConfig", (e, data) => {
    config = data.config;
    colors =  JSON.parse(JSON.stringify(data.color));
    HandleShortcut();

    if (previousBackgroundStyle == "full") {
        root.style.setProperty("--background", colors.terminal.theme.background);
    }

    const bgColor = new Color(colors.terminal.theme.background, config.transparencyValue / 100);

    let needTransparent = (previousBackgroundStyle == "transparent" || previousBackgroundStyle == "acrylic" || previousBackgroundStyle == "blurbehind" || previousBackgroundStyle == "image");
    if (needTransparent) {
        root.style.setProperty("--opacity", (config.transparencyValue / 100) + 0.21);
        root.style.setProperty("--background", bgColor.rgba);
    }

    colors.terminal.theme.background = "transparent";
    root.style.setProperty("--tab-panel-background", colors.app.topBar);
    root.style.setProperty("--quick-access-menu-color", colors.app.topBar)
    root.style.setProperty("--tab-active-background", colors.app.tabActive);
    root.style.setProperty("--tab-inactive-background", colors.app.tabInactive);
    root.style.setProperty("--tab-text-color", colors.app.textColor);
    root.style.setProperty("--tab-text-size", (colors?.app?.text?.size) ? colors?.app?.tab?.text?.size + "px ": "12px");
    root.style.setProperty("--general-text-colo)r", colors.app.textColor);
    root.style.setProperty("--tab-hover", colors.app.backgroundHover);
    
    body.style.color = colors.app.textColor;
    fontSize = (config?.terminalFontSize) ? config.terminalFontSize : 14;
    updateTerminalApparence();
    updateQuickMenu();
});

ipc.on("resize", () => {
    resize();
});

function changeTabOrder(tab, tab_link) {
    tab.setAttribute("mousedown", "false");
    tab_link.setAttribute("mousedown", "false");
    tab.style.transform = "translateX(0px)";            
    tab.classList.remove("overAll");

    if (tabOrderToAdd)
    {
        tab.setAttribute("dragged", "false");

        if (tabOrderToAdd > 0) {
            for (let index = tabOrderToAdd; index != 0; index--) {
                let nextTab = null;
                let i = 1;
                while (nextTab == null && i <= maxIndex) {
                    nextTab = document.querySelector(".tab[index='" + Number(Number(tab.getAttribute("index")) + i) + "']");
                    i++;
                }

                let allTab = document.querySelectorAll(".tab");
    
                tab.setAttribute("index", nextTab.getAttribute("index"));
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) - 1);
    
                allTab.forEach((el) => {
                    el.style.order = el.getAttribute("index");
                });
            }
        } else {
            for (let index = tabOrderToAdd; index != 0; index++) {
                let nextTab = null;
                let i = 1;

                while (nextTab == null && i <= maxIndex) {
                    nextTab = document.querySelector(".tab[index='" + Number(Number(tab.getAttribute("index")) - i++) + "']");
                }

                let allTab = document.querySelectorAll(".tab");
    
                tab.setAttribute("index", nextTab.getAttribute("index"));
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) + 1);
    
                allTab.forEach((el) => {
                    el.style.order = el.getAttribute("index");
                });
            }
        }
    }
    tabOrderToAdd = 0;
}

ipc.on("close-tab", (e, data) => {
    Close(data.index);
});

function openDefaultProfil() {
    config.profil.forEach((el) => {
        if (el.name == config.defaultProfil) {
            CreateNewTerminal(el.programm, el.name, el.icon, undefined, (el.processName != undefined && (el.processName == "true" || el.processName == "false") ? el.processName == "true" : true));
        }
    });
}
function updateTerminalApparence() {
    terminalsList.forEach((el) => {
        if (el.type == "Terminal") {
            if (config.experimentalFontLigature == "true") {
                el.term.loadAddon(el.ligatureAddon)
            } else {
                el.ligatureAddon.dispose()
            }

            el.term.setOption("theme", colors.terminal.theme);
            el.term.setOption("fontSize", config.terminalFontSize);
            el.term.setOption("cursorStyle", config.cursorStyle);
            el.term.setOption("cursorBlink", (config.cursorBlink == "true"));
            el.term.setOption("fontFamily", config.terminalFonts);
        }
    });

    resize();
}

ipc.on("openNewPage", (e, data) => {
    openNewPage(JSON.parse(data))
})

function openNewPage(data) {
    if (data.page && CustomPage.includes(data.page)) {
        CreateNewTerminal(data.page, data.page, undefined, undefined, undefined);
    } else if (data.profil || data.customCommand) {
        CreateNewTerminal((data.customCommand) ? data.customCommand : data.profil.programm, 
                          (data.customCommand) ? data.customCommand : data.profil.name, 
                          (data.customCommand) ? undefined : data.profil.icon,
                          data.workdir,
                          data.profil.processName != undefined && (data.profil.processName == "true" || data.profil.processName == "false") ? data.profil.processName == "true" : true)
    } else {
        openDefaultProfil();
    }
}

function checkIfCustomPage(pageName) {
    let finded = false
    CustomPage.forEach((el) => {
        if (pageName == el.name) { 
            finded = true
        }
    })
    return finded
}


function onlyOnePage(pageName) {
    let onePage = false
    CustomPage.forEach((el) => {
        if (pageName == el.name) { onePage = el.onePage == true }
    })

    return onePage
}

function checkIfPageAlreadyOpened(pageName) {
    let finded = false
    terminalsList.forEach((el) => {
        if (el?.customPage == pageName) { finded = true }
    })
    return finded
}

function updateQuickMenu() {
    quickConfigShortcut.innerText = "";
    quickDefaultShortcut.innerText = "";
    quickMenuShellBox.innerHTML = "";

    quickDefaultName.innerText = config.defaultProfil;

    quickMenuNoOtherShell.classList.add("hide");

    config.shortcut.forEach((el) => {
        if (el.action == config.defaultProfil) {
            quickDefaultShortcut.innerText = el.control;
        } else if (el.action == "Config") {
            quickConfigShortcut.innerText = el.control;
        }
    })

    let count = 0;
    config.profil.forEach((el) => {
        if (el.name != config.defaultProfil) {
            count++;
            let div = document.createElement("div");
            div.classList.add("quick-menu-other-item");
            let img = document.createElement("img");
            img.src = el.icon != "Default" ? el.icon : "../../img/default.png";
            div.appendChild(img)

            div.addEventListener("click", () => {
                CreateNewTerminal(el.programm, el.name, el.icon, undefined, (el.processName != undefined && (el.processName == "true" || el.processName == "false") ? el.processName == "true" : true))
            })

            quickMenuShellBox.appendChild(div);
        } else {
            quickDefaultIcon.src = el.icon != "Default" ? el.icon : "../../img/default.png";
        }
    })

    if (count == 0) {
        quickMenuNoOtherShell.classList.remove("hide");
    }

    switch (true) {
        case (count > 12):
            root.style.setProperty("--col-count", 5);
            break;
        case (count > 6):
            root.style.setProperty("--col-count", 4);
            break;
        default:
            root.style.setProperty("--col-count", 3);
    }
}