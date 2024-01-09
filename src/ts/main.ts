import { App } from './app';
import { invoke, convertFileSrc } from '@tauri-apps/api/tauri';
import { Option } from './schema/option';


window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
})

invoke<Option>("utils_get_configuration").then((option) => {
    if (option.background != "opaque" && !(option.background instanceof Object)) {
        document.body.style.background = "transparent";
    } else if (option.background instanceof Object) {
        let background = document.createElement("img");
            background.src = convertFileSrc(option.background.media.location);
            background.classList.add("background-image");
            background.style.setProperty("-webkit-filter", `blur(${option.background.media.blur}px)`);
            document.body.appendChild(background)
    }

    if (option.appTheme != "") {
        let stylesheet = document.createElement("link");
        stylesheet.type = "text/css";
        stylesheet.rel = "stylesheet";
        stylesheet.href = convertFileSrc(option.appTheme);
        document.head.appendChild(stylesheet);
    }

    let app = new App(document.querySelector(".views")!, document.querySelector(".tabs")!, document.querySelector(".toasts")!, option);
    app.openProfile(option.defaultProfile.uuid, true)

    document.querySelector(".open")!.addEventListener("click", () => {
        app.openProfile(option.defaultProfile.uuid, true);
    })
})
