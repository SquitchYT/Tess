import { Terminal } from "./terminal";
import { PagePane, TerminalPane } from "./panes";
import { Profile } from "ts/schema/option";

export class View {
    // TODO: Implement pane page type

    id: string | undefined;
    element: HTMLElement | undefined;

    panes: (TerminalPane|PagePane)[] = [];

    closedEvent: ((id: string) => void) | undefined;
    focusedPaneTitleChangedEvent: ((title: string) => void) | undefined;

    focusedPane: TerminalPane | PagePane | undefined = undefined;


    async buildNew(viewId: string, paneId: string, closedEvent: ((id: string) => void), profile: Profile, focusedPaneTitleChangedEvent: ((title: string) => void)) {
        this.id = viewId;
        this.element = this.generateComponents();
        this.closedEvent = closedEvent;
        this.focusedPaneTitleChangedEvent = focusedPaneTitleChangedEvent;

        let pane = new TerminalPane(paneId, profile);
        await pane.initializeTerm();

        this.panes.push(pane)
        this.element.appendChild(pane.element);

        this.focusedPane = pane;
    }

    private generateComponents() : HTMLElement {
        let view = document.createElement("div");
        view.classList.add("view");

        return view
    }

    async closeAll() {
        for await (let pane of this.panes) {
            await pane.close();
            this.panes.splice(this.panes.indexOf(pane), 1);

            this.element!.removeChild(pane.element!)
        }

        this.element!.remove();
    }

    async closeOne(id: string) {
        let pane = this.panes.find((pane) => pane.id == id);

        if (pane) {
            await pane.close()
            this.panes.splice(this.panes.indexOf(pane), 1);
        } else {
            // TODO: Handle error
        }

        if (this.panes.length == 0) {
            this.closedEvent!(this.id!);
        }
    }

    writeToTerm(termId: string, data: string) {
        let pane = this.panes.find((pane) => pane.id == termId)

        if (pane && pane instanceof TerminalPane) {
            pane.write(data)
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

    /*openPane(split: "horizontaly" | "vertically", paneId: string, subviewToSplit: string) {
        // TODO: Implement
    }*/
}