const { Terminal } = require('xterm');
const { ipcRenderer : ipc } = require('electron');
const fs = require('fs');

const Color = require('../class/color')

const tabs = document.querySelector('.tabs-tab');
const terminals = document.querySelector('.terminals');
const body = document.body;
const root = document.documentElement;

const test = ["Close"]

let cols;
let rows;
let terminalsList = [];
let n = 0;
let index = 0;

let config;
let colors = {
    terminal : {
        theme : {
            foreground : "#fff",
            background : "#000",
        }
    },
    app : {
        tab_background : "#000",
        tab_foreground : "#aabbcc",
        text_color : "#fff"
    }
}

! function getTheme() {
    try {
        file = fs.readFileSync('config/.config', 'utf-8')
    } catch (error) {
        console.log(error);
        return;
    }

    config = JSON.parse(file)

    try {
        file = fs.readFileSync('config/theme/' + config.theme + '.json', 'utf-8')
    } catch (error) {
        console.log(error)
        return
    }
    
    colors = JSON.parse(file)
}();

const bgColor = new Color(colors.terminal.theme.background, config.transparency_value);
colors.terminal.theme.background = bgColor.rgba

console.log(colors.terminal.theme.background)

if (config.transparency == true) {
    root.style.setProperty('--opacity', config.transparency_value + 0.15)
    root.style.setProperty('--background', colors.terminal.theme.background)
    colors.terminal.theme.background = 'transparent'
}


tabs.style.background = colors?.app?.tab_background
body.style.color = colors?.app?.text_color

CreateNewTerminal(config.shortcut[Object.keys(config.shortcut)[0]])

document.getElementById('new-tab').addEventListener('click', () => {
    CreateNewTerminal(config.shortcut[Object.keys(config.shortcut)[0]])
})

ipc.send('load-end')

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey) {
        for (const [key, value] of Object.entries(config.shortcut)) {
            if (e.key == key) {
                if (test.includes(value)) {
                    window[value + "Term"](n)
                } else {
                    CreateNewTerminal(value)
                }
            }
        }
    }
})

ipc.on('pty-data', (e, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data)
        } 
    })
})


function CreateNewTerminal(toStart) {
    let tab = document.createElement('div')
    tab.style.background = colors.app.tab_foreground
    tab.classList.add('tab', 'tab-all-' + index)

    let tab_link = document.createElement('div')

    tab_link.addEventListener('click', () => {
        focusTerm(tab_link.classList[2], tab)
    })
    tab_link.innerHTML = toStart + " ~ $"
    tab_link.classList.add('tab-link', 'tab-' + index, index)

    let close_button = document.createElement('div')
    close_button.classList.add('close-button')
    close_button.setAttribute('close-button-number', index)
    close_button.innerHTML = "x"

    close_button.addEventListener('click', () => {
        CloseTerm(close_button.getAttribute('close-button-number'))
    })

    let logo = document.createElement('img')
    logo.src = "img/shell.png"
    logo.classList.add('logo')

    tab.appendChild(logo)
    tab.appendChild(tab_link)
    tab.appendChild(close_button)
    tabs.appendChild(tab)

    let termDiv = document.createElement('div')
    termDiv.classList.add('terms', 'terminal-' + index, 'visible')
    termDiv.setAttribute('number', index)


    logo.addEventListener('click', () => {
        focusTerm(tab_link.classList[2], tab)
    })

    tab.addEventListener('animationstart', () => {
        focusTerm(tab_link.classList[2], tab)
    })

    if (!cols) resize()

    let term = new Terminal({
        cols : cols,
        rows : rows,
        theme : colors?.terminal?.theme,
        cursorStyle : config?.terminal?.cursor,
        allowTransparency: config.transparency
    })

    term.open(termDiv)

    term.onData((e) => {
        ipc.send('terminal-data', {
            index : n,
            data : e
        })
    })

    let terms = document.getElementsByClassName('terms')
    let yy = document.getElementsByClassName('tab')

    let i = 0
    while (i < terms.length) {
        let a = terms.item(i)
        let e = yy.item(i)
        e.style.background = colors?.app?.tab_background
        a.classList.add('hidden')
        i++
    }

    ipc.send('new-term', {
        index : index,
        rows : rows,
        cols : cols,
        shell : toStart
    })

    let t = {
        index : index,
        term : term
    }
    n = index
    index++;
    
    terminals.appendChild(termDiv)
    terminalsList.push(t)
}


function focusTerm(index, tab) {
    let terms = document.getElementsByClassName('terms')
    let tabs = document.getElementsByClassName('tab')

    let i = 0
    while (i < terms.length) {
        let a = terms.item(i)
        let r = tabs.item(i)
        a.classList.add('hidden')
        a.classList.remove('visible')
        r.style.background = colors?.app?.tab_background
        i++        
    }

    tab.style.background = colors?.app?.tab_foreground

    let termtoview = document.querySelector('.terminal-' + index)
    termtoview.classList.remove('hidden')
    termtoview.classList.add('visible')
    termtoview.click()

    n = termtoview.getAttribute('number')

    terminalsList.forEach((el) => {
        if (el.index == n) {
            el.term.focus()
        } 
    })
}


ipc.on('resize', () => {
    resize()
})

function resize() {
    rows = parseInt(terminals.clientHeight/ 16.95, 10)
    cols = parseInt(terminals.clientWidth/ 9, 10)

    terminalsList.forEach((el) => {
        el.term.resize(cols, rows)
    })

    ipc.send('resize', {
        cols : cols,
        rows : rows
    })
}

function CloseTerm(index) {
    o = index

    ipc.send('close-terminal', o)

    let te = document.querySelector('.terminal-' + o)
    let ta = document.querySelector('.tab-all-' + o)

    ta.remove()
    te.remove()

    let y = 0

    terminalsList.forEach((el) => {
        if (el.index == o) {
            el.term.dispose()
            terminalsList.splice(y, 1)
        }
        y++
    })

    if (terminalsList.length === 0) {
        ipc.send('close')
    } else if (n == o){
        i = {
            index : 0,
            dif : Infinity
        }
        terminalsList.forEach((el) => {
            if (Math.abs(o - el.index) < i.dif) {
                i.index = el.index
                i.dif = Math.abs(o - el.index)
            }
        })

        let tab = document.querySelector('.tab-all-' + i.index)
        focusTerm(i.index, tab)
    }
}


const target = document.getElementById('test')

target.addEventListener('wheel', event => {
  const toLeft  = event.deltaY < 0 && target.scrollLeft > 0
  const toRight = event.deltaY > 0 && target.scrollLeft < target.scrollWidth - target.clientWidth

  if (toLeft || toRight) {
    event.preventDefault()
    target.scrollLeft += event.deltaY
  }
})