import { Shortcut, ShortcutAction } from "ts/schema/option";
import { Terminal } from "xterm";


export class ShortcutsManager {
    shortcuts: [string[], ShortcutAction][] = [];

    onShortcutExecutedCallback: ((shortcut: ShortcutAction) => void)


    constructor(shortcuts: Shortcut[], onShortcutExecuted: ((shortcut: ShortcutAction) => void)) {
        shortcuts.forEach((shortcut) => {
            this.shortcuts.push([shortcut.shortcut.toLowerCase().split("+"), shortcut.action])
        })

        this.onShortcutExecutedCallback = onShortcutExecuted;

        document.addEventListener("keydown", (e) => { this.onKeyPress(e) });
    }


    onKeyPress(e: KeyboardEvent, target?: Terminal) : boolean {
        if (e.type == "keydown" && e.code != "Space") {
            e.preventDefault()
            e.stopImmediatePropagation()

            let key = e.key.toLowerCase() == "unidentified" ? e.code : e.key;
            let pressedShortcut = [key.toLowerCase()];

            if (e.ctrlKey) pressedShortcut.push("ctrl");
            if (e.altKey) pressedShortcut.push("alt");
            if (e.shiftKey) pressedShortcut.push("maj");

            let correspondingShortcut = this.shortcuts.find((shortcut) => {
                return (pressedShortcut.every((tmp) => {
                    return shortcut[0].includes(tmp)
                }) && shortcut[0].every((tmp) => {
                    return pressedShortcut.includes(tmp)
                }))
            })

            if (correspondingShortcut) {
                if (target && correspondingShortcut[1] == "copy") {
                    if (target.hasSelection()) {
                        this.onShortcutExecutedCallback(correspondingShortcut[1])

                        return false
                    } else {
                        return true
                    }
                } else {
                    this.onShortcutExecutedCallback(correspondingShortcut[1])

                    return false
                }
            } else {
                return true
            }
        }

        return true
    }
}