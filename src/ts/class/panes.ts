import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { Terminal } from "./terminal";
import { Profile } from 'ts/schema/option';

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

    async initializeTerm() {
        let terminal = new Terminal(this.id, this.profile.terminalOptions, this.profile.theme);

        await terminal.launch(this.element.querySelector(".internal-term")!, this.profile.uuid);

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

    title: String

    constructor(id: string) {
        // TODO: Implement

        this.id = id;
        this.title = "";
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