import { FitAddon } from "xterm-addon-fit";
import { CanvasAddon } from 'xterm-addon-canvas';
import { Terminal as Xterm } from "xterm";

import { invoke } from '@tauri-apps/api/tauri'

export class Terminal {
    id: string;
    term: Xterm;
    fitAddon: FitAddon

    constructor(id: string) {
        // TODO: Finish
        // TODO: Load all addons
        
        this.id = id;
        this.term = new Xterm({
            allowProposedApi: true,
            fontFamily: "Fira Code",
            fontSize: 15,
            theme: {
                "foreground": "rgb(222, 234, 248)",
                "background": "#141a29",
                "black": "#22303f",
                "red": "#ef3134",
                "green": "#2df4b7",
                "yellow": "#ffc738",
                "blue": "#156ce6",
                "magenta": "#ff5cb8",
                "cyan": "#01defe",
                "white": "#9aa5ce",
                "brightBlack": "#2b3d50",
                "brightRed": "#f1494b",
                "brightGreen": "#76f8d0",
                "brightYellow": "#ffce52",
                "brightBlue": "#297aeb",
                "brightMagenta": "#ff76c3",
                "brightCyan": "#4de8fe",
                "brightWhite": "#abb4d6"
            }
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