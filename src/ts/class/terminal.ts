import { FitAddon } from "xterm-addon-fit";
import { CanvasAddon } from 'xterm-addon-canvas';
import { Terminal as Xterm } from "xterm";

import { invoke } from '@tauri-apps/api/tauri'
import { TerminalOptions, TerminalTheme } from "ts/schema/option";

export class Terminal {
    id: string;
    term: Xterm;
    fitAddon: FitAddon

    constructor(id: string, options: TerminalOptions, theme: TerminalTheme) {
        // TODO: Finish
        // TODO: Load all addons

        
        this.id = id;
        this.term = new Xterm({
            allowProposedApi: true,
            fontFamily: "Fira Code, monospace",
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

        addEventListener("resize", () => {
            this.fitAddon.fit();
            invoke("resize_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id}).catch((error) => {
                // TODO: Send notification with error message

                console.error(error);
            });
        })
    }

    async launch(target: HTMLElement, command: string) {
        await invoke("create_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id, command: command})

        this.term.open(target);

        this.term.loadAddon(new CanvasAddon());
        this.term.loadAddon(this.fitAddon);

        this.term.onRender(() => {
            this.fitAddon.fit();
            invoke("resize_terminal", {cols: this.term.cols, rows: this.term.rows, id: this.id});
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