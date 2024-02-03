export type Option = {
    appTheme : string,
    closeConfirmation: boolean,
    customTitlebar: boolean,
    profiles: Profile[],
    macros: Macro[],
    shortcuts: Shortcut[],
    defaultProfile: Profile,
    background: "transparent" | "opaque" | "blurred" | "mica" | "acrylic" | "vibrancy" | {media: BackgroundMedia}
}

export type Shortcut = {
    action: ShortcutAction,
    shortcut: string
}

export type ShortcutAction = "copy" 
                           | "paste"
                           | "openDefaultProfile"
                           | "closeFocusedTab"
                           | "closeAllTabs"
                           | "focusNextTab"
                           | "focusPrevTab"
                           | "focusFirstTab"
                           | "focusLastTab"
                           | ["focusTab", number]
                           | ["openProfile", string]
                           | ["executeMacro", string]

type Macro = {
    content: string,
    uuid: string
}

export type TerminalOptions = {
    bell: boolean,
    bufferSize: number,
    cursor: "bar" | "underline" | "block",
    cursorBlink: boolean,
    drawBoldInBright: boolean,
    fontLigature: boolean,
    fontWeight: number,
    fontWeightBold: number,
    fontSize: number,
    letterSpacing: number,
    lineHeight: number,
    showPicture: boolean,
    showUnreadDataMark: boolean
}

export type Profile = {
    name: string,
    terminalOptions: TerminalOptions,
    theme: TerminalTheme,
    uuid: string,
    backgroundTransparency: number,
    background: BackgroundMedia | null,
    command: string
}

export type TerminalTheme = {
    foreground: string,
    background: string,
    black: string,
    red: string,
    green: string,
    yellow: string,
    blue: string,
    magenta: string,
    cyan: string,
    white: string,
    brightBlack: string,
    brightRed: string,
    brightGreen: string,
    brightYellow: string,
    brightBlue: string,
    brightMagenta: string,
    brightCyan: string,
    brightWhite: string,
    cursor: string,
    cursorAccent: string
}

export type BackgroundMedia = {
    blur: number,
    location: string
}

export type CloseConfirmation = {
    tab: boolean,
    window: boolean,
    app: boolean,
    excludedProcess: string[]
}