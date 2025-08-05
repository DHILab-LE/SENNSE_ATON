/*
    ATON Flare Class

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Class representing a plugin
<<<<<<< HEAD
A flare can be used to extend functionalities to any ATON app 
by providing a setup routine (initalization) and an optional update routine (executed continuously).
A flare must be then added (registered) via ATON.addFlare() or register() method
@class Flare

@example 
let P = new ATON.Flare( mySetup, myUpdate )
ATON.addFlare(P);
*/
class Flare {

constructor( setup, update ){
    this.setup  = setup? setup : undefined;
    this.update = update? update : undefined;

    this._deps = [];
}

/**
Register globally this flare
*/
register(){
    ATON.addFlare(this);
    
    return this;
}

// Experimental
include(path){
    this._deps.push(path);

=======
A flare can be used to extend functionalities to any ATON app by providing a setup routine (initalization) and an optional update routine (executed continuously).
In order to be activated, a flare must be registered via register() method
@class Flare

@example 
let F = new ATON.Flare("myflare")
*/
class Flare {

constructor( id ){
    this._id        = undefined;
    this._bDeployed = false;

    if (id) this.register(id);
}

/**
Register and activate globally this flare
@param {String} id - (Optional) local identifier for the flare object (to be accessible through ATON.Flares[id]). It could differ from server flare-ID
*/
register(id){
    if (id) this._id = id;
    
    ATON.addFlare(this);
    return this;
}

/**
Return Flare ID if defined
@returns {String} - Flare ID
*/
getID(){
    return this._id;
}

/**
Flare log
@param {String} msg - Message to log
*/
log(msg){
    if (this._id) console.log("[Flare "+this._id+"] " + msg);
    else console.log("[Flare]" + msg);

    return this;
}

setSetup(setup){
    this.setup = setup;
    return this;
}

setUpdate(upd){
    this.update = upd;
>>>>>>> master
    return this;
}

}

export default Flare;