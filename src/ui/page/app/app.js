const { Terminal } = require("xterm");
const { FitAddon } = require("xterm-addon-fit");
const { WebLinksAddon } = require("xterm-addon-web-links");
const { LigaturesAddon } = require("xterm-addon-ligatures");

const { ipcRenderer : ipc, clipboard, shell } = require("electron");

const Color = require("../../../utils/color");

document.querySelector(".tabs").addEventListener("dblclick", () => { // TODO: Fix dbclick not trigerred when `webkit-app-region: drag` is set in css in windows
    if (osData.os == "win32") {
        ipc.send("reduce-expand");
    }
});

const tabs = document.querySelector(".tabs-tab");
const terminals = document.querySelector(".terminals");
const body = document.body;
const root = document.documentElement;
const osInformations = require("../../../utils/osinfo");
const osData = new osInformations();

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
    CreateNewTerminal("Config", "Config", "../../../ressources/img/gear.svg");
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

const shortcutAction = ["Close", "Copy", "Paste", "OpenShell"];
const CustomPage = [
    {
        name: "Config",
        onePage: true,
        icon: "../../../ressources/img/gear.svg"
    }
];

let cols;
let rows;
let terminalsList = [];
let [n, index, tabOrderToAdd] = [0, 0, 0]
let config;
let colors;

let fontSize;
let shortcut = [];
let canShortcut = true;

let maxIndex = 1;

ipc.on("shortcutStateUpdate", (_, state) => {
    canShortcut = state;
});

ipc.on("pty-data", (_, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data);
            let tab = document.querySelector(".tab-" + data.index);
            if (data.processName != "" && !tab.hasAttribute("profil-named")) {
                let process = data.processName.split("/");
                tab.textContent = process[process.length - 1][0].toUpperCase() + process[process.length - 1].slice(1);
            }

            let terminalBuffer = el.term.buffer.active;
            if (terminalBuffer.type != "normal") {
                return;
            }

            let bufferString = "";
            for (let index = 0; index < el.term.rows; index++) {
                bufferString += terminalBuffer.getLine(terminalBuffer.viewportY + index)?.translateToString();
            }
            
            let progress_value = bufferString.match(/\s\d+%/g)?.pop();
            tab = document.querySelector(".tab-all-" + data.index);      
            let tabProgressBar =  document.querySelector(".progress-tab-" + data.index);
            if (progress_value && progress_value.trim() != "100%") {
                tab.classList.add("in-progress");
                tabProgressBar.classList.add("progress");
                tabProgressBar.style.background = `linear-gradient(to right, var(--general-text-color) ${progress_value.trim()}, var(--tab-inactive-background) ${progress_value.trim()})`;
            } else {
                tab.classList.remove("in-progress");
                tabProgressBar.classList.remove("progress");
            }
        } 
    });
});

ipc.on("rename-tab", (_, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            let tab = document.querySelector(".tab-" + data.index);
            if (!tab.hasAttribute("profil-named")) {
                tab.textContent = data.name.split(".exe")[0][0].toUpperCase() + data.name.split(".exe")[0].slice(1);
            }
        } 
    });
});

ipc.on("loaded", (_, data) => {
    if (osData.os != "win32" && osData.supportCustomTitleBar) {
        setTimeout(() => {
            let rightButtons = document.getElementById("titlebar-button-right");
            let leftButtons = document.getElementById("titlebar-button-left");            
            let buttonOrder = osData.titleBarButtonOrder;

            for (let index = 0; index < buttonOrder.length; index+=2) {
                let el = buttonOrder[index] == "r" ? rightButtons : leftButtons;
                el.style.paddingRight = "5px";
                switch (buttonOrder[index+1]) {
                    case "c":
                        el.appendChild(osData.closeTitleBarButton);
                        break;
                    case "m":
                        el.appendChild(osData.expandTitleBarButton);
                        break;
                    case "r":
                        el.appendChild(osData.minimizeTitleBarButton);
                        break;
                }
            }

            rightButtons.classList.add("no-drag");
            leftButtons.classList.add("no-drag");
        }, 0)
    } else if (osData.os == "win32") { document.getElementById("titlebar-button-right").style.width = "260px"; }

    config = data.config;
    colors = data.colors;
    previousBackgroundStyle = config.background;

    HandleShortcut();

    fontSize = (config.terminalFontSize != undefined) ? config.terminalFontSize : 14;
    const bgColor = new Color(colors.terminal.theme.background, config.transparencyValue / 100);

    let needTransparent = (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind");
    if (needTransparent) {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty("--opacity", (config.transparencyValue / 100) + 0.21);
        root.style.setProperty("--background", colors.terminal.theme.background);
    } else if (config.background == "image") {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty("--opacity", (config.transparencyValue / 100) + 0.21);
        root.style.setProperty("--background-image", 'url("' + config.imageLink + '")');
        root.style.setProperty("--background", colors.terminal.theme.background);
        root.style.setProperty("--blur", "blur(" + config.imageBlur +"px)");
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

    openNewPage(data.loadOptions);

    document.getElementById("new-tab").addEventListener("click", () => {
        openDefaultProfil();
    });

    updateQuickMenu();

    ipc.send("load-end");
});

function HandleShortcut() {
    shortcut = [];

    config.shortcut.forEach((el) => {
        shortcut.push({
            ctrl : el.control.includes("CTRL"),
            shift : el.control.includes("SHIFT"),
            alt: el.control.includes("ALT"),
            key : el.control.slice(-1).toUpperCase(),
            action : el.action
        });
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
                let tab = document.querySelector(".tab-all-" + el.index);
                focusTerm(el.index, tab);
            }
        })

        closeQuickAccessMenu();
        return;
    }

    closeQuickAccessMenu();

    if (!icon) { icon = "Default"; }

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
    let progress_bar = document.createElement("div");
    progress_bar.classList.add("progress-tab-" + index);
    tab.appendChild(progress_bar);

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

    tab_link.textContent = name;
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
    logo.src = (icon != "Default") ? icon : "../../../ressources/img/default.png";
    logo.classList.add("logo");

    tab.append(logo, tab_link, close_button)
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
        page.classList.add("iframe");
        termDiv.appendChild(page);

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
            fontFamily: (config?.terminalFonts) ? config?.terminalFonts : "Consolas, courier-new, courier, monospace",
            rendererType: config?.experimentalRendererType ? config.experimentalRendererType : "canvas",
            scrollback: config.bufferSize
        });
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon(("click", (_, url) => {
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

        termDiv.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();

            ipc.send("terminal-data", {
                index: n,
                data: event.dataTransfer.files[0].path
            })
        });
        termDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
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
        let current_terms = terms.item(i);
        let current_tabs = tabs.item(i);
        current_terms.classList.add("hidden");
        current_terms.classList.remove("visible");

        current_tabs.classList.remove("tab-active");
        current_tabs.classList.add("tab-inactive");
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
    }, 20);
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
                ipc.send("debug", err)
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
    try {
        document.querySelector(".tab-all-" + index).remove();
        document.querySelector(".terminal-" + index).remove();   
    } catch (err) {
        ipc.send("debug", err)
    }

    let y = 0;
    try {
        terminalsList.forEach((el) => {
            y++;
            if (el.index == index) {
                if (el.type == "Terminal") {
                    el.term.dispose();
                }
                terminalsList.splice(y - 1, 1);
            }
        });
    
        return false;
    } catch (_) {
        ipc.send("debug", "Something go wrong when closing a TAB. Please report this on the github page. " + _);
        terminalsList.splice(y - 1, 1);
    } finally {
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
            focusTerm(i.index, document.querySelector(".tab-all-" + i.index));
        } else {
            focusTerm(n, document.querySelector(".tab-all-" + n));
        }
    }
}

tabs.addEventListener("wheel", event => {
    event.preventDefault();
    tabs.scrollLeft += event.deltaY;
});

function ExecuteShortcut(e) {
    let result = true;
    let shortcut_executed = false;
    shortcut.forEach((el) => {
        if (e.ctrlKey == el.ctrl && e.shiftKey == el.shift && e.altKey == el.alt && e.key.toUpperCase() == el.key && e.type == "keydown" && !shortcut_executed) {
            shortcut_executed = true;
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

ipc.on("newConfig", (_, data) => {
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

ipc.on("resize", resize);

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

                tab.setAttribute("index", nextTab.getAttribute("index"));
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) - 1);

                let allTab = document.querySelectorAll(".tab");
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
    
                tab.setAttribute("index", nextTab.getAttribute("index"));
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) + 1);
                
                let allTab = document.querySelectorAll(".tab");
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
                el.term.loadAddon(el.ligatureAddon);
            } else {
                el.ligatureAddon.dispose();
            }

            el.term.setOption("theme", colors.terminal.theme);
            el.term.setOption("fontSize", config.terminalFontSize);
            el.term.setOption("cursorStyle", config.cursorStyle);
            el.term.setOption("cursorBlink", (config.cursorBlink == "true"));
            el.term.setOption("fontFamily", config.terminalFonts);
            el.term.setOption("scrollback", config.bufferSize);
        }
    });

    resize();
}

ipc.on("openNewPage", (_, data) => {
    openNewPage(JSON.parse(data));
})

function openNewPage(data) {
    let inCustomPage = false;
    if (data.page) {
        CustomPage.forEach((el) => {
            if (el.name == data.page) { inCustomPage = true; }
        })
    }

    if (inCustomPage) {
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
    let finded = false;
    CustomPage.forEach((el) => {
        if (pageName == el.name) { finded = true; }
    })
    return finded;
}

function onlyOnePage(pageName) {
    let onePage = false;
    CustomPage.forEach((el) => {
        if (pageName == el.name) { onePage = el.onePage == true; }
    })

    return onePage;
}

function checkIfPageAlreadyOpened(pageName) {
    let finded = false;
    terminalsList.forEach((el) => {
        if (el?.customPage == pageName) { finded = true; }
    })
    return finded;
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
            img.src = el.icon != "Default" ? el.icon : "../../../ressources/img/default.png";
            div.appendChild(img)

            div.addEventListener("click", () => {
                CreateNewTerminal(el.programm, el.name, el.icon, undefined, (el.processName != undefined && (el.processName == "true" || el.processName == "false") ? el.processName == "true" : true))
            })

            quickMenuShellBox.appendChild(div);
        } else {
            quickDefaultIcon.src = el.icon != "Default" ? el.icon : "../../../ressources/img/default.png";
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