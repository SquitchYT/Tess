import { TabsManager } from "./tabs";
import { listen, Event } from '@tauri-apps/api/event'
import { v4 as uuid } from 'uuid';
import { invoke } from '@tauri-apps/api/tauri'

import { terminalDataPayload, terminalTitleChangedPayload } from "../schema/term";
import { View } from "../class/views";
import { Toaster } from "./toast";
import { Option, ShortcutAction } from "ts/schema/option";
import { TerminalPane } from "ts/class/panes";
import { ShortcutsManager } from "./shortcuts";
import { clipboard } from "@tauri-apps/api";


export class ViewsManager {
    // TODO: Finish

    private target: Element;

    private tabsManager: TabsManager;
    private shortcutsManager: ShortcutsManager

    option: Option;

    private views: View[] = [];

    private toaster: Toaster;

    private focusedView: View | undefined;

    constructor(target: Element, tabsTarget: Element, toastTarget: Element, option: Option) {
        this.target = target;

        this.tabsManager = new TabsManager(tabsTarget, async (id) => { await this.onTabRequestClose(id); });
        this.tabsManager.addEventListener("tabFocused", (id) => { this.onTabFocused(id); });

        this.shortcutsManager = new ShortcutsManager(option.shortcuts, (action) => { this.onShortcutExecuted(action) });

        listen<terminalDataPayload>("terminalData", (e) => { this.onTerminalReceiveData(e); });
        listen<terminalTitleChangedPayload>("terminalTitleChanged", (e) => { this.onTerminalTitleChanged(e); })
        listen<string>("terminal_closed", (e) => { this.onTerminalProcessExited(e); });

        this.toaster = new Toaster(toastTarget);

        this.option = option;
    }

    private onTabFocused(id: string) {
        let viewToFocus = this.views.find((view) => view.id! == id);

        if (viewToFocus) {
            this.focusedView = viewToFocus;

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
                    this.toaster.toast("Unable to close pty",  error);
                    reject(error);
                })
            }
        })
    }

    private onTerminalReceiveData(e: Event<terminalDataPayload>) {
        this.views.forEach((view) => {
            let term = view.getTerm(e.payload.id);
            if (term) {
                term.term.write(e.payload.data);
            }
        })
    }

    private onTerminalTitleChanged(e: Event<terminalTitleChangedPayload>) {
        this.views.forEach((view) => {
            if (view.getTerm(e.payload.id)) {
                view.updatePaneTitle(e.payload.id, e.payload.title)
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
                    this.closeViewPane(view.id!, pane.id);
                }
            })
        });
    }

    private async onShortcutExecuted(action: ShortcutAction) {
        if (Array.isArray(action)) {
            switch (action[0]) {
                case "focusTab":
                    this.tabsManager.select(action[1]);
                    break;
                case "openProfile":
                    this.openProfile(action[1], true);
                    break;
                case "executeMacro":
                    let macro = this.option.macros.find(macro => macro.uuid == action[1]);
                    if (macro) {
                        invoke("terminal_input", {content: macro.content, id: this.focusedView!.focusedPane!.id});
                    }
                    break;
                default:
                    this.toaster.toast("Shortcut error", action[0] + " is not yet implemented");
            }
        } else {
            switch (action) {
                case "copy":
                    clipboard.writeText((this.focusedView!.focusedPane! as TerminalPane).term!.term.getSelection());
                    break;
                case "paste":
                    let clipboardContent = await clipboard.readText();
                    if (clipboardContent) {
                        invoke("terminal_input", {content: clipboardContent, id: this.focusedView!.focusedPane!.id});
                    }
                    break;
                case "openDefaultProfile":
                    this.openProfile(this.option.defaultProfile.uuid, true);
                    break;
                case "closeFocusedTab":
                    this.tabsManager.closeTab(this.tabsManager.getSelected().id);
                    break;
                case "focusNextTab":
                    this.tabsManager.selectNext();
                    break;
                case "focusPrevTab":
                    this.tabsManager.selectPrevious();
                    break;
                case "focusFirstTab":
                    this.tabsManager.selectFirst();
                    break;
                case "focusLastTab":
                    this.tabsManager.selectLast();
                    break;
                case 'closeAllTabs':
                    invoke("close_window");
                    break;
                default:
                    this.toaster.toast("Shortcut error", action + " is not yet implemented");
            }
        }
    }

    openProfile(profileId: string, focus: boolean) {
        let viewId = uuid();
        let paneId = uuid();

        let view = new View();

        let profile = this.option.profiles.find(profile => profile.uuid == profileId);

        if (profile) {
            view.buildNew(viewId, paneId, (id) => {this.tabsManager.closeTab(id)}, profile, (title) => {this.tabsManager.setTitle(viewId, title)}).then(() => {
                this.views.push(view);
                this.target.appendChild(view.element!);
    
                view.getTerm(paneId)!.term.onData((content, _) => {
                    this.onTerminalPaneInput(paneId, content);
                });
    
                this.tabsManager.openNewTab(profile!.name, viewId);

                let term = (view.panes[0] as TerminalPane).term!.term;
                term.attachCustomKeyEventHandler((e) => { return this.shortcutsManager.onKeyPress(e, term); });
    
                if (focus) { this.tabsManager.select(viewId); }
            }).catch((err) => {
                this.toaster.toast("Unable to create view",  err);
            })
        } else {
            this.toaster.toast("Unable to create view", `An error occur while opening a view. Reason: no profile corresponding to id ${profileId}`);
        }
    }

    closeViewPane(viewId: string, paneId: string) {
        let view = this.views.find((view) => view.id == viewId);

        if (view) {
            view.closeOne(paneId).catch((err) => {
                this.toaster.toast("Unable to close a view's pane",  err);
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