import { TabsManager } from "./tabs";
import { listen, Event } from '@tauri-apps/api/event'
import { v4 as uuid } from 'uuid';
import { invoke } from '@tauri-apps/api/tauri'

import { terminalDataPayload } from "../schema/term";
import { View } from "../class/views";


export class ViewsManager {
    // TODO: Finish

    private target: Element;
    private tabsManager: TabsManager;

    private views: View[] = [];

    constructor(target: Element, tabsTarget: Element) {
        this.target = target;
        this.tabsManager = new TabsManager(tabsTarget, async (id) => { await this.onTabRequestClose(id); });

        this.tabsManager.addEventListener("tabFocused", (id) => { this.onTabFocused(id); });

        listen<terminalDataPayload>("terminalData", (e) => { this.onTerminalReceiveData(e); });
        listen<string>("terminal_closed", (e) => { this.onTerminalProcessExited(e); });
    }

    private onTabFocused(id: string) {
        let viewToFocus = this.views.find((view) => view.id! == id);

        if (viewToFocus) {
            viewToFocus.focus();

            this.views.forEach((view) => {
                if (view.id != id) {
                    view.unfocus();
                }
            })
        } else {
            // TODO: Handle unknown view and close the tab
        }
    }

    private onTabRequestClose(id: string) : Promise<void> {
        return new Promise((resolve, reject) => {
            let view = this.views.find((view) => view.id == id);

            if (view) {
                view.closeAll().then(() => {
                    this.views.splice(this.views.indexOf(view!), 1);
                    resolve();

                    if (this.views.length == 0) {
                        invoke("close_window");
                    }
                }).catch((error) => {
                    reject(error);
                })
            }
        })
    }

    private onTerminalReceiveData(e: Event<terminalDataPayload>) {
        this.views.forEach((view) => {
            let term = view.getTerm(e.payload.id)
            if (term) {
                term.term.write(e.payload.data)
            }
        })
    }

    private onTerminalPaneInput(id: string, data: string) {
        invoke("terminal_input", {content: data, id: id});
    }

    private onTerminalProcessExited(e: Event<String>) {
        this.views.forEach((view) => {
            view.panes.forEach((pane) => {
                if (pane.id == e.payload) {
                    this.closeViewPane(view.id!, pane.id)
                }
            })
        });
    }

    openProfile(profileId: string, focus: boolean) {
        let viewId = uuid();
        let paneId = uuid();

        let view = new View();

        view.buildWithTerminal(viewId, "terminal", paneId, profileId, (id) => {this.tabsManager.closeTab(id)}).then(() => {
            this.views.push(view);
            this.target.appendChild(view.element!);

            view.getTerm(paneId)!.term.onData((content, _) => {
                this.onTerminalPaneInput(paneId, content);
            });

            this.tabsManager.openNewTab(profileId, viewId);

            if (focus) { this.tabsManager.select(viewId); }
        }).catch((error) => {
            console.log("dfdfdhfgdfhgfdjhgdfjkghdjkfghdfjkghdfjkgdfg:", error);
        })
    }

    closeViewPane(viewId: string, paneId: string) {
        let view = this.views.find((view) => view.id == viewId);

        if (view) {
            view.closeOne(paneId).catch(() => {
                // TODO: Handle error
            })
        } else {
            // TODO: Handle error
        }
    }


    /*openInternalPage(pageName: string) {
        // TODO: Implement
    }

    openPluginPage(pageName: string) {
        // TODO: Implement
    }

    openProfileInView(profileId: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }

    openInternalPageInView(pageName: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }

    openPluginPageInView(pageName: string, viewId: string, split: "horizontaly" | "verticaly") {
        // TODO: Implement
    }*/
}