import * as Settings from "./settings";

export class LazyImage {
    value: any;
    imageReady : boolean = false;

    constructor(url : string | undefined = undefined, onLoad : Function | undefined = undefined) {
        if (url) this.loadNewImage(url, onLoad);
    }

    loadNewImage(url : string | undefined = undefined, onLoad : Function | undefined = undefined) {
        this.imageReady = false;
        this.value = new Image();
        this.value.crossOrigin = "anonymous";
        this.value.onload = () => {
            this.imageReady = true;
            if (Settings.values.debug) console.log(`Loaded image from url: ${url}`);
            if (onLoad) onLoad();
        };
        this.value.onerror = () => {
            if (Settings.values.debug) console.error(`Failed to load image from url: ${url}`);
        };
        this.value.src = url;
    }
}