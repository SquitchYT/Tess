import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { Terminal } from "./terminal";
import { Profile } from 'ts/schema/option';
import { PopupManager } from 'ts/manager/popup';
import { PopupBuilder, PopupButton } from './popup';

import { Terminal as Xterm } from "xterm";

export class TerminalPane {
    element: Element;
    id: string;
    profile: Profile;

    term: Terminal | null = null;

    title: String

    constructor(id: string, profile: Profile) {
        this.profile = profile
        this.element = this.generateComponents();
        this.id = id;
        this.title = profile.name;
    }

    generateComponents() : Element {
        let element = document.createElement("div");
        element.classList.add("pane");

        let internalTerm = document.createElement("div");
        internalTerm.classList.add("internal-term");

        if (this.profile.background) {
            let background = document.createElement("img");
            background.src = convertFileSrc(this.profile.background.location);
            background.classList.add("background-image");
            element.appendChild(background);

            internalTerm.style.setProperty("-webkit-backdrop-filter", `blur(${this.profile.background.blur}px)`)
        }

        internalTerm.style.setProperty("--profile-background", this.profile.theme.background);
        internalTerm.style.setProperty("--profile-background-transparency", `${this.profile.backgroundTransparency}%`);

        element.appendChild(internalTerm);

        return element
    }

    async initializeTerm(customKeyEventHanlder: ((e: KeyboardEvent, term: Xterm) => boolean)) {
        let terminal = new Terminal(this.id, this.profile.terminalOptions, this.profile.theme, customKeyEventHanlder);

        await terminal.launch(this.element.querySelector(".internal-term")!, this.profile.uuid);

        this.term = terminal;
    }

    async requestClosing(popupManager: PopupManager, viewElement: HTMLElement) : Promise<boolean> {
        if (!await invoke("check_close_availability", {id: this.id})) {
            let cancelButton = new PopupButton("cancel", "dismiss");
            let confirmButton = new PopupButton("confirm", "validate");
    
            let closeAuthorized = (await popupManager.sendPopup(new PopupBuilder(`Confirm close of ${await invoke("get_pty_title", {id: this.id})}`).withMessage("Are you sure to close this tab?").withButtons(cancelButton, confirmButton), viewElement)).action == "confirm";
    
            if (closeAuthorized) {
                await invoke("close_terminal", {id: this.id});
                this.term!.close();
            }
            return closeAuthorized;
        } else {
            await invoke("close_terminal", {id: this.id});
            this.term!.close();
            return true;
        }
    }

    async forceClosing() {
        await invoke("close_terminal", {id: this.id});
        this.term!.close();
    }

    write(data: string) {
        this.term!.term.write(data);
    }

    unfocus() {
        this.term?.unfocus()
    }

    focus() {
        this.term?.focus()
    }
}


export class PagePane {
    // TODO: Implement

    id: string
    element: Element | null = null;

    title: String

    constructor(id: string) {
        // TODO: Implement

        this.id = id;
        this.title = "";
    }

    async requestClosing() {
        // TODO: Implement
    }

    async forceClosing() {
        // TODO: Implement
    }

    unfocus() {
        // TODO: Implement
    }

    focus() {
        // TODO: Impelment
    }
}