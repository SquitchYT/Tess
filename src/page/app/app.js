const { Terminal } = require('xterm');
const { ipcRenderer : ipc, clipboard } = require('electron');

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

const shortcutAction = ["Close", "Copy", "Paste"];
const CustomPage = ["Config"]

let cols;
let rows;
let terminalsList = [];
let n = 0;
let index = 0;

let config;
let colors;

let shortcut = [];

let underAction = false;


ipc.on('pty-data', (e, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data);
        } 
    })
})

ipc.on('loaded', (e, data) => {
    config = data.config;
    colors = data.colors;

    HandleShortcut();

    const bgColor = new Color(colors?.terminal?.theme?.background, config?.transparency_value / 100);

    if (config.background == "transparent") {
        colors.terminal.theme.background = bgColor?.rgba;
        root.style.setProperty('--opacity', (config?.transparency_value / 100) + 0.21);
        root.style.setProperty('--background', colors?.terminal?.theme?.background);
        colors.terminal.theme.background = 'transparent';
    } else if (config.background == "image") {
        colors.terminal.theme.background = bgColor?.rgba;
        root.style.setProperty('--opacity', (config?.transparency_value / 100) + 0.21);
        root.style.setProperty('--background-image', 'url(' + config?.imageLink + ')');
        root.style.setProperty('--background', colors?.terminal?.theme?.background);
        root.style.setProperty('--blur', 'blur(' + config?.image_blur +'px)');
        colors.terminal.theme.background = 'transparent';
    } else {
        root.style.setProperty('--background', colors?.terminal?.theme?.background);
    }

    /***  NEW THEME OPTIONS SETUPER ***/

    colors.terminal.theme.background = "transparent"

    root.style.setProperty("--tab-panel-background", colors?.app?.tab?.panel?.background);
    root.style.setProperty("--tab-active-background", colors?.app?.tab?.active?.background);
    root.style.setProperty("--tab-inactive-background", colors?.app?.tab?.inactive?.background)
    root.style.setProperty("--tab-text-color", colors?.app?.tab?.text?.color)
    root.style.setProperty("--tab-text-size", colors?.app?.tab?.text?.size + "px")

    root.style.setProperty("--general-text-color", colors?.app?.general?.text_color)

    /***  END THEME OPTIONS SETUPER NEW ***/

    root.style.setProperty('--background-no-opacity', colors?.app?.tab_background);
    body.style.color = colors?.app?.text_color;

    CreateNewTerminal(config.shortcut[Object.keys(config.shortcut)[0]]);

    document.getElementById('new-tab').addEventListener('click', () => {
        CreateNewTerminal(config.shortcut[Object.keys(config.shortcut)[0]]);
    })

    ipc.send('load-end');

    //CreateNewTerminal("Config");
})

function HandleShortcut() {
    for (const [key, value] of Object.entries(config.shortcut)) {
        let newShortcut= {
            ctrl : false,
            shift : false,
            key : key.slice(-1).toUpperCase(),
            action : value
        }

        if (key.includes("CTRL")) {
            newShortcut.ctrl = true;
        }
        if (key.includes("MAJ")) {
            newShortcut.shift = true;
        }

        shortcut.push(newShortcut);
    }
}

ipc.on('resize', () => {
    resize();
})


function CreateNewTerminal(toStart) {
    let tab = document.createElement('div');
    tab.classList.add('tab', 'tab-all-' + index, "tab-active");

    let tab_link = document.createElement('div');

    tab_link.addEventListener('click', () => {
        focusTerm(tab_link.classList[2], tab);
    })
    tab_link.innerHTML = toStart + " ~ $";
    tab_link.classList.add('tab-link', 'tab-' + index, index);

    let close_button = document.createElement('div');
    close_button.classList.add('close-button');
    close_button.setAttribute('close-button-number', index);
    close_button.innerHTML = "x";

    close_button.addEventListener('click', () => {
        CloseTerm(close_button.getAttribute('close-button-number'));
    })

    let logo = document.createElement('img');
    logo.src = "../../img/shell.png";
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
                ExecuteShortcut(e);
            })
        })

        page.focus()

        t = {
            index: index,
            term: page,
            type: "Page"
        };

    } else {
        if (!cols) resize();

        let term = new Terminal({
            cols: cols,
            rows: rows,
            theme: colors?.terminal?.theme,
            cursorStyle: config.cursorStyle,
            allowTransparency: true
        });

        term.open(termDiv);

        term.attachCustomKeyEventHandler((e) => {
            let o = ExecuteShortcut(e);
            if (o == undefined) {
                return false;
            }
            return o;
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

    let termtoview = document.querySelector('.terminal-' + index);
    termtoview.classList.remove('hidden');
    termtoview.classList.add('visible');
    termtoview.click();

    n = termtoview.getAttribute('number');

    terminalsList.forEach((el) => {
        if (el.index == n) {
            el.term.focus();
        } 
    })
}

function resize() {
    rows = parseInt(terminals.clientHeight/ 16.95, 10);
    cols = parseInt(terminals.clientWidth/ 9, 10);

    terminalsList.forEach((el) => {
        try {
            el.term.resize(cols, rows);
        } catch (err) {
            console.log(err)
        }
    })

    ipc.send('resize', {
        cols: cols,
        rows: rows
    });
}

function CloseTerm(index) {
    ipc.send('close-terminal', index);

    let te = document.querySelector('.terminal-' + index);
    let ta = document.querySelector('.tab-all-' + index);

    ta.remove();
    te.remove();

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
    let dos = false;
    shortcut.forEach((el) => {
        if (e.ctrlKey == el.ctrl && e.shiftKey == el.shift && e.key.toUpperCase() == el.key && e.type == "keydown" && !dos) {
            dos = true;
            if (shortcutAction.includes(el.action)) {
                result = window[el.action + "Term"](n);
            } else {
                CreateNewTerminal(el.action);
                result = false;
            }
        }
    })
    return result;
}

function PasteTerm() {
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

function CopyTerm() {
    let result = true;
    terminalsList.forEach((el) => {
        if (el.index == n && el.term.getSelection() != "") {
            clipboard.writeText(el.term.getSelection());
            result = false;
        }
    })
    return result;
}