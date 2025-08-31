declare var cachedMapId: string | undefined;
declare var cachedPrevMapId: string | undefined;
declare var gameId: string | undefined;
declare const easyrpgPlayer: {
    api: {
        getPlayerCoords: () => [number, number]
    }
};
declare const playerData: {
    name: string
};
declare const cached2kkiLocations: any;
declare const send2kkiApiRequest: any;

declare const getLocalizedMapLocations: Function
declare const showToastMessage: Function
declare const setCookie: Function
declare const getCookie: Function

declare const locationCache: any;
declare const locationsData: any;