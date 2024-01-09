import { Terminal } from "./terminal";
import { PagePane, TerminalPane } from "./panes";
import { Profile } from "ts/schema/option";
import { PopupManager } from "ts/manager/popup";

import { Terminal as Xterm } from "xterm";
import { Toaster } from "ts/manager/toast";

export class View {
    // TODO: Implement pane page type

    id: string | undefined;
    element: HTMLElement | undefined;

    panes: (TerminalPane|PagePane)[] = [];

    closedEvent: ((id: string) => void) | undefined;
    focusedPaneTitleChangedEvent: ((title: string) => void) | undefined;

    focusedPane: TerminalPane | PagePane | undefined = undefined;

    popupManager: PopupManager | undefined;

    closingAllRequested: boolean = false;

    toaster: Toaster;


    constructor (viewId: string, popupManager: PopupManager, toaster: Toaster, closedEvent: ((id: string) => void), focusedPaneTitleChangedEvent: ((title: string) => void)) {
        this.id =  viewId;
        this.element = this.generateComponents();
        this.closedEvent = closedEvent;
        this.focusedPaneTitleChangedEvent = focusedPaneTitleChangedEvent;
        this.popupManager = popupManager;
        this.toaster = toaster;
    }

    async openPane(paneId: string) : Promise<void>;
    async openPane(paneId: string, profile: Profile, customKeyEventHandler: ((e: KeyboardEvent, term: Xterm) => boolean)) : Promise<void>;
    async openPane(paneId: string, profile?: Profile, customKeyEventHandler?: ((e: KeyboardEvent, term: Xterm) => boolean)) {
        if (profile) {
            let pane = new TerminalPane(paneId, profile);
            await pane.initializeTerm(customKeyEventHandler!, this.toaster);

            this.panes.push(pane)
            this.element!.appendChild(pane.element);

            this.focusedPane = pane;
        }
    }

    private generateComponents() : HTMLElement {
        let view = document.createElement("div");
        view.classList.add("view");

        return view
    }

    async closeAll() {
        for await (let pane of this.panes) {
            await pane.forceClosing()
        }
    }

    async closeOne(id: string) {
        let pane = this.panes.find((pane) => pane.id == id);

        if (pane) {
            await pane.forceClosing
        }
    }

    async requestClosingAll() {
        if (!this.closingAllRequested) {
            this.closingAllRequested = true;

            try {
                for await (let pane of this.panes) {
                    await this.requestClosingOne(pane.id)
                }
            } finally {
                this.closingAllRequested = false;
            }
        }
    }

    async requestClosingOne(id: string) {
        let pane = this.panes.find((pane) => pane.id == id);

        if (pane) {
            let closed = await pane.requestClosing(this.popupManager!, this.element!);
            if (closed) {
                this.panes.splice(this.panes.indexOf(pane), 1);

                if (this.panes.length == 0) {
                    this.closedEvent!(this.id!);
                }
            }
        }
    }

    getTerm(id: string) : Terminal | undefined {
        return this.panes.find((pane) => pane.id == id && pane instanceof TerminalPane) ? (this.panes.find((pane) => pane.id == id && pane instanceof TerminalPane) as TerminalPane).term! : undefined
    }

    focus() {
        // TODO: Finish
        // TODO: Restore focus to last pane with focus before unfocusing

        this.element!.classList.add("visible");

        this.panes.forEach((pane) => {
            pane.focus();
        })
    }

    unfocus() {
        // TODO: Implement
        // TODO: Save current pane with focus

        this.element!.classList.remove("visible");

        this.panes.forEach((pane) => {
            pane.unfocus();
        })
    }

    updatePaneTitle(id: string, title: string) {
        let pane = this.panes.find((pane) => pane.id == id);
        if (pane) {
            pane.title = title;
            this.focusedPaneTitleChangedEvent!(title)
        }
    }
}