import { FitAddon } from "xterm-addon-fit";
import { CanvasAddon } from 'xterm-addon-canvas';
import { Terminal as Xterm } from "xterm";

import { invoke } from '@tauri-apps/api/tauri'
import { TerminalOptions, TerminalTheme } from "ts/schema/option";

export class Terminal {
    id: string;
    term: Xterm;
    fitAddon: FitAddon;


    constructor(id: string, options: TerminalOptions, theme: TerminalTheme, customKeyEventHandler: ((e: KeyboardEvent, term: Xterm) => boolean)) {
        // TODO: Finish
        // TODO: Load all addons

        theme = Object.assign({}, theme);
        theme.background = "transparent";
        
        this.id = id;
        this.term = new Xterm({
            allowProposedApi: true,
            fontFamily: "Fira Code, monospace",
            allowTransparency: true,
            fontSize: options.fontSize,
            drawBoldTextInBrightColors: options.drawBoldInBright,
            cursorBlink: options.cursorBlink,
            scrollback: options.bufferSize,
            lineHeight: options.lineHeight / 100,
            cursorStyle: options.cursor,
            letterSpacing: options.letterSpacing,
            fontWeight: options.fontWeight * 100,
            fontWeightBold: options.fontWeightBold * 100,
            theme: theme
        })

        this.fitAddon = new FitAddon();

        this.term.attachCustomKeyEventHandler((e) => {
            if (e.key == "F10") {
                invoke("terminal_input", {content: "\x1b[21~", id: id});

                return false
            } else {
                return customKeyEventHandler(e, this.term)
            }
        })
    }

    async launch(target: HTMLElement, profile_id: string) {
        target.addEventListener("resize", () => {
            this.fitAddon.fit();
            invoke("resize_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id}).catch((error) => {
                // TODO: Send notification with error message

                console.error(error);
            });
        })

        await invoke("create_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id, profileUuid: profile_id})

        this.term.open(target);

        this.term.loadAddon(new CanvasAddon());
        this.term.loadAddon(this.fitAddon);

        this.term.onRender(() => {
            this.fitAddon.fit();
            invoke("resize_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id});
            this.term.write("\0");
        })
    }

    focus() {
        this.term.focus();
    }

    unfocus() {
        this.term.blur();
    }

    close() {
        this.term.dispose()
    }
}