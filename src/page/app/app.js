const { Terminal } = require('xterm');
const { FitAddon } = require("xterm-addon-fit");
const { WebLinksAddon } = require("xterm-addon-web-links")

const fitAddon = new FitAddon();

const { ipcRenderer : ipc, clipboard, shell } = require('electron');

const Color = require('../../../class/color');

const tabs = document.querySelector('.tabs-tab');
const terminals = document.querySelector('.terminals');
const body = document.body;
const root = document.documentElement;
const target = document.getElementById('test');
const osInformations = require('../../../class/osinfo');

const osData = new osInformations();

if (osData.wm != "win" && osData.wm != "macos") {
    let titleBarButton = document.querySelectorAll('.app-button');
    titleBarButton.forEach(element => {
        element.remove();
    });
} else {
    document.getElementById('close').addEventListener('click', () => {
        ipc.send('close');
    });
    document.getElementById('reduce').addEventListener('click', () => {
        ipc.send('reduce');
    })
    document.getElementById('screen-size').addEventListener('click', () => {
        ipc.send('to-define-name');
    })
}

const shortcutAction = ["Close", "Copy", "Paste", "OpenShell"];
const CustomPage = ["Config"]

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
let minIndex = 1;

ipc.on("shortcutStateUpdate", (e, state) => {
    canShortcut = state;
})


ipc.on('pty-data', (e, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data);
            let tab = document.querySelector(".tab-" + data.index);
            let process = data.processName.split("/");
            tab.innerHTML = process[process.length - 1][0].toUpperCase() + process[process.length - 1].slice(1);
        } 
    })
})

ipc.on('loaded', (e, data) => {
    config = data.config;
    colors = data.colors;

    HandleShortcut();

    fontSize = (config.terminalFontSize != undefined) ? config.terminalFontSize : 14;
    const bgColor = new Color(colors.terminal.theme.background, config.transparencyValue / 100);

    let needTransparent = (config.background == "transparent" || config.background == "acrylic" || config.background == "blurbehind") ? true : false;
    console.log(needTransparent);
    if (needTransparent) {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty('--opacity', (config.transparencyValue / 100) + 0.21);
        root.style.setProperty('--background', colors.terminal.theme.background);
        colors.terminal.theme.background = 'transparent';
    } else if (config.background == "image") {
        colors.terminal.theme.background = bgColor.rgba;
        root.style.setProperty('--opacity', (config.transparencyValue / 100) + 0.21);
        root.style.setProperty('--background-image', 'url(' + config.imageLink + ')');
        root.style.setProperty('--background', colors.terminal.theme.background);
        root.style.setProperty('--blur', 'blur(' + config.imageBlur +'px)');
        colors.terminal.theme.background = 'transparent';
    } else {
        root.style.setProperty('--background', colors.terminal.theme.background);
    }

    colors.terminal.theme.background = "transparent"

    root.style.setProperty("--tab-panel-background", colors.app.topBar);
    root.style.setProperty("--tab-active-background", colors.app.tabActive);
    root.style.setProperty("--tab-inactive-background", colors.app.tabInactive)
    root.style.setProperty("--tab-text-color", colors.app.textColor)
    root.style.setProperty("--tab-text-size", colors?.app?.text?.size ? colors?.app?.tab?.text?.size + "px ": "12px")
    root.style.setProperty("--general-text-color", colors.app.textColor)
    root.style.setProperty('--tab-hover', colors.app.backgroundHover);

    body.style.color = colors.app.textColor;

    config.profil.forEach((el) => {
        if (el.name == config.defaultProfil) {
            CreateNewTerminal(el.programm, el.name, el.icon);
            document.getElementById('new-tab').addEventListener('click', () => {
                openDefaultProfil();
            })
        }
    })

    ipc.send('load-end');
})

function HandleShortcut() {
    shortcut = [];

    config.shortcut.forEach((el) => {
        let newShortcut= {
            ctrl : false,
            shift : false,
            alt: false,
            key : el.control.slice(-1).toUpperCase(),
            action : el.action
        }

        if (el.control.includes("CTRL")) {
            newShortcut.ctrl = true;
        } if (el.control.includes("ALT")) {
            newShortcut.alt = true;
        } if (el.control.includes("SHIFT")) {
            newShortcut.shift = true;
        }

        shortcut.push(newShortcut);
    })
}

function CreateNewTerminal(toStart, name, icon) {
    let tab = document.createElement('div');
    tab.classList.add('tab', 'tab-all-' + index, "tab-active");
    tab.setAttribute("index", index + 1)
    tab.style.order = index + 1;

    maxIndex = index;

    let tab_link = document.createElement('div');

    /**********************
    **** mouseUp event ****
    **********************/
    tab_link.addEventListener('mouseup', (e) => {
        changeTabOrder(tab, tab_link);
    })
    tab.addEventListener("mouseup", () => {
        changeTabOrder(tab, tab_link);
    })
    tab_link.addEventListener("click", () => {
        changeTabOrder(tab, tab_link);
    })
    document.addEventListener("mouseup", () => {
        changeTabOrder(tab, tab_link);
    })

    tab_link.addEventListener("mousedown", (e) => {
        tab.setAttribute("mousedown", "true")
        tab.setAttribute("startDragX", `${e.clientX}`);
        tab.setAttribute("dragged", "false");
        tabOrderToAdd = 0;
        focusTerm(tab_link.classList[2], tab);
    })
    tab.addEventListener("mousedown", (e) => {
        tab.setAttribute("mousedown", "true")
        tab.setAttribute("startDragX", `${e.clientX}`);
        tab.setAttribute("dragged", "false");
        tabOrderToAdd = 0;
        focusTerm(tab_link.classList[2], tab);
    })

    document.addEventListener("mousemove", (e) => {
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
    })

    tab_link.innerHTML = name;
    tab_link.classList.add('tab-link', 'tab-' + index, index);

    let close_button = document.createElement('div');
    close_button.classList.add('close-button');
    close_button.setAttribute('close-button-number', index);

    close_button.innerHTML = `
        <svg viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
    `

    let logo = document.createElement('img');
    logo.src = (icon) ? icon : "../../img/shell.png";
    logo.classList.add('logo');

    tab.appendChild(logo);
    tab.appendChild(tab_link);
    tab.appendChild(close_button);
    tabs.appendChild(tab);

    let termDiv = document.createElement('div');
    termDiv.classList.add('terms', 'terminal-' + index, 'visible');
    termDiv.setAttribute('number', index);

    logo.addEventListener('click', () => {
        focusTerm(tab_link.classList[2], tab);
    })

    tab.addEventListener('animationstart', () => {
        focusTerm(tab_link.classList[2], tab);
    })

    let t;
    if (CustomPage.includes(toStart)) {
        let page = document.createElement("iframe");
        page.setAttribute("src", "../config/config.html")
        page.setAttribute("nodeintegration", "")
        termDiv.appendChild(page)

        page.classList.add("iframe");

        page.addEventListener("load", () => {
            let iFrameWindow = page.contentWindow;
            iFrameWindow.addEventListener("keydown", (e) => {
                setTimeout(() => {
                    if (canShortcut) {
                        ExecuteShortcut(e);
                    }
                }, 100)
            })
        })

        page.focus()

        t = {
            index: index,
            term: page,
            type: "Page"
        }
    } else {
        if (!cols) resize();

        let term = new Terminal({
            cols: cols + 1,
            rows: rows,
            theme: colors.terminal.theme,
            cursorStyle: config.cursorStyle,
            allowTransparency: true,
            fontSize: fontSize,
            cursorBlink: (config.cursorBlink == "true")
        });
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon(("click", (e, url) => {
            shell.openExternal(url)
        })));
        term.open(termDiv);

        fitAddon.fit();

        term.attachCustomKeyEventHandler((e) => {
            let o = ExecuteShortcut(e);
            return (o == undefined) ? false : o
        })

        term.onData((e) => {
            ipc.send('terminal-data', {
                index: n,
                data: e
            });
        })

        let terms = document.getElementsByClassName('terms');
        let yy = document.getElementsByClassName('tab');

        let i = 0
        while (i < terms.length) {
            let a = terms.item(i);
            let e = yy.item(i);
            e.style.background = colors?.app?.tab_background;
            a.classList.add('hidden');
            i++;
        }

        ipc.send('new-term', {
            index: index,
            rows: rows,
            cols: cols,
            shell: toStart
        });

        t = {
            index: index,
            term: term,
            type: "Terminal"
        };
    }

    close_button.addEventListener('click', (e) => {
        if (t.type == "Page") {
            Close(close_button.getAttribute("close-button-number"));
        } else {
            ipc.send('close-terminal', close_button.getAttribute("close-button-number"));
        }

        let tabs = document.querySelectorAll(".tab");
        let indexList = [];
        tabs.forEach((el) => {
            indexList.push(Number(el.getAttribute("index")));
        })

        maxIndex = Math.max(...indexList);
        minIndex = Math.min(...indexList);
    })
    
    n = index;
    index++;
    
    terminals.appendChild(termDiv);
    terminalsList.push(t);
}


function focusTerm(index, tab) {
    let terms = document.getElementsByClassName('terms');
    let tabs = document.getElementsByClassName('tab');

    let i = 0;
    while (i < terms.length) {
        let a = terms.item(i);
        let r = tabs.item(i);
        a.classList.add('hidden');
        a.classList.remove('visible');

        r.classList.remove("tab-active")
        r.classList.add("tab-inactive")
        i++;  
    }

    tab.classList.remove("tab-inactive")
    tab.classList.add("tab-active")

    let termToView = document.querySelector('.terminal-' + index);
    termToView.classList.remove('hidden');
    termToView.classList.add('visible');

    n = index;
    setTimeout(() => {
        termToView.click();
        terminalsList.forEach((el) => {
            if (el.index == index) {
                el.term.focus();
            } 
        })
    }, 50);
}

function resize() {
    rows = 64;
    cols = 64;

    terminalsList.forEach((el) => {
        try {
            fitAddon.fit();
            rows = fitAddon.proposeDimensions().rows
            cols = fitAddon.proposeDimensions().cols

            el.term.resize(cols + 1, rows)
        } catch (err) {
            console.log(err);
        }
    })

    ipc.send('resize', {
        cols: cols + 1,
        rows: rows
    });
}

function Close(index) {
    let te = document.querySelector('.terminal-' + index);
    let ta = document.querySelector('.tab-all-' + index);
    try {
        ta.remove();
        te.remove();   
    } catch (_) {
        
    }

    let y = 0;
    terminalsList.forEach((el) => {
        if (el.index == index) {
            if (el.type == "Terminal") {
                el.term.dispose();
            }
            terminalsList.splice(y, 1);
        }
        y++
    })

    if (terminalsList.length === 0) {
        ipc.send('close');
    } else if (n == index){
        i = {
            index: 0,
            dif: Infinity
        }
        terminalsList.forEach((el) => {
            if (Math.abs(index - el.index) < i.dif) {
                i.index = el.index;
                i.dif = Math.abs(index - el.index);
            }
        })

        let tab = document.querySelector('.tab-all-' + i.index);
        focusTerm(i.index, tab);
    }

    return false;
}

target.addEventListener('wheel', event => {
    const toLeft  = event.deltaY < 0 && target.scrollLeft > 0;
    const toRight = event.deltaY > 0 && target.scrollLeft < target.scrollWidth - target.clientWidth;

    if (toLeft || toRight) {
        event.preventDefault();
        target.scrollLeft += event.deltaY;
    }
})

function ExecuteShortcut(e) {
    let result = true;
    let dos = false; // replace that by a 'Do' variable name
    shortcut.forEach((el) => {
        if (e.ctrlKey == el.ctrl && e.shiftKey == el.shift && e.altKey == el.alt && e.key.toUpperCase() == el.key && e.type == "keydown" && !dos) {
            dos = true;
            if (shortcutAction.includes(el.action)) {
                result = window[el.action](n);
            } else {
                if (CustomPage.includes(el.action)) {
                    CreateNewTerminal(el.action, el.action);
                    result = false;
                } else {
                    config.profil.forEach((profil) => {
                        if (profil.name == el.action) {
                            CreateNewTerminal(profil.programm, profil.name, profil.icon);
                            result = false;
                        }
                    }) 
                }
            }
        }
    })
    return result;
}

function Paste() {
    terminalsList.forEach((el) => {
        if (el.index == n) {
            ipc.send('terminal-data', {
                index: n,
                data: clipboard.readFindText()
            });
        }
    })
    return false;
}

function Copy() {
    let result = true;
    terminalsList.forEach((el) => {
        if (el.index == n && el.term.getSelection() != "") {
            clipboard.writeText(el.term.getSelection());
            result = false;
        }
    })
    return result;
}

setTimeout(() => {
    resize();
}, 150);

ipc.on("newConfig", (e, data) => {
    config = data.config;
    colors =  JSON.parse(JSON.stringify(data.color));
    HandleShortcut();

    if (config.background == "full" && getComputedStyle(document.documentElement).getPropertyValue("--opacity") == 1 && getComputedStyle(document.documentElement).getPropertyValue("--background-image").startsWith("url") == false) {
        root.style.setProperty('--background', colors.terminal.theme.background);
    }

    colors.terminal.theme.background = "transparent"
    root.style.setProperty("--tab-panel-background", colors.app.topBar);
    root.style.setProperty("--tab-active-background", colors.app.tabActive);
    root.style.setProperty("--tab-inactive-background", colors.app.tabInactive)
    root.style.setProperty("--tab-text-color", colors.app.textColor)
    root.style.setProperty("--tab-text-size", (colors?.app?.text?.size) ? colors?.app?.tab?.text?.size + "px ": "12px")
    root.style.setProperty("--general-text-colo)r", colors.app.textColor)
    root.style.setProperty('--tab-hover', colors.app.backgroundHover);
    
    body.style.color = colors.app.textColor;
    fontSize = (config?.terminalFontSize) ? config.terminalFontSize : 14;
    updateTerminalApparence();
})

ipc.on('resize', () => {
    resize();
})

function changeTabOrder(tab, tab_link) {
    tab.setAttribute("mousedown", "false")
    tab_link.setAttribute("mousedown", "false")
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
    
                tab.setAttribute("index", nextTab.getAttribute("index"))
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) - 1);
    
                allTab.forEach((el) => {
                    el.style.order = el.getAttribute("index");
                })
            }
        } else {
            for (let index = tabOrderToAdd; index != 0; index++) {
                let nextTab = null;
                let i = 1;

                while (nextTab == null) {
                    console.log(i)
                    nextTab = document.querySelector(".tab[index='" + Number(Number(tab.getAttribute("index")) - i) + "']");
                    i++;
                    console.log(nextTab);
                }

                let allTab = document.querySelectorAll(".tab");
    
                tab.setAttribute("index", nextTab.getAttribute("index"))
                nextTab.setAttribute("index", Number(tab.getAttribute("index")) + 1);
    
                allTab.forEach((el) => {
                    el.style.order = el.getAttribute("index");
                })
            }
        }
    }
    tabOrderToAdd = 0;
}

ipc.on("close-tab", (e, data) => {
    Close(data.index);
})

function openDefaultProfil() {
    config.profil.forEach((el) => {
        if (el.name == config.defaultProfil) {
            CreateNewTerminal(el.programm, el.name, el.icon);
        }
    })
}
function updateTerminalApparence() {
    terminalsList.forEach((el) => {
        if (el.type == "Terminal") {
            el.term.setOption("theme", colors.terminal.theme);
            el.term.setOption("fontSize", config.terminalFontSize);
            el.term.setOption("cursorBlink", config.cursorBlink);
            el.term.setOption("cursorStyle", config.cursorStyle);
        }
    })

    resize();
}