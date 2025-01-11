import * as Main from "./main";
import * as Minimap from "./minimap";

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
const textSetting = (name : string, onChanged : Function | undefined = undefined, regex : RegExp | undefined = undefined) : Setting => {
    return {
        name: name,
        onChanged : onChanged,
        type: SettingType.Text,
        extra: regex
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
            textSetting("assetServerAddress")
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
    }
};

export const saveCookies = () => {
    document.cookie = `minimapSettings=${encodeURIComponent(JSON.stringify(values))};path=/;max-age=31536000`;
};

export const loadCookies = () => {
    const cookieValue = document.cookie.split(';').find(row => row.trim().startsWith('minimapSettings='));
    if (cookieValue) 
        Object.assign(values, JSON.parse(decodeURIComponent(cookieValue.split('=')[1])));
};