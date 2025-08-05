/*!
    @preserve

    ATON Maat module

 	@author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/
const fs     = require('fs');
const path   = require('path');
const fg     = require('fast-glob');
const fsx    = require('fs-extra');
//const axios  = require('axios');
<<<<<<< HEAD
=======
//const chokidar = require("chokidar");
>>>>>>> master


/**
Maat module serves as in-memory DB
@namespace Maat
*/
let Maat = {};

<<<<<<< HEAD
Maat.INTERVAL = 5000;
=======
Maat.INTERVAL = 10000;
>>>>>>> master

Maat.init = ()=>{
	Maat.needScan = {};
	Maat.needScan.scenes      = true;
	Maat.needScan.collections = {};
	Maat.needScan.users       = true;
	Maat.needScan.apps        = true;
	//Maat.needScan.models = {};
	//Maat.needScan.panos  = {}

	//Maat._bDirtyScenes      = true;
	//Maat._bDirtyCollections = true;

	Maat.db = {};

	Maat.db.users       = {};
	Maat.db.scenes      = [];
<<<<<<< HEAD
=======
	Maat.db.scenesByID  = {};
>>>>>>> master
	Maat.db.kwords      = {};
	Maat.db.collections = {};

	Maat.db.stats = {};

<<<<<<< HEAD
	//Maat.scanScenes();

/*
=======
/* TOO heavy on CPU
>>>>>>> master
	const watcherScenes = chokidar.watch(Core.DIR_SCENES, {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
		usePolling: true,
		interval: 2000,
		ignoreInitial: true
	});
	const watcherCollections = chokidar.watch(Core.DIR_COLLECTIONS, {
		ignored: /(^|[\/\\])\../, // ignore dotfiles
		persistent: true,
		usePolling: true,
		interval: 2000,
		ignoreInitial: true
	});

	let onScenesChange = (p)=>{
<<<<<<< HEAD
		Maat._bDirtyCollections = true
	};
	let onCollectionsChange = (p)=>{
		Maat._bDirtyCollections = true;
=======
		console.log("Scenes changed "+p);
	};
	let onCollectionsChange = (p)=>{
		console.log("Collection changed "+p);		
>>>>>>> master
	};

	watcherScenes
		.on('add', onScenesChange )
<<<<<<< HEAD
		.on('change', onScenesChange )
=======
		//.on('change', onScenesChange )
>>>>>>> master
		.on('unlink', onScenesChange );

	watcherCollections
		.on('add', onCollectionsChange )
		.on('change', onCollectionsChange )
		.on('unlink', onCollectionsChange );
*/

<<<<<<< HEAD

/*
    fs.watch(Core.DIR_SCENES, (eventType, filename) => {
        console.log("\nThe file " + filename + " was modified! ("+eventType+")");
        Maat._bDirtyScenes = true;
=======
/*
    fs.watch(Core.DIR_SCENES, (eventType, filename) => {
        console.log("\nThe file " + filename + " was modified! ("+eventType+")");
>>>>>>> master
    });

    fs.watch(Core.DIR_COLLECTIONS, (eventType, filename) => {
        console.log("\nThe file " + filename + " was modified! ("+eventType+")");
<<<<<<< HEAD
        Maat._bDirtyCollections = true;
    });
*/
    //Maat._dUpd = setInterval(Maat.update, Maat.INTERVAL);
};

=======
    });
*/
    //Maat._dUpd = setInterval(Maat.update, Maat.INTERVAL);

	// First global scan
	Maat.getUsers();
	Maat.scanApps();
	Maat.scanScenes();
	for (let i in Maat.db.users){
		let u = Maat.db.users[i].username;
		Maat.scanCollection(u);
	}
};

Maat.sortScenes = (entryA, entryB)=>{
	let a = entryA.creationDate;
	let b = entryB.creationDate;

/*
	let a = entryA.sid.split("/")[1];
	let b = entryB.sid.split("/")[1];
*/
	if (!a || !b ) return 0;

    if (a > b) return -1;
    if (b > a) return 1;

    return 0;
}

>>>>>>> master

Maat.addSceneKeyword = (k)=>{
	if (k === undefined) return;

	k = k.toLowerCase().trim();

	// kw counters
	if (Maat.db.kwords[k] === undefined) Maat.db.kwords[k] = 1;
	else Maat.db.kwords[k]++;
};

<<<<<<< HEAD
Maat.scanScenes = ()=>{
	if (Maat.needScan.scenes === false) return;

	Maat.db.scenes = []; // clear
	Maat.db.kwords = {}; // clear global keywords
	//Maat.db.users  = {};
	
	console.log("Scanning scenes...");

	let files = fg.sync("**/"+Core.STD_SCENEFILE, Core.SCENES_GLOB_OPTS);

	for (let f in files){
		let S = {};

		let sid       = path.dirname(files[f]);
		let pubfile   = Core.DIR_SCENES + sid+"/" + Core.STD_PUBFILE;
		let coverfile = Core.DIR_SCENES + sid+"/" + Core.STD_COVERFILE;
	
		//let user = sid.split("/")[0];
		//if (user) Maat.db.users[user] = 1;

		S.sid    = sid;
		S.cover  = fs.existsSync(coverfile)? true : false;
		S.public = fs.existsSync(pubfile)? true : false;
		
		let sobj = Core.readSceneJSON(sid);

		if (sobj){
			if (sobj.title) S.title = sobj.title;

			if (sobj.kwords){
				S.kwords = sobj.kwords;
				for (let k in S.kwords) Maat.addSceneKeyword(k);
			}

			Maat.db.scenes.push(S);
		}
		else {
			console.log("ERROR malformed scene: ", sid);
		}

		//Maat.db.scenes.push(S);
	}

	Maat.needScan.scenes = false;

	console.log(Maat.db.kwords);

	setTimeout(()=>{
		Maat.needScan.scenes = true;
	}, Maat.INTERVAL);
};

Maat.scanApps = ()=>{
	if (Maat.needScan.apps === false) return;

	Maat.db.apps = [];
=======

// TODO: scan per user
Maat._scanScenes = (uid, onComplete)=>{
	if (Maat.needScan.scenes[uid] === false){
		if (onComplete) onComplete();
		return;
	}

	Maat.needScan.scenes[uid] = false;

	console.log("Scan scenes: "+uid);
};

Maat.scanScenes = (onComplete)=>{
	if (!Maat.needScan.scenes){
		if (onComplete) onComplete();
		return;
	}
	
	console.log("Scanning scenes...");
	Maat.needScan.scenes = false;

	const confSHU = Core.config.shu;

	//let files = fg.sync("**/"+Core.STD_SCENEFILE, Core.SCENES_GLOB_OPTS);
	fg("**/"+Core.STD_SCENEFILE, Core.SCENES_GLOB_OPTS).then( files => {

		Maat.db.scenes     = []; // clear
		Maat.db.scenesByID = {};
		Maat.db.kwords     = {}; // clear global keywords
		//Maat.db.users  = {};

		for (let f in files){
			let S = {};

			let sid       = path.dirname(files[f]);
			//let pubfile   = Core.DIR_SCENES + sid+"/" + Core.STD_PUBFILE;
			//let coverfile = Core.DIR_SCENES + sid+"/" + Core.STD_COVERFILE;
		
			//let user = sid.split("/")[0];
			//if (user) Maat.db.users[user] = 1;

			S.sid    = sid;
			//S.cover  = fs.existsSync(coverfile)? true : false;
			///S.public = fs.existsSync(pubfile)? true : false;

			if (confSHU && confSHU.staffpick && confSHU.staffpick[sid]) S.staffpick = 1;
			
			let sobj = Core.readSceneJSON(sid);

			if (sobj){
				if (sobj.title) S.title = sobj.title;

				if (sobj.kwords){
					S.kwords = sobj.kwords;
					for (let k in S.kwords) Maat.addSceneKeyword(k);
				}

				if (sobj.visibility) S.visibility = sobj.visibility;

				if (!sobj.creationDate){
					const sstats = fs.statSync(Core.DIR_SCENES + files[f]);
					S.creationDate = sstats.birthtime;
				}

				Maat.db.scenes.push(S);

				Maat.db.scenesByID[S.sid] = {
					title: S.title,
					visibility: S.visibility,
					kwords: S.kwords,
					//cover: S.cover,
					creationDate: S.creationDate
				};
			}
			else {
				console.log("ERROR malformed scene: ", sid);
			}

			//Maat.db.scenes.push(S);
		}



		//console.log(Maat.db.scenesByID);

		//Maat.db.scenes.sort( Maat.sortScenes );

		//console.log(Maat.db.kwords);
		//Maat.needScan.scenes = false;

		setTimeout(()=>{ Maat.needScan.scenes = true; }, Maat.INTERVAL);

		if (onComplete) onComplete();
	});
};

Maat.scanApps = (onComplete)=>{
	if (!Maat.needScan.apps){
		if (onComplete) onComplete();
		return;
	}

	Maat.needScan.apps = false;
>>>>>>> master

	let O    = {};
	O.cwd    = Core.DIR_WAPPS;
	O.follow = true;

	console.log("Scanning web-apps...");

<<<<<<< HEAD
	let files = fg.sync("*/app.webmanifest", O); // index.html
	for (let f in files){
		let wid = path.dirname(files[f]);
		let appicon = path.join(Core.DIR_WAPPS+wid, "/appicon.png");

		Maat.db.apps.push({
			wappid: wid,
			icon: fs.existsSync(appicon)? true : false
		});
	}

	Maat.needScan.apps = false;

	setTimeout(()=>{
		Maat.needScan.apps = true;
	}, Maat.INTERVAL);
=======
	//let files = fg.sync("*/app.webmanifest", O);
	fg("*/app.webmanifest", O).then(files => {
		Maat.db.apps = [];

		for (let f in files){
			let wid = path.dirname(files[f]);
			let appicon = path.join(Core.DIR_WAPPS+wid, "/appicon.png");
			let datadir = path.join(Core.DIR_WAPPS+wid, "/data");

			Maat.db.apps.push({
				wappid: wid,
				icon: fs.existsSync(appicon)? true : false,
				data: fs.existsSync(datadir)? true : false
			});
		}

		setTimeout(()=>{ Maat.needScan.apps = true; }, Maat.INTERVAL );

		if (onComplete) onComplete();
	});

	//setTimeout(()=>{ Maat.needScan.apps = true; }, Maat.INTERVAL);
>>>>>>> master
};


// Collections
<<<<<<< HEAD
Maat.scanCollection = (uid)=>{
	if (Maat.needScan.collections[uid] === false) return;

	//const t0 = performance.now();

	Maat.scanModels(uid);
	Maat.scanPanoramas(uid);
	Maat.scanMedia(uid);

	//const t1 = performance.now();
	//console.log(`${t1 - t0} milliseconds.`);

	Maat.needScan.collections[uid] = false;

	setTimeout(()=>{
		Maat.needScan.collections[uid] = true;
	}, Maat.INTERVAL);
};

Maat.scanModels = (uid)=>{
=======
Maat.scanCollection = (uid, onComplete)=>{
	if (Maat.needScan.collections[uid] === false){
		if (onComplete) onComplete();
		return;
	}

	Maat.needScan.collections[uid] = false;

	console.log("Scan collection: "+uid);

	//const t0 = performance.now();

	let scheduleScan = ()=>{
		console.log("Scan collection "+uid+" completed.");
		if (onComplete) onComplete();

		setTimeout(()=>{ Maat.needScan.collections[uid] = true; }, Maat.INTERVAL);
	};

	let bModels = false;
	let bPano   = false;
	let bMedia  = false;

	Maat.scanModels(uid, ()=>{
		bModels = true;
		if (bPano && bMedia) scheduleScan();
	});
	Maat.scanPanoramas(uid, ()=>{
		bPano = true;
		if (bModels && bMedia) scheduleScan();
	});
	Maat.scanMedia(uid, ()=>{
		bMedia = true;
		if (bModels && bPano) scheduleScan();
	});

	//const t1 = performance.now();
	//console.log(`${t1 - t0} milliseconds.`);
/*
	Maat.needScan.collections[uid] = false;

	setTimeout(()=>{ Maat.needScan.collections[uid] = true; }, Maat.INTERVAL);
*/
};

// Models path-based filtering
Maat._mfilter = (fpath)=>{
	if (fpath.endsWith(".json")){
		if (fpath.includes("/Data/")) return false;
	}
	else {
		if (fpath.includes("/tiles/")) return false;
	}

	return true;
};

Maat.scanModels = (uid, onComplete)=>{
>>>>>>> master
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

<<<<<<< HEAD
	//let relpath = uid +"/models/";
/*
	let globopts    = {};
	globopts.cwd    = Core.DIR_COLLECTIONS;// + relpath;
	globopts.follow = true;
*/
	//let files = fg.sync("**/{*.gltf,*.glb,*.json}", globopts);
	let files = fg.sync("{"+uid+",samples}/models/**/{"+Core.mpattern+"}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].models = [];

	if (files.length < 1) return;

	// TODO: improve filtering perf.
	//files = Maat.filterTSets(files);

	for (let f in files) CC[uid].models.push( /*relpath + */files[f] );
};

Maat.scanPanoramas = (uid)=>{
=======
	//let files = fg.sync("{"+uid+",samples}/models/**/{"+Core.mpattern+"}", Core.COLLECTIONS_GLOB_OPTS);
	fg("{"+uid+",samples}/models/**/{"+Core.mpattern+"}", Core.COLLECTIONS_GLOB_OPTS).then( files =>{

		CC[uid].models = [];

		if (files.length < 1) return;

		// TODO: improve filtering perf.
		//files = Maat.filterTSets(files);

		for (let f in files){
			let fpath = files[f];

			if (Maat._mfilter(fpath)) CC[uid].models.push( fpath );

			//CC[uid].models.push( /*relpath + */files[f] );
		}

		if (onComplete) onComplete();
	});
};

Maat.scanPanoramas = (uid, onComplete)=>{
>>>>>>> master
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

	//let relpath = uid +"/pano/";
/*
	let globopts    = {};
	globopts.cwd    = Core.DIR_COLLECTIONS; // + relpath;
	globopts.follow = true;
*/
<<<<<<< HEAD
	//let files = fg.sync("**/{*.jpg,*.mp4,*.webm}", globopts);
	let files = fg.sync("{"+uid+",samples}/pano/**/{*.jpg,*.hdr,*.exr,*.mp4,*.webm}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].panos = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].panos.push( /*relpath +*/ files[f] );
};

Maat.scanMedia = (uid)=>{
=======
	//let files = fg.sync("{"+uid+",samples}/pano/**/{"+Core.panopattern+"}", Core.COLLECTIONS_GLOB_OPTS);
	fg("{"+uid+",samples}/pano/**/{"+Core.panopattern+"}", Core.COLLECTIONS_GLOB_OPTS).then(files => {

		CC[uid].panos = [];
		
		if (files.length < 1) return;
		for (let f in files) CC[uid].panos.push( /*relpath +*/ files[f] );

		if (onComplete) onComplete();
	});
};

Maat.scanMedia = (uid, onComplete)=>{
>>>>>>> master
	let CC = Maat.db.collections;

	if (CC[uid] === undefined) CC[uid] = {};

<<<<<<< HEAD
	let files = fg.sync("{"+uid+",samples}/media/**/{*.jpg,*.png,*.mp4,*.webm,*.wav,*.mp3}", Core.COLLECTIONS_GLOB_OPTS);

	CC[uid].media = [];
	if (files.length < 1) return;

	for (let f in files) CC[uid].media.push( files[f] );
=======
	//let files = fg.sync("{"+uid+",samples}/media/**/{"+Core.mediapattern+"}", Core.COLLECTIONS_GLOB_OPTS);
	fg("{"+uid+",samples}/media/**/{"+Core.mediapattern+"}", Core.COLLECTIONS_GLOB_OPTS).then(files =>{

		CC[uid].media = [];
		if (files.length < 1) return;

		for (let f in files) CC[uid].media.push( files[f] );

		if (onComplete) onComplete();
	});
>>>>>>> master
};

// TODO: improve filter alg
Maat.filterTSets = ( files )=>{
<<<<<<< HEAD
=======

	let R = [];

	for (let s in files){
		let fpath = files[s];

		if (fpath.endsWith(".json")){
			if (!fpath.includes("/Data/")) R.push( fpath );
		}
		else {
			if (!fpath.includes("/tiles/")) R.push( fpath );
		}
	}

	return R;
/*

>>>>>>> master
	let its = [];
	let B   = {};

	for (let s in files){
		let fpath = files[s];

		if (fpath.endsWith(".json")){
			//console.log(fpath)

			B[fpath] = path.dirname(fpath);
		}
	}

	//console.log(B)

	for (let k in B){
		let base1 = B[k];
		
		for (let j in B){
			let base2 = B[j];

			if (base1!==base2 && base1.startsWith(base2)){
				//console.log(base1+" << "+base2)

				files = files.filter((e)=>{
					return (e !== k);
				});
			}
		}
	}

	//console.log(files)
	return files;
<<<<<<< HEAD
=======
*/
>>>>>>> master
};

// TODO
Maat.getUsers = ()=>{
	if (Maat.needScan.users === false) return Maat.db.users;

	console.log("Reloading users DB...");
	Maat.db.users = Core.loadConfigFile("users.json", Core.CONF_USERS);

	Maat.needScan.users = false;

<<<<<<< HEAD
	setTimeout(()=>{
		Maat.needScan.users = true;
	}, Maat.INTERVAL);
=======
	setTimeout(()=>{ Maat.needScan.users = true; }, Maat.INTERVAL);
>>>>>>> master

	return Maat.db.users;
};

// Apps
Maat.getApps = ()=>{
	Maat.scanApps();

	return Maat.db.apps;
};

<<<<<<< HEAD
// Scenes
Maat.getAllScenes = ()=>{
	Maat.scanScenes();

	return Maat.db.scenes;
}
Maat.getPublicScenes = ()=>{
	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return (s.public);
	});

	return R;
};
Maat.getUserScenes = (uid)=>{
=======
Maat.getApp = (appid)=>{
	Maat.scanApps();
	
	for (let a in Maat.db.apps){
		if (Maat.db.apps[a].wappid===appid) return Maat.db.apps[a];
	}

	return false;
};

// Scenes
Maat.getAllScenes = ()=>{
	return new Promise((resolve, reject)=>{
		Maat.scanScenes(()=>{
			resolve( Maat.db.scenes );
		});
	});
/*
	Maat.scanScenes();

	return Maat.db.scenes;
*/
}

Maat.getPublicScenes = ()=>{
	return new Promise((resolve, reject)=>{
		Maat.scanScenes(()=>{
			let R = Maat.db.scenes.filter((s)=>{ return ( s.visibility ); });
			resolve( R );
		});
	});
/*
	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return ( s.visibility );
	});

	return R;
*/
};

Maat.getUserScenes = (uid)=>{
	return new Promise((resolve, reject)=>{
		Maat.scanScenes(()=>{
			let R = Maat.db.scenes.filter((s)=>{ return (s.sid.startsWith(uid)); });
			resolve( R );
		});
	});

/*
>>>>>>> master
    if (uid === undefined) return undefined;

	Maat.scanScenes();

	let R = Maat.db.scenes.filter((s)=>{
		return (s.sid.startsWith(uid));
	});

	return R;
<<<<<<< HEAD
};

Maat.getScenesByKeyword = (kw, uid)=>{
=======
*/
};

Maat.getSceneEntry = (sid)=>{
	return Maat.db.scenesByID[sid];
};


Maat.getScenesByKeyword = (kw, uid)=>{
	return new Promise((resolve, reject)=>{
		if (!kw) resolve(undefined);

		Maat.scanScenes(()=>{
			if (uid !== undefined){
				let R = Maat.db.scenes.filter((s)=>{
					return (s.sid.startsWith(uid) && s.kwords !== undefined && s.kwords[kw] !== undefined);
				});

				resolve(R);
			}
			else {
				let R = Maat.db.scenes.filter((s)=>{
					return (s.visibility && s.kwords !== undefined && s.kwords[kw] !== undefined);
				});
	
				resolve( R );
			}
		});
	});

/*
>>>>>>> master
    if (kw === undefined) return undefined;

	Maat.scanScenes();

    // Specific user
    if (uid !== undefined){
        let R = Maat.db.scenes.filter((s)=>{
            return (s.sid.startsWith(uid) && s.kwords !== undefined && s.kwords[kw] !== undefined);
        });

        return R;
    }

    // Public scenes
	let R = Maat.db.scenes.filter((s)=>{
<<<<<<< HEAD
		return (s.public && s.kwords !== undefined && s.kwords[kw] !== undefined);
	});

	return R;
=======
		return (s.visibility && s.kwords !== undefined && s.kwords[kw] !== undefined);
	});

	return R;
*/
>>>>>>> master
};

// Collections
Maat.getUserModels = (uid)=>{
<<<<<<< HEAD
=======
	return new Promise((resolve, reject)=>{
		let CC = Maat.db.collections;
		if (!uid || !CC[uid]) resolve([]);

		Maat.scanCollection(uid, ()=>{
			resolve( CC[uid].models );
		});
	});
/*
>>>>>>> master
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].models;
<<<<<<< HEAD
};

Maat.getUserPanoramas = (uid)=>{
=======
*/
};

Maat.getUserPanoramas = (uid)=>{
	return new Promise((resolve, reject)=>{
		Maat.scanCollection(uid,()=>{
			let CC = Maat.db.collections;
			
			if (!CC || !CC[uid]) resolve([]);
			else resolve( CC[uid].panos );
		});
	});
/*
>>>>>>> master
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].panos;
<<<<<<< HEAD
};

Maat.getUserMedia = (uid)=>{
=======
*/
};

Maat.getUserMedia = (uid)=>{
	return new Promise((resolve, reject)=>{
		Maat.scanCollection(uid,()=>{
			let CC = Maat.db.collections;

			if (!CC || !CC[uid]) resolve([]);
			else resolve( CC[uid].media );
		});
	});
/*
>>>>>>> master
	Maat.scanCollection(uid);

	let CC = Maat.db.collections;
	if (CC[uid] === undefined) return [];

	return CC[uid].media;
<<<<<<< HEAD
};

Maat.getScenesKeywords = ()=>{
	Maat.scanScenes();

	return Maat.db.kwords;
=======
*/
};

// Keywords
Maat.getScenesKeywords = ()=>{
	return new Promise((resolve, reject)=>{
		Maat.scanScenes(()=>{
			resolve( Maat.db.kwords );
		});
	});

/*
	Maat.scanScenes();

	return Maat.db.kwords;
*/
>>>>>>> master
};

Maat.getStats = ()=>{
	
	//console.log(Core.config);

	Maat.db.stats.name      = (Core.config && Core.config.name)? Core.config.name : undefined;

	Maat.db.stats.scenesTot = 0;
	Maat.db.stats.scenesPub = 0;
	Maat.db.stats.users     = 0;
	Maat.db.stats.models    = 0;
	Maat.db.stats.panos     = 0;
	Maat.db.stats.media     = 0;
	Maat.db.stats.apps      = 0;
	
	Maat.scanScenes();
	Maat.db.stats.kwords = Maat.db.kwords;
	Maat.db.stats.scenesTot = Maat.db.scenes.length;
<<<<<<< HEAD
	for (let x in Maat.db.scenes) if (Maat.db.scenes[x].public) Maat.db.stats.scenesPub++;
=======
	for (let x in Maat.db.scenes) if (Maat.db.scenes[x].visibility) Maat.db.stats.scenesPub++;
>>>>>>> master

	Maat.scanApps();
	Maat.db.stats.apps = Maat.db.apps.length;
	
	for (let i in Maat.db.users){
		let u = Maat.db.users[i].username;

		Maat.db.stats.users++;

		Maat.scanCollection(u);
		
		let U = Maat.db.collections[u];	
		
		if (U){
			Maat.db.stats.models += U.models.length;
			Maat.db.stats.panos  += U.panos.length;
			Maat.db.stats.media  += U.media.length;
		}
	}

	//console.log(Maat.db.stats);
	return Maat.db.stats;
};

module.exports = Maat;