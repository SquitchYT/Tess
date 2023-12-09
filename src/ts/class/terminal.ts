import { FitAddon } from "xterm-addon-fit";
import { CanvasAddon } from 'xterm-addon-canvas';
import { Terminal as Xterm } from "xterm";
import { invoke } from '@tauri-apps/api/tauri'
import { TerminalOptions, TerminalTheme } from "ts/schema/option";
import { Toaster } from "ts/manager/toast";

export class Terminal {
    id: string;
    term: Xterm;
    fitAddon: FitAddon;
    canvasResizeObserver: ResizeObserver | undefined;
    toaster: Toaster;


    constructor(id: string, options: TerminalOptions, theme: TerminalTheme, customKeyEventHandler: ((e: KeyboardEvent, term: Xterm) => boolean), toaster: Toaster) {
        theme = Object.assign({}, theme);
        theme.background = "rgba(0,0,0,0)";
        
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
                invoke("pty_write", {content: "\x1b[21~", id: id});

                return false;
            } else {
                return customKeyEventHandler(e, this.term);
            }
        })

        this.toaster = toaster;
    }

    async launch(target: HTMLElement, profile_id: string) {
        this.canvasResizeObserver = new ResizeObserver(async () => {
            let proposedDimensions = this.fitAddon.proposeDimensions();
            if (proposedDimensions && !isNaN(proposedDimensions.cols) && !isNaN(proposedDimensions.rows)) {
                this.term.resize(proposedDimensions.cols + 1, proposedDimensions.rows + 1);

                invoke("pty_resize", {cols: this.term.cols, rows: this.term.rows, id: this.id}).catch((err) => {
                    this.toaster.toast("Terminal error", err, "error");
                });
            }
        });

        this.canvasResizeObserver.observe(target);

        await invoke("pty_open", {id: this.id, profileUuid: profile_id});

        this.term.open(target);

        this.term.element!.parentElement!.style.boxSizing = "content-box";

        this.term.loadAddon(new CanvasAddon());
        this.term.loadAddon(this.fitAddon);


        let onRenderDisposable = this.term.onRender(async () => {
            let proposedDimensions = this.fitAddon.proposeDimensions();

            if (proposedDimensions && !isNaN(proposedDimensions.cols) && !isNaN(proposedDimensions.rows)) {
                this.term.resize(proposedDimensions.cols + 1, proposedDimensions.rows + 1);
    
                invoke("pty_resize", {cols: this.term.cols, rows: this.term.rows, id: this.id}).then(() => {
                    onRenderDisposable.dispose()
                }).catch((err) => {
                    this.toaster.toast("Terminal error", err, "error");
                })
            }
        })

        setTimeout(() => {
            this.term.clearTextureAtlas()
        }, 50)
    }

    focus() {
        this.term.focus();
    }

    unfocus() {
        this.term.blur();
    }

    close() {
        this.canvasResizeObserver!.disconnect();
        try { this.term.dispose() } catch (_) {}
    }
}