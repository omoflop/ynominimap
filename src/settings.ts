import * as Main from "./main";
import * as Minimap from "./minimap";
import * as PartyServer from "./partyserver";

export enum SettingType {
    Int, Time, Bool, Text, Percentage
}

export interface Setting {
    name: string,
    onChanged: Function | undefined,
    type: SettingType,
    extra: undefined | any
}

const intSetting = (name : string, onChanged : Function | undefined = undefined) : Setting => {
    return {
        name: name,
        onChanged : onChanged,
        type: SettingType.Int,
        extra: undefined
    }
};
const timeSetting = (name : string, onChanged : Function | undefined = undefined) : Setting => {
    return {
        name: name,
        onChanged : onChanged,
        type: SettingType.Time,
        extra: undefined
    }
};
const boolSetting = (name : string, onChanged : Function | undefined = undefined) : Setting => {
    return {
        name: name,
        onChanged : onChanged,
        type: SettingType.Bool,
        extra: undefined
    }
};
const textSetting = (name : string, onChanged : Function | undefined = undefined, pattern : string | undefined = undefined) : Setting => {
    return {
        name: name,
        onChanged : onChanged,
        type: SettingType.Text,
        extra: pattern
    }
};
const percentSetting = (name : string, onChanged : Function | undefined = undefined) : Setting => {
    return {
        name : name,
        onChanged : onChanged,
        type: SettingType.Percentage,
        extra: undefined
    }
};

// Also works as default values when unset by the user
export const values = {
    // General
    hideMinimap : false,
    updatesPerSecond: 60,
    enableLooping: true,
    extraLocationInfo: true,
    hideMinimapIfNoMap: true,

    // Pings
    pingLifetime: 10,
    drawLineToPings: true,
    
    // Warps
    showWarps: true,
    farWarpVisibility: 0.1,
    showWarpsInLoops: true,

    // Party
    partyName: "",
    partyPassword: "",

    // Debug
    debug: true,
    assetServerAddress: "https://raw.githubusercontent.com/omoflop/ynomapdatabase/refs/heads/main",
    partyServerAddress: "wss://yno.womenkissingwo.men/ws"
};

export const menuMetadata = {
    structure: {
        general: [
            boolSetting("hideMinimap", Minimap.updateVisbility),
            intSetting("updatesPerSecond"),
            boolSetting("enableLooping"),
            boolSetting("extraLocationInfo", Main.updateExtraLocationInfo),
            boolSetting("hideMinimapIfNoMap", Minimap.updateVisbility)
        ],
        pings: [
            timeSetting("pingLifetime"),
            boolSetting("drawLineToPings"),
        ],
        warps: [
            boolSetting("showWarps"),
            percentSetting("farWarpVisibility"),
            boolSetting("showWarpsInLoops"),
        ],
        party: [
            textSetting("partyName"),
            textSetting("partyPassword"),
        ],
        debug: [
            boolSetting("debug"),
            textSetting("assetServerAddress"),
            textSetting("partyServerAddress")
        ]
    },
    descriptions: {
        // General
        hideMinimap : "Enables/disables the visibility of the minimap",
        updatesPerSecond: "How many times per second the map is refreshed",
        enableLooping: "Should the minimap loop if the current room supports it?",
        extraLocationInfo: "Show extra location info below the minimap, including the map id, and the player's position",
        hideMinimapIfNoMap: "Should the minimap hide if the game map image couldn't be loaded?",

        // Pings
        pingLifetime: "How many seconds pings last before dissapearing",
        drawLineToPings: "Should lines be shown between the player and pings?",
        
        // Warps
        showWarps: "Should warps be displayed on the minimap?",
        farWarpVisibility: "Determines the visiblility of warps far from the mouse, player, or pings. Ignored if warps are disabled.",
        showWarpsInLoops: "Should warps be shown in loops? Ignored if warps or loops are disabled.",

        // Party
        partyName: "The name of the party you want to join",
        partyPassword: "The password of the party you want to join",

        // Debug       
        debug: "Enables/disables debug information",
        assetServerAddress: "The address of the server used to fetch map images and data",
        partyServerAddress: "The address of the party server",
    }
};

export const loadCookies = () => {
    Object.keys(menuMetadata.structure).forEach((categoryName : string) => {
        ((menuMetadata.structure as any)[categoryName] as Setting[]).forEach(setting => {
            const value = getCookie(`omoYnoMinimap_${setting.name}`);
            if (!value || value === "") return;

            let parsedValue = undefined;
            switch (setting.type) {
                case SettingType.Bool:
                    parsedValue = value === "true";
                    break;
                case SettingType.Int:
                    parsedValue = parseInt(value);
                    break;
                case SettingType.Percentage:
                    parsedValue = parseFloat(value);
                    break
                case SettingType.Text:
                    parsedValue = value;
                    break;
                default:
                    break;
            }

            if (parsedValue !== undefined) {
                (values as any)[setting.name] = parsedValue;
            }
        });
    });
};

export const setSettingsModalVisbility = (visible : boolean) => {
    if (visible) {
        modalContainer?.classList.remove("hidden");
        settingsModal.classList.remove("hidden");
    } else {
        modalContainer?.classList.add("hidden")
        settingsModal.classList.add("hidden");
    }
};

const modalContainer = document.getElementById("modalContainer");

const settingsModal = document.createElement("div");
settingsModal.classList.add("modal");
settingsModal.classList.add("hidden");

export const initSettingsModal = () => {
    const modalClose = document.createElement("button");
    modalClose.type = "button"
    modalClose.classList.add("modalClose");
    modalClose.textContent = "✖";
    modalClose.addEventListener("click", () => {
        setSettingsModalVisbility(false);
    });
    settingsModal.appendChild(modalClose);
    
    const modalHeader = document.createElement("div");
    modalHeader.classList.add("modalHeader");

    const modalTitle = document.createElement("h1");
    modalTitle.classList.add("modalTitle");
    modalTitle.textContent = "Minimap Settings";

    modalHeader.appendChild(modalTitle);
    settingsModal.appendChild(modalHeader);

    const modalContent = document.createElement("div");
    modalContent.classList.add("modalContent");

    const formControls = document.createElement("ul");

    const style = document.createElement("style");
    document.head.appendChild(style);

    style.innerHTML = `
        .omoSettingsInput {
            display: flex;
            justify-content: space-between;
            margin-left: auto;
        }
        .omoSettingsDiv {
            
        }
    `;

    Object.keys(menuMetadata.structure).forEach((category : string) => {
        const categoryHeader = document.createElement("h2");
        categoryHeader.textContent = category
        categoryHeader.style.textTransform = "capitalize";

        formControls.appendChild(categoryHeader);

        ((menuMetadata.structure as any)[category] as Setting[]).forEach((setting : Setting) => {
            if (setting.name == "hideMinimap") return;

            const li = document.createElement("li");
            li.classList.add("formControlRow");
        
            const label = document.createElement("label");
            label.classList.add("unselectable");
            label.textContent = setting.name;
            li.appendChild(label);

            // this is where you'd add the interface to edit said setting
            const div = document.createElement("div");
            div.classList.add("omoSettingsDiv");

            const getValue = () => (values as any)[setting.name];
            const setValue = (newValue : any) => (values as any)[setting.name] = newValue;

            switch (setting.type) {
                case SettingType.Bool:
                    const checkbox = document.createElement("button");
                    checkbox.classList.add("checkboxButton");
                    checkbox.classList.add("unselectable");
                    checkbox.classList.add("omoSettingsInput");

                    checkbox.appendChild(document.createElement("span"));

                    if (getValue() === true) checkbox.classList.add("toggled");

                    checkbox.addEventListener("click", () => {
                        const newValue = !getValue();
                        setValue(newValue);
                        if (newValue) checkbox.classList.add("toggled");
                        else checkbox.classList.remove("toggled");
                    
                        setCookie(`omoYnoMinimap_${setting.name}`, `${newValue}`);

                        if (setting.onChanged) setting.onChanged();
                    });

                    div.appendChild(checkbox);
                    
                    break;

                case SettingType.Text:
                    const input = document.createElement("input");
                    input.classList.add("omoSettingsInput");
                    input.type = "text";

                    if (setting.extra) input.pattern = setting.extra;
                    input.value = getValue();

                    input.addEventListener("input", () => {
                        setValue(input.value);
                        setCookie(`omoYnoMinimap_${setting.name}`, `${input.value}`);
                    });

                    input.appendChild(document.createElement("span"));
                    div.appendChild(input);
                    break;
                default:
                    break;
            }

            li.appendChild(div);

            formControls.appendChild(li);
        });

    });

    modalContent.appendChild(formControls);
    settingsModal.appendChild(modalContent);
};

modalContainer?.appendChild(settingsModal);