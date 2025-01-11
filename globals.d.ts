declare var cachedMapId: string | undefined;
declare var cachedPrevMapId: string | undefined;
declare var gameId: string | undefined;
declare const easyrpgPlayer: {
    api: {
        getPlayerCoords: () => [number, number]
    }
};

declare const getLocalizedMapLocations: Function
declare const showToastMessage: Function