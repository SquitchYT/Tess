import { FitAddon } from "xterm-addon-fit";
import { CanvasAddon } from 'xterm-addon-canvas';
import { Terminal as Xterm } from "xterm";
import { invoke } from '@tauri-apps/api/tauri'
import { TerminalOptions, TerminalTheme } from "ts/schema/option";
import { Toaster } from "ts/manager/toast";
import { terminalDataPayload, terminalProgressUpdatedPayload } from "ts/schema/term";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

export class Terminal {
    id: string;
    term: Xterm;
    fitAddon: FitAddon;
    canvasResizeObserver: ResizeObserver | undefined;
    toaster: Toaster;
    unlisten: UnlistenFn | undefined = undefined;
    disposeContentUpdate: UnlistenFn | undefined = undefined;
    disposeProgressTracker: UnlistenFn | undefined = undefined;


    constructor(id: string, options: TerminalOptions, theme: TerminalTheme, customKeyEventHandler: ((e: KeyboardEvent, term: Xterm) => boolean), toaster: Toaster, onNewDisplayedDataReceived: (() => void), onProgressUpdate: ((progress: number) => void)) {
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

        let bufferedBytes = 0;
        let paused = false;
        listen<terminalDataPayload>("js_pty_data", ((e) => {
            if (e.payload.id == this.id) {
                bufferedBytes += e.payload.data.length;

                this.term.write(e.payload.data, () => {
                    bufferedBytes = Math.max(bufferedBytes - e.payload.data.length, 0);
                    if (bufferedBytes < 2048 && paused) {
                        invoke("pty_resume", {id: id});
                        paused = false;
                    }
                })

                if (bufferedBytes > 65536 && !paused) {
                    invoke("pty_pause", {id: id});
                    paused = true;
                  }
            }
        })).then((unlisten) => {
            this.unlisten = unlisten;
        })

        listen<string>("js_pty_display_content_update", ((e) => {
            if (e.payload == this.id && options.showUnreadDataMark) {
                onNewDisplayedDataReceived();
            }
        })).then((disposeContentUpdate) => {
            this.disposeContentUpdate = disposeContentUpdate;
        })

        listen<terminalProgressUpdatedPayload>("js_pty_progress_update", ((e) => {
            if (e.payload.id == this.id) {
                onProgressUpdate(e.payload.progress);
            }
        })).then((disposeProgressTracker) => {
            this.disposeProgressTracker = disposeProgressTracker;
        })
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
        this.unlisten!();
        this.disposeContentUpdate!();
        this.disposeProgressTracker!();
        this.canvasResizeObserver!.disconnect();
        try { this.term.dispose() } catch (_) {}
    }
}