export const isGameLoaded = () => 
    typeof gameId !== "undefined" && 
    typeof cachedMapId !== "undefined" && 
    typeof easyrpgPlayer !== "undefined" && 
    typeof easyrpgPlayer.api !== "undefined" && 
    typeof playerData !== "undefined" && 
    typeof playerData?.name !== "undefined";

export const getGameId = () => gameId;
export const getMapId = () => cachedMapId;
export const getPlayerCoords = () => easyrpgPlayer.api.getPlayerCoords();
export const getPrevMapId = () => typeof cachedPrevMapId !== "undefined" ? cachedPrevMapId : "0000";
export const getUsername = () => playerData.name;

export const getMapName = (): any => {
    const result = locationCache[`${(cachedPrevMapId || '0000')}_${cachedMapId}`];
    if (result instanceof Array) return result[0].title;
    return result;
};

export const getLocationData = (): any|undefined => {
    const mapName = getMapName();
    console.log("Location Key: " + mapName);
    const result = locationsData.find((a: any) => a.title == mapName);
    return result;
}