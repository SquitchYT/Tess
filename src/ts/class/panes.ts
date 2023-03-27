import { invoke } from '@tauri-apps/api/tauri';
import { Terminal } from "./terminal";

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

    async initializeTerm(termCommand: string) {
        let terminal = new Terminal(this.id);

        await terminal.launch(this.element.querySelector(".internal-term")!, termCommand);

        this.term = terminal;
    }

    async close() {
        // TODO: Finish
        // TODO: Add modal with close confirmation if error occured

        this.term!.close();

        await invoke("close_terminal", {id: this.id});
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