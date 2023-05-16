export type Option = {
    theme : string,
    closeConfirmation: boolean,
    customTitlebar: boolean,
    backgroundTransparency: Number,
    profiles: Profile[],
    macros: Macro[],
    shortcuts: Shortcut[],
    terminal: TerminalOptions
}

type Shortcut = {
    action: string | [string, any],
    shortcut: string
}

type Macro = {
    content: string,
    uuid: string
}

type TerminalOptions = {
    bell: boolean,
    buffersize: Number,
    cursor: string,
    cursorBlink: boolean,
    drawBoldInBright: boolean,
    fontLigature: boolean,
    fontWeight: Number,
    fontWeightBold: Number,
    fontSize: Number,
    letterSpacing: Number,
    lineHeight: Number,
    showPicture: boolean,
    showUnreadDataIndicator: boolean, // TODO: Rename
    titleIsRunningProcess: boolean
}

type Profile = {
    name: string,
    terminal: TerminalOptions,
    theme: string, // TODO: Finish
    uuid: string,
    backgroundTransparency: Number
}