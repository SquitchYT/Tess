const { Terminal } = require('xterm')
const ipc = require('electron').ipcRenderer
const fs = require('fs')
const os = require('os')

const homedir = os.homedir()
const tabs = document.querySelector('.tabs-panel')
const terminals = document.querySelector('.terminals')
const viewport = document.getElementById("terminals")
const body = document.getElementById('body')
const new_tab = document.getElementById('new-tab')

let terminalsList = []
let n = 0

let index = 0


let colors = {
    terminal : {
        foreground : '#fff',
        background : '#000'
    },
    app : {
        tab_background : '#000',
        tab_foreground : '#aabbcc',
        text_color : '#fff'
    }
}

getTheme('tokyo-night')

function getTheme(theme) {
    let file =  fs.readFileSync(homedir + '/.config/tess/theme/' + theme + '.theme', 'utf-8').split('\n').filter(Boolean)

    file.forEach((line) => {
        if (line.startsWith('foreground')) {
            let prop = line.split(': ')
            colors.terminal.foreground = prop[1]
        } else if (line.startsWith('background')) {
            let prop = line.split(': ')
            colors.terminal.background = prop[1]
        } else if (line.startsWith('app-background')) {
            let prop = line.split(': ')
            colors.app.tab_background = prop[1]
        } else if (line.startsWith('app-foreground')) {
            let prop = line.split(': ')
            colors.app.tab_foreground = prop[1]
        } else if (line.startsWith('app-color')) {
            let prop = line.split(': ')
            colors.app.text_color = prop[1]
        }
    })
}

tabs.style.background = colors.app.tab_background
body.style.color = colors.app.text_color
body.style.background = colors.terminal.background

CreateNewTerminal()

ipc.send('load-end')


window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'T'){
        CreateNewTerminal()
    }
})

ipc.on('pty-data', (e, data) => {
    terminalsList.forEach((el) => {
        if (el.index === data.index) {
            el.term.write(data.data)
        } 
    })
})


function CreateNewTerminal() {
    let tab = document.createElement('div')
    tab.style.background = colors.app.tab_foreground
    tab.classList.add('tab', 'tab-all-' + index)

    let tab_link = document.createElement('div')

    tab_link.addEventListener('click', () => {
        focusTerm(tab_link.classList[2], tab)
    })
    tab_link.innerHTML = "Bash ~ $"
    tab_link.classList.add('tab-link', 'tab-' + index, index)

    let close_button = document.createElement('div')
    close_button.classList.add('close-button')
    close_button.setAttribute('close-button-number', index)
    close_button.innerHTML = "x"

    close_button.addEventListener('click', () => {
        o = close_button.getAttribute('close-button-number')

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
    })

    tab.appendChild(tab_link)
    tab.appendChild(close_button)
    tabs.appendChild(tab)

    let termDiv = document.createElement('div')
    termDiv.classList.add('terms', 'terminal-' + index, 'visible')
    termDiv.setAttribute('number', index)

    let height = viewport.clientHeight
    let width = viewport.clientWidth;
    let rows = parseInt(height/16.95, 10);
    let cols = parseInt(width/9, 10);

    let term = new Terminal({
        cols : cols,
        rows : rows,
        theme : colors.terminal
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
        e.style.background = colors.app.tab_background
        a.classList.add('hidden')
        i++
    }

    ipc.send('new-term', {
        index : index,
        rows : rows,
        cols : cols
    })

    n = index

    let t = {
        index : index,
        term : term
    }

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
        r.style.background = colors.app.tab_background
        i++        
    }

    tab.style.background = colors.app.tab_foreground

    let termtoview = document.querySelector('.terminal-' + index)
    termtoview.classList.remove('hidden')
    termtoview.classList.add('visible')

    n = termtoview.getAttribute('number')

    terminalsList.forEach((el) => {
        if (el.index == n) {
            el.term.focus()
        } 
    })
}


new_tab.addEventListener('click', () => {
    CreateNewTerminal()
})

ipc.on('resize', (e, data) => {
    Resize()
})

function Resize() {
    let height = viewport.clientHeight
    let width = viewport.clientWidth;
    let rows = parseInt(height/16.95, 10);
    let cols = parseInt(width/9, 10);

    terminalsList.forEach((el) => {
        el.term.resize(cols, rows)
    })

    console.log('terminal div resized')

    ipc.send('resize', {
        rows : rows,
        cols : cols
    })
}