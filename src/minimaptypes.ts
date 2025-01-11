import * as Util from "./util";

export enum MapLoopType {
    None = "none",
    Vertical = "vertical",
    Horizontal = "horizontal",
    Both = "both"
}

export interface ExitTeleport {
    x : number,
    y : number,
    destinationNameLines : string[]
}

export interface MapTeleport {
    x : number,
    y : number,
    destinationX : number,
    destinationY : number,
    color : string,
    biDirectional : boolean
}

export interface ProtoTeleport {
    x : number,
    y : number,
    destination_x : number,
    destination_y : number,
    destination_map_id : string,
    destination_name : string | undefined
}

export const areBidirectional = (teleport1 : ProtoTeleport, teleport2 : ProtoTeleport, currentMapId: string, maxDistance: number = 1) => {
    if (teleport1.destination_map_id !== currentMapId || teleport2.destination_map_id !== currentMapId)
        return false;

    const distanceFromT1ToT2Dest = Util.dist(
        teleport1.x,
        teleport2.destination_x,
        teleport1.y,
        teleport2.destination_y
    );

    const distanceFromT2ToT1Dest = Util.dist(
        teleport2.x,
        teleport1.destination_x,
        teleport2.y,
        teleport1.destination_y
    );
    
    return distanceFromT1ToT2Dest <= maxDistance && distanceFromT2ToT1Dest <= maxDistance;
};