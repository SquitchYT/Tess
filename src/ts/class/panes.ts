import { invoke } from '@tauri-apps/api/tauri';
import { Terminal } from "./terminal";
import { Profile } from 'ts/schema/option';

export class TerminalPane {
    element: Element;
    id: string;

    term: Terminal | null = null;

    constructor(id: string) {
        this.element = this.generateComponents();
        this.id = id;
    }

    generateComponents() : Element {
        let element = document.createElement("div");
        element.classList.add("pane");

        let internalTerm = document.createElement("div");
        internalTerm.classList.add("internal-term")
        element.appendChild(internalTerm);

        return element
    }

    async initializeTerm(profile: Profile) {
        let terminal = new Terminal(this.id, profile.terminalOptions, profile.theme);

        await terminal.launch(this.element.querySelector(".internal-term")!, profile.command);

        this.term = terminal;
    }

    async close() {
        // TODO: Finish
        // TODO: Add modal with close confirmation if error occured

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

    constructor(id: string) {
        // TODO: Implement

        this.id = id;
    }

    async close() {
        // TODO: Implement
    }

    unfocus() {
        // TODO: Implement
    }

    focus() {
        // TODO: Impelment
    }
}