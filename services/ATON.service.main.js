/*!
	@preserve

	  ATON Main Service (gateway)

	  @author Bruno Fanini
	VHLab, CNR ISPC

==================================================================================*/

const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const url = require('url');
//const compression = require('compression');
const path = require('path');
const cors = require('cors');
const chalk = require('chalk');

const glob = require("glob");
const nanoid = require("nanoid");
const { createProxyMiddleware } = require('http-proxy-middleware');

const Core = require('./Core');
const Auth = require('./Auth');
const Render = require('./Render');
const API = require("./API/v2"); // v2


// Initialize & load config files
Core.init();

const CONF = Core.config;

// Standard PORTS
let PORT = 8080;
let PORT_SECURE = 8083;
let VRC_PORT = 8890;
let VRC_ADDR = "ws://localhost/aton";
let PORT_WEBDAV = 8081;

if (CONF.services.main.PORT)
	PORT = CONF.services.main.PORT;

if (process.env.PORT)
	PORT = process.env.PORT;

if (CONF.services.main.PORT_S)
	PORT_SECURE = CONF.services.main.PORT_S;

if (CONF.services.photon) {
	if (CONF.services.photon.PORT) VRC_PORT = CONF.services.photon.PORT;
	if (CONF.services.photon.address) VRC_ADDR = CONF.services.photon.address;
}

// compatibility with previous configs
if (CONF.services.vroadcast) {
	if (CONF.services.vroadcast.PORT) VRC_PORT = CONF.services.vroadcast.PORT;
	if (CONF.services.vroadcast.address) VRC_ADDR = CONF.services.vroadcast.address;
}

if (CONF.services.webdav && CONF.services.webdav.PORT)
	PORT_WEBDAV = CONF.services.webdav.PORT;

const pathCert = Core.getCertPath();
const pathKey = Core.getKeyPath();

let bExamples = CONF.services.main.examples;
//let bAPIdoc   = CONF.services.main.apidoc;

// Debug on req received (client)
let logger = function (req, res, next) {
	console.log('Request from: ' + req.ip + ' For: ' + req.path);
	next(); // Run the next handler
};


let app = express();

// --- Added to allow embedding & cross-browser login ---
app.use((req, res, next) => {
	res.setHeader(
		"Content-Security-Policy",
		"frame-ancestors 'self' http://127.0.0.1:8091/"
	);
	res.setHeader("X-Frame-Options", "ALLOW-FROM http://127.0.0.1:8091/");
	next();
});

app.use((req, res, next) => {
	const originalSetHeader = res.setHeader.bind(res);
	res.setHeader = (name, value) => {
		if (name.toLowerCase() === "set-cookie") {
			if (Array.isArray(value)) {
				value = value.map((v) => {
					if (!v.includes("SameSite")) v += "; SameSite=None";
					if (!v.includes("Secure")) v += "; Secure";
					return v;
				});
			} else {
				if (!value.includes("SameSite")) value += "; SameSite=None";
				if (!value.includes("Secure")) value += "; Secure";
			}
		}
		originalSetHeader(name, value);
	};
	next();
});

app.use(cors({
	credentials: true,
	origin: ["http://127.0.0.1:8091/"]
}));


//app.set('trust proxy', 1); 	// trust first proxy

//app.use(compression());

app.use(cors({
	credentials: true,
	origin: true
}));
/*
app.use((req, res, next)=>{
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});
*/
app.use(express.json({ limit: '50mb' }));

// Scenes redirect /s/<sid>
/*
app.get(/^\/s\/(.*)$/, function(req,res,next){
	let sid = req.params[0];

	//req.url     = "/fe";
	//req.query.s = sid;
	
	res.redirect(url.format({
		pathname:"/fe",
		query: { "s": sid }
	}));

	next();
});
*/

// Data routing (advanced)
//Core.setupDataRoute(app);

const CACHING_OPT = {
	maxage: "3h"
};

app.use('/aton', express.static(Core.DIR_PUBLIC, CACHING_OPT));

// Official front-end (Hathor)
//app.use('/fe', express.static(Core.DIR_FE));

// Common public resources (config/public/)
if (fs.existsSync(Core.DIR_CONFIGPUB)) app.use('/aton/common', express.static(Core.DIR_CONFIGPUB));

// Web-apps
app.use('/aton/a', express.static(Core.DIR_WAPPS));

// Data (static)
app.use('/aton', express.static(Core.DIR_DATA, CACHING_OPT));

// Setup authentication
Auth.init(app);


// REST API
Core.realizeBaseAPI(app); 	// v1 (for backward compatibility)
API.init(app);			// v2


// Rendering
Core.Render.setup(app);


// Micro-services proxies
//=================================================

// Photon (previously VRoadcast)
app.use('/aton/vrc', createProxyMiddleware({
	target: VRC_ADDR + ":" + VRC_PORT,
	ws: true,
	pathRewrite: { '^/vrc': '' },
	changeOrigin: true
}));
app.use('/aton/svrc', createProxyMiddleware({
	target: VRC_ADDR + ":" + VRC_PORT,
	ws: true,
	pathRewrite: { '^/svrc': '' },
	secure: true,
	changeOrigin: true
}));

// WebDav
/*
app.use('/dav', createProxyMiddleware({ 
	//target: CONF.services.webdav.address+":"+PORT_WEBDAV, 
	target: "http://localhost:"+PORT_WEBDAV,
	pathRewrite: { '^/dav': ''},
	changeOrigin: false, //true,
	//xfwd: true,
	//secure: true,

	//router: { "/dav" : "http://localhost:"+PORT_WEBDAV }
}));
*/

// Collect & setup flares (if found)
//==================================
Core.setupFlares(app);

for (let fid in Core.flares) {
	//let fid = Core.flares[f];
	app.use('/flares/' + fid, express.static(Core.DIR_FLARES + fid + "/public/"));
}

// START
//==================================
http.createServer(app).listen(PORT, () => {
	Core.logGreen("\nATON up and running!");
	console.log("- OFFLINE: http://localhost:" + PORT);
	for (let n in Core.nets) console.log("- NETWORK ('" + n + "'): http://" + Core.nets[n][0] + ":" + PORT);

	console.log("\n");
});

// HTTPS service
if (fs.existsSync(pathCert) && fs.existsSync(pathKey)) {
	let httpsOptions = {
		key: fs.readFileSync(pathKey, 'utf8'),
		cert: fs.readFileSync(pathCert, 'utf8')
	};

	https.createServer(httpsOptions, app).listen(PORT_SECURE, () => {
		Core.logGreen("\nHTTPS ATON up and running!");
		console.log("- OFFLINE: https://localhost:" + PORT_SECURE);
		for (let n in Core.nets) console.log("- NETWORK ('" + n + "'): https://" + Core.nets[n][0] + ":" + PORT_SECURE);

		console.log("\n");
	});
}
else {
	console.log("\nSSL certs not found:\n" + pathKey + "\n" + pathCert);
	console.log("\n");
}