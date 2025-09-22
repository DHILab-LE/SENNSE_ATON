/*
    ATON Front-end blueprint

    author: bruno.fanini_AT_gmail.com

===========================================================*/

/**
Generic front-end routines for ATON-based web-apps. 
A set of blueprints to facilitate or support creation of a front-end
@namespace FE
*/
import html2canvas from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.esm.js';

let FE = {};

let configData = null;

// Semantic-shapes types
FE.SEMSHAPE_SPHERE = 0;
FE.SEMSHAPE_CONVEX = 1;

FE.POPUP_DT = 500; //300;

FE.STD_SEL_RAD = 0.05;

/**
Initialize Front-end
*/
FE.realize = () => {
    FE.PATH_RES_ICONS = ATON.PATH_RES + "icons/";

    FE._bPopup = false;  // showing popup
    FE._tPopup = undefined;
    FE.popupBlurBG = 0;      // blur 3D canvas on popup show (in pixels), 0 to disable

    FE._userAuth = {};

    FE._bControlLight = false;
    FE._bControlSelScale = false;
    FE._cLightDir = new THREE.Vector3();

    FE._auSemNode = undefined;
    FE._auSemNodePlaying = false;

    FE._bReqHome = false;   // auto-compute home

    FE._bVRCsetup = false;

    FE.urlParams = new URLSearchParams(window.location.search);

    FE._uiSetupBase();

    // UI profiles
    FE._uiProfiles = {};
    FE._uiCurrProfile = undefined;

    FE._selRanges = [0.01, 50.0]; // 3D Selector ranges
    FE._selRefRadius = 0.5;

    ATON.realize();

    // Built-in events
    ATON.on("Fullscreen", (b) => {
        FE.uiSwitchButton("fullscreen", b);
    });

    // built-in base front-end parameters
    let ddens = ATON.FE.urlParams.get('d');
    if (ddens && ddens > 0.0) {
        ATON.setDefaultPixelDensity(ddens);
        ATON.toggleAdaptiveDensity(false);
    }

    let dynd = ATON.FE.urlParams.get('dd');
    if (dynd && dynd > 0) ATON.toggleAdaptiveDensity(true);

    FE._canvas = ATON._renderer.domElement;

    FE._bSem = false; // hovering semantic node or mask
    FE._bShowSemLabel = true;
};

FE._handleHomeReq = () => {
    if (FE._bReqHome) return;

    // Check we have a valid scene bs
    let bs = ATON.getRootScene().getBound();
    if (bs.radius <= 0.0) return;

    FE._bReqHome = true;

    if (ATON.Nav.homePOV === undefined) {
        ATON.Nav.computeAndRequestDefaultHome(0.5);
        return;
    }

    ATON.Nav.requestHome(1.0);
    //console.log(ATON.Nav.homePOV);
};

// Load configuration JSON file
async function loadConfig() {
    try {
        // Extract path dynamically from URL
        let fullUrl = window.location.href;
        let match = fullUrl.match(/\/s\/(.+)$/);
        let extractedPath = match ? match[1] : '';

        if (!extractedPath) {
            throw new Error("Invalid URL structure: Unable to extract the config path.");
        }

        console.log("Extracted Config Path:", extractedPath);

        // Fetch the JSON file dynamically based on the extracted path
        const response = await fetch(`/auth/sennse?path=${encodeURIComponent(extractedPath)}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch configuration file: ${response.statusText}`);
        }

        configData = await response.json();
        console.log("Loaded Config:", configData);
    } catch (error) {
        console.error("Error loading configuration file:", error);
    }
}


/**
Add basic front-end events such as showing spinner while loading assets and home viewpoint setup
*/

// Generic function to fetch telemetry data
async function fetchTelemetryData(accessToken, deviceId, keys, startTs, endTs, labels, units) {
    const thingsboardUrl = configData.sennseURL;
    const headers = {
        "Content-Type": "application/json",
        "X-Authorization": `Bearer ${accessToken}`
    };

    const keyList = Array.isArray(keys) ? keys.join(',') : keys;
    const fetchUrl = `${thingsboardUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keyList}&startTs=${startTs}&endTs=${endTs}&limit=9000`;

    console.log("Fetch URL: " + fetchUrl);

    try {
        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const results = {};

        const deviceInfo = configData.deviceIds.find(device => device.nodeId === deviceId);
        const nodeName = deviceInfo ? deviceInfo.nodeName : "Unknown";
        // Process each key separately
        const processKey = (key, unit) => {
            if (!data[key]) return [];

            const allData = data[key].map(entry => ({
                timestamp: entry.ts,
                value: parseFloat(entry.value).toFixed(2),
                unit: unit,
                label: labels[key] || key,
                nodeName: nodeName // Add nodeName here
            }));

            // Downsample to one data point per hour
            const hourlyData = [];
            const hourMillis = 60 * 60 * 1000;
            for (let i = startTs; i < endTs; i += hourMillis) {
                const closestPoint = allData.reduce((closest, point) =>
                    Math.abs(point.timestamp - i) < Math.abs(closest.timestamp - i) ? point : closest
                    , allData[0]);
                hourlyData.push({ ...closestPoint, timestamp: i });
            }
            return hourlyData;
        };

        if (Array.isArray(keys)) {
            keys.forEach((key, index) => {
                results[key] = processKey(key, units[index]);
            });
        } else {
            results[keys] = processKey(keys, units);
        }

        return results;

    } catch (error) {
        console.error(`Error fetching data:`, error);
        return {};
    }
}

// Generic function to authenticate to the SENNSE platform
async function login() {
    const loginUrl = `${configData.sennseURL}/api/auth/login`;

    const credentials = {
        username: configData.username,
        password: configData.password
    };

    const headers = {
        "Content-Type": "application/json"
    };

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(credentials)
        });

        if (response.ok) {
            const data = await response.json();
            return data.token;
        } else {
            console.error("Login failed:", await response.text());
            return null;
        }
    } catch (error) {
        console.error("Error during login:", error);
        return null;
    }
}

// Generic function to build a telemetry map to store all the Data needs
function buildTelemetryMap(accessToken) {
    const telemetryMap = {};

    for (const device of configData.deviceIds) {
        const deviceId = device.nodeId;

        for (const sensor of device.sensors) {
            for (let [sensorKey, sensorName] of Object.entries(sensor)) {
                let startTs, endTs, keys, labels, units;

                // console.log("Check this bloc !!!");
                // console.log(sensorKey);
                // console.log(sensorName);

                if (sensorName.includes("_&_") && sensorName.includes("Logger_")) {
                    // Existing Logger_ condition
                    const parts = sensorName.split("_&_").map(part => {
                        const cleaned = part.replace("Logger_", "");
                        return {
                            key: cleaned,
                            unit: cleaned.includes("TempC") ? "°C" :
                                cleaned.includes("Temperature") ? "°C" :
                                    cleaned.includes("Humidity") ? "%" :
                                        cleaned.includes("Lux") ? "lx" : ""
                        };
                    });

                    keys = parts.map(p => p.key);
                    units = parts.map(p => p.unit);
                    labels = {};
                    parts.forEach((part, index) => {
                        const formattedLabel = part.key.replace(/([A-Z])/g, ' $1').trim();
                        labels[keys[index]] = formattedLabel;
                    });
                    endTs = 1738159200000;
                    startTs = endTs - (5 * 60 * 60 * 1000);

                }
                else if (sensorName.includes("LightIntensity")) {
                    console.log("Check this condition Light Intensity Logger !!");
                    console.log(sensorName.replace("Logger_", ""));

                    // Remove Logger_ prefix and handle as a single key
                    const cleanedKey = sensorName.replace("Logger_", "");
                    keys = [cleanedKey];
                    units = [cleanedKey.includes("TempC") ? "°C" :
                        cleanedKey.includes("Temperature") ? "°C" :
                            cleanedKey.includes("Humidity") ? "%" :
                                cleanedKey.includes("Lux") ? "lx" :
                                cleanedKey.includes("LightIntensity") ? "lx" : ""];
                    labels = { [cleanedKey]: sensorKey };
                    endTs = 1732540140000;
                    startTs = 1731930900000;
                }
                else if (sensorName.includes("Logger_")) {

                    // Remove Logger_ prefix and handle as a single key
                    const cleanedKey = sensorName.replace("Logger_", "");
                    keys = [cleanedKey];
                    units = [cleanedKey.includes("TempC") ? "°C" :
                        cleanedKey.includes("Temperature") ? "°C" :
                            cleanedKey.includes("Humidity") ? "%" :
                                cleanedKey.includes("Lux") ? "lx" : ""];
                    labels = { [cleanedKey]: sensorKey };
                    endTs = 1738159200000;
                    startTs = endTs - (5 * 60 * 60 * 1000);

                }
                else if (sensorName.includes("_&_") && !sensorName.includes("Logger_")) {
                    console.log("This filter started !!");

                    // **New condition for keys like TempC_ESP32_001_&_Humidity_ESP32_001**
                    const parts = sensorName.split("_&_").map(part => {
                        return {
                            key: part,
                            unit: part.includes("TempC") ? "°C" :
                                part.includes("Temperature") ? "°C" :
                                    part.includes("Humidity") ? "%" :
                                        part.includes("Lux") ? "lx" : ""
                        };
                    });

                    keys = parts.map(p => p.key);
                    units = parts.map(p => p.unit);
                    labels = {};
                    parts.forEach((part, index) => {
                        const formattedLabel = part.key.replace(/([A-Z])/g, ' $1').trim();
                        labels[keys[index]] = formattedLabel;
                    });
                    endTs = Date.now();
                    startTs = endTs - (5 * 60 * 60 * 1000);

                } else {
                    // Default case
                    const now = Date.now();
                    const cleanedKey = sensorName.replace("Logger_", "");
                    keys = [cleanedKey];
                    units = [sensorName.includes("TempC") ? "°C" :
                        sensorName.includes("Temperature") ? "°C" :
                            sensorName.includes("Humidity") ? "%" :
                                sensorName.includes("Lux") ? "lx" : ""];
                    labels = { [cleanedKey]: sensorKey };
                    startTs = sensorName.includes("Logger_") ? 1731502800000 : now - (5 * 60 * 60 * 1000);
                    endTs = now;
                }

                telemetryMap[sensorName] = async () =>
                    await fetchTelemetryData(
                        accessToken,
                        deviceId,
                        keys,
                        startTs,
                        endTs,
                        labels,
                        units
                    );
            }
        }
    }

    return telemetryMap;
}

// Generic function to build a Dynamic widget for the different sensor type 
function createDynamicWidget(telemetryMap, sensorData) {

    // Create the widget container
    const widget = document.createElement("div");
    widget.id = "widget"; // Add an ID
    widget.style.cssText = "background: linear-gradient(145deg, #2e3b4e, #1c2533); border-radius: 20px; width: 380px; padding: 25px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), inset 0 -1px 10px rgba(255, 255, 255, 0.1); position: relative; overflow: hidden;";
    widget.style.position = "absolute";
    widget.style.top = "-9999px";

    const gradientOverlay = document.createElement("div");
    gradientOverlay.style.cssText = "position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(255, 82, 82, 0.15), rgba(255, 152, 0, 0.15)); z-index: 0; pointer-events: none;";

    const widgetContent = document.createElement("div");
    widgetContent.style.cssText = "position: relative; z-index: 1;";


    const title = document.createElement("h2");
    title.id = "temperatureTitle";
    title.textContent = "";
    title.style.cssText = "font-size: 1.6rem; margin: 0; color: #e0e5ec; text-transform: uppercase; text-align: center; letter-spacing: 1px; margin-bottom: 10px;";


    const sensorName = document.createElement("div");
    sensorName.innerHTML = `Last 5 Hours SENNSE <br>${telemetryMap}`;
    // sensorName.textContent = `Last 5 Hours <br> SENNSE`;

    sensorName.style.cssText = "font-size: 0.95rem; color: #aab4be; margin-bottom: 15px; text-align: center;";

    const temperature = document.createElement("div");
    temperature.style.cssText = "font-size: 4.5rem; color: #ff6e6e; text-align: center; font-weight: bold; margin-bottom: 20px; position: relative; display: flex; justify-content: center; align-items: center;";

    const arrow = document.createElement("span");
    arrow.textContent = "\u2191";
    arrow.style.cssText = "display: inline-block; color: #ff6e6e; font-size: 2.8rem; vertical-align: middle; margin-right: 10px;";

    const temperatureValue = document.createElement("span");
    temperatureValue.id = "temperature-value";
    temperatureValue.textContent = "";
    temperatureValue.style.cssText = "font-size: 2.5rem;";

    const degreeSymbol = document.createElement("span");
    degreeSymbol.textContent = "";
    degreeSymbol.style.cssText = "font-size: 1.8rem;";

    temperature.appendChild(arrow);
    temperature.appendChild(temperatureValue);
    temperature.appendChild(degreeSymbol);


    const chartContainer = document.createElement("div");
    chartContainer.style.cssText = "border-top: 2px solid rgba(255, 255, 255, 0.2); padding-top: 15px; margin-top: 15px;";

    const canvas = document.createElement("canvas");
    canvas.id = "chart";
    canvas.style.cssText = "width: 100%; height: 150px;";
    chartContainer.appendChild(canvas);

    const timestamp = document.createElement("div");
    timestamp.id = "timestamp";
    // timestamp.textContent = `Last updated: ${new Date(sensorData[4].timestamp).toLocaleString()}`;
    timestamp.style.cssText = "font-size: 0.9rem; color: #90a4ae; text-align: center; margin-top: 15px; font-style: italic;";


    widgetContent.appendChild(title);
    widgetContent.appendChild(sensorName);
    widgetContent.appendChild(temperature);
    widgetContent.appendChild(chartContainer);
    widgetContent.appendChild(timestamp);


    widget.appendChild(gradientOverlay);
    widget.appendChild(widgetContent);

    return widget;
}

// Generic Function to draw the Humidity sensor chart for the Dynamic widget
function drawTemp_HumSensorChart(dataPoints, canvas, widgetElement) {
    return new Promise((resolve, reject) => {
        try {
            // Update UI elements (if they exist)
            const timestampElement = widgetElement.querySelector("#timestamp"); // Add this line
            const tempValueElement = widgetElement.querySelector("#temperature-value");
            const temperatureTitleElement = widgetElement.querySelector("#temperatureTitle");
            const ctx = canvas.getContext("2d");
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            const numHorizontalLines = 5;
            const numVerticalLines = 10;

            // Get all keys from the dataPoints object
            const sensorKeys = Object.keys(dataPoints);

            // Validate if there are sensors available
            if (sensorKeys.length === 0) {
                console.error("No sensor data found!");
                resolve(); // Resolve to avoid blocking the application
                return;
            }



            // if (timestampElement) {
            //     timestampElement.textContent = `Last updated: ${new Date(latestDataPoint.timestamp).toLocaleString()}`;
            // }


            // Set canvas dimensions
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;

            // Create gradient background
            gradient.addColorStop(0, "rgba(255, 105, 180, 0.4)");
            gradient.addColorStop(1, "rgba(75, 192, 192, 0.1)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw Grid Lines
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1;
            for (let i = 0; i <= numHorizontalLines; i++) {
                const y = (canvas.height / numHorizontalLines) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }

            for (let i = 0; i <= numVerticalLines; i++) {
                const x = (canvas.width / numVerticalLines) * i;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            // Iterate over all sensor keys and process each sensor's data
            sensorKeys.forEach(sensorKey => {
                const sensorData = dataPoints[sensorKey];

                const latestValue = sensorData[sensorData.length - 1].value;

                if (temperatureTitleElement) {
                    if (tempValueElement) {
                        let values = tempValueElement.textContent.split(" / ").filter(v => v); // Split by " / " and remove empty values

                        if (values.length >= 2) {
                            values.shift(); // Remove the oldest value, keeping only one
                        }

                        values.push(`${latestValue}${sensorData[0].unit}`); // Add the new value
                        tempValueElement.textContent = values.join(" | "); // Join without "/"
                    }
                    temperatureTitleElement.textContent = sensorData[0].nodeName;
                }


                // Validate if sensorData is an array and contains data
                if (!Array.isArray(sensorData) || sensorData.length === 0) {
                    console.error(`Data for sensor ${sensorKey} is empty or not an array!`);
                    return; // Skip to next sensor
                }

                // Log the data points for debugging
                console.log(`Temperature and Humidity Data for ${sensorKey}:`, sensorData);

                // Separate temperature and humidity data
                let temperatureData = sensorData.filter(dp => dp.unit.includes("°C") || dp.label.includes("Temperature"));
                let humidityData = sensorData.filter(dp => dp.unit.includes("%") || dp.label.includes("Humidity"));

                // Log the separated data
                console.log(`Temperature Data for ${sensorKey}:`, temperatureData);
                console.log(`Humidity Data for ${sensorKey}:`, humidityData);

                // Get min/max values for proper scaling (considering data for each sensor separately)
                const tempMin = Math.min(...temperatureData.map(dp => dp.value), 18);
                const tempMax = Math.max(...temperatureData.map(dp => dp.value), 25);

                const humMin = 0;
                const humMax = 100;

                // Function to scale Y-coordinates
                const scaleY = (value, min, max) =>
                    canvas.height - ((value - min) / (max - min)) * canvas.height;

                // Function to draw a line graph
                const drawGraph = (data, color, min, max) => {
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();

                    data.forEach((point, index) => {
                        const x = (canvas.width / (data.length - 1)) * index;
                        const y = scaleY(point.value, min, max);
                        if (index === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });

                    ctx.stroke();
                };

                // Draw Temperature Line
                if (temperatureData.length > 0) {
                    drawGraph(temperatureData, "#ffd700", tempMin, tempMax);
                }

                // Draw Humidity Line
                if (humidityData.length > 0) {
                    drawGraph(humidityData, "#4d94ff", humMin, humMax);
                }

                // Draw Data Points
                const drawPoints = (data, color, min, max) => {
                    data.forEach((point, index) => {
                        const x = (canvas.width / (data.length - 1)) * index;
                        const y = scaleY(point.value, min, max);

                        ctx.beginPath();
                        ctx.arc(x, y, 5, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.fill();
                        ctx.strokeStyle = "#fff";
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.font = "12px Arial";
                        ctx.fillStyle = "#fff";
                        ctx.textAlign = "center";
                        ctx.fillText(`${point.value}${point.unit}`, x, y - 10);
                        ctx.fillText(
                            new Date(point.timestamp).toLocaleTimeString(),
                            x,
                            canvas.height - 10
                        );
                    });
                };

                // Draw Temperature Points
                if (temperatureData.length > 0) {
                    drawPoints(temperatureData, "#ff6e6e", tempMin, tempMax);
                }

                // Draw Humidity Points
                if (humidityData.length > 0) {
                    drawPoints(humidityData, "#4d94ff", humMin, humMax);
                }
            });

            resolve();
        } catch (error) {
            console.error("Error drawing temperature/humidity chart:", error);
            reject(error);
        }
    });
}

// Generic Function to draw the Luminosity Sensor chart for the Dynamic widget

async function drawLumxSensorChart(dataPoints, widgetElement) {
    console.log("The data Point for the Luminosity Sensor !!!");
    console.log(dataPoints);

    // Extract the first key (e.g., "Lux_ESP32_001")
    const firstSensorKey = Object.keys(dataPoints)[0];

    // Get the actual data array for that sensor
    const sensorData = dataPoints[firstSensorKey];

    // Check if there are any data points for the sensor
    if (!Array.isArray(sensorData) || sensorData.length === 0) {
        console.error("No data points available to draw the chart.");
        return;
    }

    // Update the latest value in the widget
    const latestValue = sensorData[sensorData.length - 1].value;  // Adjusted for 'value' field
    const tempValueElement = widgetElement.querySelector("#temperature-value");
    const timestampElement = widgetElement.querySelector("#timestamp");
    const temperatureTitleElement = widgetElement.querySelector("#temperatureTitle");
    const canvas = widgetElement.querySelector("#chart");
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 150);

    if (tempValueElement) {
        tempValueElement.textContent = latestValue + " " + sensorData[sensorData.length - 1].unit;
    }
    if (timestampElement) {
        timestampElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
    }
    console.log("Illuminate Value !!");
    console.log(sensorData);

    if (temperatureTitleElement) {
        temperatureTitleElement.textContent = sensorData[0].label;
    }

    if (!canvas) {
        console.log("Canvas element not found.");
        return;
    }

    gradient.addColorStop(0, "rgba(255, 165, 0, 0.4)");
    gradient.addColorStop(1, "rgba(75, 192, 192, 0.1)");

    // Wait for Chart.js to load and render
    return new Promise(async (resolve, reject) => {
        try {
            // Dynamically import Chart.js and the date adapter
            await import('https://cdn.jsdelivr.net/npm/chart.js');
            await import('https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns');

            // Create the chart
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sensorData.map(point => new Date(point.timestamp)), // Convert timestamps to dates
                    datasets: [{
                        label: 'Illuminance (lx)',
                        data: sensorData.map(point => ({ x: point.timestamp, y: point.value })), // Chart.js uses objects for time-series
                        borderColor: '#ff9800',
                        backgroundColor: gradient,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'hour' // Customize as needed
                            },
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Illuminance (lx)'
                            }
                        }
                    },
                    animation: {
                        onComplete: () => {
                            resolve(); // Resolve the promise when rendering is complete
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error loading Chart.js or drawing chart:", error);
            reject(error);
        }
    });
}


// Call the EndPoint to saving the image (Dynamic Widget) inside the server 
async function saveImageToServer(imageData) {
    try {
        const response = await fetch("/save-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: imageData })
        });
        if (response.ok) {
            console.log("Response is Okay !!");
        }
    } catch (error) {
        throw new Error("Failed to save image on the server");
    }
}
FE.addBasicLoaderEvents = () => {
    ATON.on("NodeRequestFired", () => {
        $("#idLoader").show();
        //$('#idBGcover').show(); // TODO: is it worth? only first time
    });

    ATON.on("SceneJSONLoaded", () => {
        if (ATON.SceneHub.getDescription()) $("#btn-info").show();
        if (ATON.Nav.homePOV !== undefined) ATON.Nav.requestHome(1.0);

        // If we have an XPF network and no home set, move to first XPF
        if (ATON.XPFNetwork._list.length > 0 && ATON.Nav.homePOV === undefined) {
            ATON.XPFNetwork.setHomeXPF(0);
            ATON.XPFNetwork.requestTransitionByIndex(0);
        }
    });

    ATON.on("AllNodeRequestsCompleted", () => {
        $("#idLoader").hide();
        //$('#idBGcover').fadeOut("slow");

        if (ATON.CC.anyCopyrightFound()) $("#btn-cc").show();

        FE.computeSelectorRanges();
        //if (ATON.Nav.isOrbit()) ATON.SUI.setSelectorRadius( FE._selRefRadius );
        ATON.SUI.setSelectorRadius(Math.min(FE.STD_SEL_RAD, FE._selRefRadius));

        FE._handleHomeReq();
    });

    ATON.on("XR_support", (d) => {
        if (d.type === 'immersive-vr') {
            if (d.v) $("#btn-vr").show();
            else $("#btn-vr").hide();
        }
        /*
                if (d.type==='immersive-ar'){
                    if (d.v) $("#btn-ar").show();
                    else $("#btn-ar").hide();
                }
        */
    });

    // Semantic
    ATON.on("SemanticNodeHover", async (semid) => {
        // Load the configuration file
        await loadConfig();
        // Connect and Authenticate to the Server
        const accessToken = await login();
        // Inject the telemetryMap with the data needs
        const telemetryMap = buildTelemetryMap(accessToken);

        console.log("Check Semantic ID !!");
        console.log(semid);

        // Fetch telemetry data
        const sensorData = await telemetryMap[semid]();

        // Generate and display the widget
        const widgetElement = createDynamicWidget(semid, sensorData);
        // Declaration of image variable to store the path of each Image String
        let imageResult;
        // Getting a Semantic ID Node
        let S = ATON.getSemanticNode(semid);

        if (!accessToken) {
            console.error("Unable to retrieve access token.");
            return;
        }

        document.body.appendChild(widgetElement);

        console.log("Sensor Data");
        console.log(sensorData);

        // Get the first sensor key (e.g., "Temperature_Wf9Bj" or "Humidity_5un4a")
        const firstSensorKey = Object.keys(sensorData)[0];

        // Get the first data point of that sensor
        const firstDataPoint = sensorData[firstSensorKey][0];

        // Now safely check the unit
        if (firstDataPoint.unit.includes("lx")) {
            console.log("This is true !!!!");
            let drawChartPromise = drawLumxSensorChart(sensorData, widgetElement);
            await drawChartPromise;
        } else {
            console.log("This is false !!!!");

            let drawChartPromise = drawTemp_HumSensorChart(
                sensorData,
                widgetElement.querySelector("#chart"),
                widgetElement
            );
            await drawChartPromise;
        }

        try {
            const canvasImage = await html2canvas(widgetElement);
            const imageData = canvasImage.toDataURL("image/png");
            await saveImageToServer(imageData);
        } catch (error) {
            console.error("Error capturing or saving widget image:", error);
        }

        if (S === undefined) return;

        if (telemetryMap[semid]) {
            FE.showSemLabel("https://localhost:8083/images/widget.png");
            FE._bSem = true;
        }

        else {
            FE.showSemLabel(semid);
            FE._bSem = true;
        }

        S.highlight();
        $('canvas').css({ cursor: 'crosshair' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.hide();
    });
    ATON.on("SemanticNodeLeave", (semid) => {
        let S = ATON.getSemanticNode(semid);
        if (S === undefined) return;

        FE.hideSemLabel();
        FE._bSem = false;

        S.restoreDefaultMaterial();
        $('canvas').css({ cursor: 'grab' });

        if (ATON.SUI.gSemIcons) ATON.SUI.gSemIcons.show();
    });

    ATON.on("SemanticMaskHover", semid => {
        FE.showSemLabel(semid);
        FE._bSem = true;
        $('canvas').css({ cursor: 'crosshair' });
    });
    ATON.on("SemanticMaskLeave", semid => {
        FE.hideSemLabel();
        FE._bSem = false;
        $('canvas').css({ cursor: 'grab' });
    });


    //ATON.on("frame", FE._update);
    ATON.addUpdateRoutine(FE._update);
};

// Change the Semantic ID from a simple String Text to displaying an image
FE.showSemLabel = (txt) => {
    if (!FE._bShowSemLabel) return;

    if (txt.startsWith("https") && (txt.endsWith(".jpg") || txt.endsWith(".png") || txt.endsWith(".svg") || txt.endsWith(".jpeg") || txt.endsWith(".gif"))) {
        // If the input is an image URL, show an image
        $("#idPopupLabel").html(`<img src="${txt}" alt="Semantic Label Image" style="max-width: 300px; max-height: 500px;">`);
    } else {
        // If the input is not an image URL, show the text
        $("#idPopupLabel").html(txt);
    }
    $("#idPopupLabel").show();

    ATON.SUI.setInfoNodeText(txt);
};

FE.hideSemLabel = () => {
    $("#idPopupLabel").hide();
    $("#idPopupLabel").html("");
};

FE.controlLight = (b) => {
    FE._bControlLight = b;
    ATON.Nav.setUserControl(!b);
};

FE.controlSelectorScale = (b) => {
    FE._bControlSelScale = b;
    ATON._bPauseQuery = b;
    ATON.Nav.setUserControl(!b);
};

// Gizmo transforms
FE.attachGizmoToNode = (nid) => {
    if (ATON._gizmo === undefined) return;

    let N = ATON.getSceneNode(nid);
    if (N === undefined) return;

    ATON._gizmo.attach(N);
};

FE.useMouseWheelToScaleSelector = (f) => {
    if (f === undefined) f = 0.9;

    ATON.on("MouseWheel", (d) => {

        if (ATON._kModCtrl) {
            let ff = ATON.Nav.getFOV();

            if (d > 0.0) ff += 1.0;
            else ff -= 1.0;

            ATON.Nav.setFOV(ff);
            return;
        }

        if (ATON._kModShift) {
            let r = ATON.SUI.mainSelector.scale.x;

            if (d > 0.0) r *= f;
            else r /= f;

            if (r < FE._selRanges[0]) r = FE._selRanges[0];
            if (r > FE._selRanges[1]) r = FE._selRanges[1];

            ATON.SUI.setSelectorRadius(r);
            return;
        }
    });
};


/**
Load a scene. 
You can use ATON.on("SceneJSONLoaded", ...) to perform additional tasks when the scene JSON is fully loaded
@param {string} sid - the scene ID (e.g.: 'sample/venus')
*/
FE.loadSceneID = (sid, onSuccess) => {
    if (sid === undefined) return;

    let reqstr = ATON.PATH_RESTAPI_SCENE + sid;
    //if (ATON.SceneHub._bEdit) reqstr += ",edit";

    ATON.SceneHub.load(reqstr, sid, onSuccess);

    console.log(reqstr);
};

FE._update = () => {
    //if (ATON.XR._bPresenting) return;

    if (FE._bControlLight) {
        // Normalized
        const sx = ATON._screenPointerCoords.x;
        const sy = ATON._screenPointerCoords.y;
        //console.log(sx,sy);

        FE._cLightDir.x = -Math.cos(sx * Math.PI);
        FE._cLightDir.y = -sy * 4.0;
        FE._cLightDir.z = -Math.sin(sx * Math.PI);

        //FE._cLightDir.x = ATON.Nav._vDir.x + (sx);

        FE._cLightDir.normalize();

        ATON.setMainLightDirection(FE._cLightDir);
        //ATON.updateDirShadows();
    }

    // Immersive VR/AR
    if (ATON.XR._bPresenting) {
        let v = ATON.XR.getAxisValue(ATON.XR.HAND_R);

        if (!ATON.Photon._bStreamFocus) {
            let s = ATON.SUI._selectorRad;
            s += (v.y * 0.01);

            if (s > 0.001) ATON.SUI.setSelectorRadius(s);
        }
    }
    // Default
    else {
        if (ATON.Nav.isTransitioning() || ATON.Nav._bInteracting || ATON._bPauseQuery) {
            $("#idPopupLabel").hide();
            return;
        }

        if (FE._bSem && FE._bShowSemLabel) {
            $("#idPopupLabel").show();

            let x = ((ATON._screenPointerCoords.x) * 0.5) * window.innerWidth; //FE._canvas.width;
            let y = ((1.0 - ATON._screenPointerCoords.y) * 0.5) * window.innerHeight; //FE._canvas.height;
            y -= 55;

            $("#idPopupLabel").css('transform', "translate(" + x + "px, " + y + "px)");
        }
        else $("#idPopupLabel").hide();
    }


    /*
        if (FE._bControlSelScale){
            //const sx = ATON._screenPointerCoords.x;
            const f = ATON._screenPointerCoords.y;
    
            const r = ATON.SUI.mainSelector.scale.x + f;
            if (r > 0.0001) ATON.SUI.setSelectorRadius(r);
        }
    */
};


// HTML UI
//=======================================
// Sample basic UI setup
FE.uiBasicSetup = () => {
    FE.uiAddButton("idTopToolbar", "fullscreen", ATON.toggleFullScreen);
    if (ATON.Utils.isConnectionSecure()) FE.uiAddButton("idTopToolbar", "vr", ATON.XR.toggle);

    FE.uiAddButton("idBottomToolbar", "home", () => { ATON.Nav.requestHome(0.1); });
};

FE._uiSetupBase = () => {
    $("#idPopup").click(FE.popupClose);
    $("#idLoader").html("<img src='" + ATON.PATH_RES + "loader.png'>");

    $("body").prepend("<div class='atonPopupLabelContainer'><div id='idPopupLabel' class='atonPopupLabel'></div></div>");
    FE.hideSemLabel();
};

/**
Add generic icon button inside a specific div container
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
@param {string} icon - the icon. Can be shortname for default icons in /res/icons/ or URL to .png image
@param {function} onPress - function triggered when pressing the button
@param {string} tooltip - (optional) tooltip
*/
FE.uiAddButton = (idcontainer, icon, onPress, tooltip) => {
    let iconurl;
    let iconid;

    if (icon.endsWith(".png")) {
        iconurl = icon;
        iconid = icon.slice(0, -4);
    }
    else {
        iconurl = FE.PATH_RES_ICONS + icon + ".png";
        iconid = icon;
    }

    let elid = "btn-" + iconid;
    //let htmlcode = "<div id='"+elid+"' class='atonBTN' ><img src='"+iconurl+"'></div>";
    let el = $("<div id='" + elid + "' class='atonBTN' ><img src='" + iconurl + "'></div>");

    $("#" + idcontainer).append(el);

    if (onPress) el.click(onPress); //$("#"+elid).click( onPress );
    if (tooltip) el.attr("title", tooltip); //$("#"+elid).attr("title", tooltip);
};

FE.uiSwitchButton = (iconid, b) => {
    if (b) $("#btn-" + iconid).addClass("switchedON");
    else $("#btn-" + iconid).removeClass("switchedON");
};

FE.uiSetButtonHandler = (id, handler) => {
    $("#" + id).click(handler);
};

/**
Add home button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonHome = (idcontainer) => {
    FE.uiAddButton(idcontainer, "home", () => {
        ATON.Nav.requestHome(0.3);
    }, "Home viewpoint");
};

/**
Add back button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
@param {string} url - (optional) url
*/
FE.uiAddButtonBack = (idcontainer, url) => {
    FE.uiAddButton(idcontainer, "back", () => {
        if (url && url.length > 1 && url.startsWith("http:")) ATON.Utils.goToURL(url);
        else history.back();
    }, "Go Back");
};

/**
Add first-person button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonFirstPerson = (idcontainer) => {
    FE.uiAddButton(idcontainer, "fp", () => {
        if (ATON.Nav.isFirstPerson()) {
            ATON.Nav.setOrbitControl();
            //ATON.Nav.restorePreviousNavMode();
            FE.uiSwitchButton("fp", false);
        }
        else {
            ATON.Nav.setFirstPersonControl();
            FE.uiSwitchButton("fp", true);
        }
    }, "First-person navigation mode");

    if (ATON.Nav.isFirstPerson()) FE.uiSwitchButton("fp", true);
    else FE.uiSwitchButton("fp", false);
};

/**
Add immersive-VR button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonVR = (idcontainer) => {
    if (!ATON.Utils.isConnectionSecure()) return;

    FE.uiAddButton(idcontainer, "vr", () => {
        ATON.XR.toggle("immersive-vr");
    },
        "Immersive VR mode");

    if (!ATON.Utils.isVRsupported()) $("#btn-vr").hide();
};

/**
Add immersive-AR button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonAR = (idcontainer) => {
    if (!ATON.Utils.isConnectionSecure()) return;
    //if (!ATON.Utils.isARsupported()) return; //Not showing on mobile

    FE.uiAddButton(idcontainer, "ar", () => {
        if (ATON.Utils.isARsupported()) {
            ATON.XR.toggle("immersive-ar");
        }
        // Apple USDZ
        else {
            let fname = "scene.usdz";
            //if (ATON.SceneHub.currID) fname = 
            ATON.Utils.exportNode(ATON.getRootScene(), fname);
        }
    },
        "Immersive AR mode");

    //if (!ATON.Utils.isARsupported()) $("#btn-ar").hide();
};

/**
Add device-orientation button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonDeviceOrientation = (idcontainer) => {
    if (!ATON.Utils.isConnectionSecure()) return;
    if (!ATON.Utils.isMobile()) return;

    FE.uiAddButton(idcontainer, "devori", () => {
        if (ATON.Nav.isDevOri()) {
            //ATON.Nav.setOrbitControl();
            ATON.Nav.restorePreviousNavMode();
            FE.uiSwitchButton("devori", false);
        }
        else {
            ATON.Nav.setDeviceOrientationControl();
            FE.uiSwitchButton("devori", true);
        }
    }, "Device-orientation mode");

    if (ATON.Nav.isDevOri()) FE.uiSwitchButton("devori", true);
    else FE.uiSwitchButton("devori", false);
};

/**
Add Navigation button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonNav = (idcontainer) => {
    FE.uiAddButton(idcontainer, "nav", () => {
        FE.popupNav();
    }, "Navigation");
};

/**
Add talk button (Photon)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonTalk = (idcontainer) => {
    if (!ATON.Utils.isConnectionSecure()) return;

    FE.uiAddButton(idcontainer, "talk", () => {
        if (ATON.MediaFlow.isAudioRecording()) {
            ATON.MediaFlow.stopAudioStreaming();
            //FE.uiSwitchButton("talk",false);
            $("#btn-talk").removeClass("atonBTN-rec");
        }
        else {
            ATON.MediaFlow.startAudioStreaming();
            //FE.uiSwitchButton("talk",true);
            $("#btn-talk").addClass("atonBTN-rec");
        }
    }, "Talk ON/OFF");

    if (ATON.MediaFlow.isAudioRecording()) $("#btn-talk").addClass("atonBTN-rec");
    else $("#btn-talk").removeClass("atonBTN-rec");
};

/**
Add focus stream button (Photon)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonStreamFocus = (idcontainer) => {

    FE.uiAddButton(idcontainer, "focus", () => {
        if (ATON.Photon._bStreamFocus) {
            ATON.Photon.setFocusStreaming(false);
            $("#btn-focus").removeClass("atonBTN-rec");
        }
        else {
            ATON.Photon.setFocusStreaming(true);
            $("#btn-focus").addClass("atonBTN-rec");
        }
    }, "Focus streaming ON/OFF");

    if (ATON.Photon._bStreamFocus) $("#btn-focus").addClass("atonBTN-rec");
    else $("#btn-focus").removeClass("atonBTN-rec");
};

/**
Add main videopano control button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonMainVideoPanoPlayPause = (idcontainer) => {
    FE.uiAddButton(idcontainer, "playpause", () => {
        if (ATON._vpanoPlaying) {
            if (ATON._elPanoVideo) {
                ATON._elPanoVideo.pause();
                //FE.uiSwitchButton("playpause",false);
            }
        }
        else {
            if (ATON._elPanoVideo) {
                ATON._elPanoVideo.play();
                //FE.uiSwitchButton("playpause",true);
            }
        }
    }, "360 Video play/pause");

    if (ATON._elPanoVideo) $("#btn-playpause").show();
    else $("#btn-playpause").hide();
};

/**
Add QR-code button (hidden on localhost/offline scenarios)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonQR = (idcontainer) => {
    if (ATON.Utils.isLocalhost()) return;

    FE.uiAddButton(idcontainer, "qr", FE.popupQR, "QR-code");
};

/**
Add screenshot button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonScreenshot = (idcontainer) => {
    FE.uiAddButton(idcontainer, "sshot", FE.popupScreenShot, "Screenshot");
};

/**
Add scene information button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonInfo = (idcontainer) => {
    FE.uiAddButton(idcontainer, "info", ATON.FE.popupSceneInfo, "Scene information");
    $("#btn-info").hide();
};

/**
Add fullscreen button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonFullScreen = (idcontainer) => {
    FE.uiAddButton(idcontainer, "fullscreen", () => {
        ATON.toggleFullScreen();
    }, "Fullscreen");

    FE.uiSwitchButton("fullscreen", ATON.isFullscreen());
};

//TODO:
FE.uiAddKeywordsArea = (idcontainer, kwList, onAddKeyword, onRemoveKeyword) => {
    let htmlcode = "";
    htmlcode += "Add keyword: <input id='idKWordInput' list='lkwords' type='text' maxlength='100' size='20'><div class='atonBTN atonBTN-green' id='idKWadd'><img src='" + ATON.FE.PATH_RES_ICONS + "add.png'></div><br>";
    htmlcode += "<div id='idKWords'></div>";

    $("#" + idcontainer).html(htmlcode);

    FE.uiAttachInputFilterID("idKWordInput");

    // Request global keywords list
    $.getJSON(ATON.PATH_RESTAPI + "keywords/", (data) => {
        let ht = "<datalist id='lkwords'>";
        for (let s in data) ht += "<option>" + s + "</option>";
        ht += "</datalist>";

        $("#" + idcontainer).append(ht);
    });


    let kwsObj = {};

    let addKWtoBox = (kw) => {
        if (kwsObj[kw]) return; // check duplicate

        kw = kw.toLowerCase().trim();

        $("#idKWordInput").val(""); // clear

        kwsObj[kw] = 1;

        console.log("Added keyword " + kw);
        if (onAddKeyword) onAddKeyword(kw);

        // Populate box with remove handlers
        $("#idKWords").append("<div class='atonKeyword atonKeywordActivable' id='idkw-" + kw + "'>" + kw + "</div>");
        $("#idkw-" + kw).click(() => {
            $("#idkw-" + kw).remove();

            kwsObj[kw] = undefined;

            console.log("Removed keyword " + kw);
            if (onRemoveKeyword) onRemoveKeyword(kw);
        });
    };

    if (kwList) {
        for (let k in kwList) addKWtoBox(kwList[k]);
    }

    $("#idKWordInput").keypress(function (event) {
        let keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode != '13') return;

        let kw = $("#idKWordInput").val().toLowerCase().trim();
        if (!kw || kw.length < 3) return;

        addKWtoBox(kw);
    });

    $("#idKWadd").click(() => {
        let kw = $("#idKWordInput").val().toLowerCase().trim();
        if (!kw || kw.length < 3) return;

        addKWtoBox(kw);
    });
};

FE.uiAttachCollectionItemsToInput = (idinput, type) => {
    let htmlcontent = "";

    $("#" + idinput).attr("list", idinput + "-list");
    $("#" + idinput).attr("name", idinput + "-list");

    $.getJSON(ATON.PATH_RESTAPI + "c/" + type + "/", (data) => {
        //let folders = {};
        //SHU._cModelDirs = {};

        htmlcontent += "<datalist id='" + idinput + "-list'>";

        for (let m in data) {
            let ipath = data[m];
            htmlcontent += "<option value='" + ipath + "'>" + ipath + "</option>";

            //let F = SHU.getBaseFolder(ipath);
            //if (SHU._cModelDirs[F] === undefined) SHU._cModelDirs[F] = [];
            //SHU._cModelDirs[F].push(ipath)
            ///if (folders[F] === undefined) folders[F] = ipath;
            ///else folders[F] += ","+ipath;
        }

        //console.log(SHU._cModelDirs);

        ///for (let F in folders) htmlcontent += "<option value='"+folders[F]+"'>"+F+"*</option>";
        ///for (let F in folders) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";
        //for (let F in SHU._cModelDirs) htmlcontent += "<option value='"+F+"*'>"+F+"*</option>";

        htmlcontent += "</datalist>";

        $("#" + idinput).html(htmlcontent);
    });
};


// Get css class from vrc ID
FE.getVRCclassFromID = (uid) => {
    let i = (uid % 6);
    return "atonVRCu" + i;
};

// Setup VRC events
FE._setupVRCevents = () => {
    if (FE._bVRCsetup) return;

    ATON.on("VRC_IDassigned", (uid) => {
        $("#btn-vrc").addClass(FE.getVRCclassFromID(uid));

        // Selector color
        //let col = ATON.Photon.ucolors[uid%6];
        //ATON.MatHub.materials.selector.color = ATON.Photon.ucolors[uid%6];
        ATON.SUI.setSelectorColor(ATON.Photon.color);
        ATON.plight.color = ATON.Photon.color;

        FE.checkAuth((data) => {
            if (data.username !== undefined /*&& ATON.Photon._username===undefined*/) ATON.Photon.setUsername(data.username);
        });
    });

    ATON.on("VRC_SceneState", (sstate) => {
        let numUsers = ATON.Photon.getNumUsers();
        if (numUsers > 1) $("#idVRCnumusers").html(numUsers);
        else $("#idVRCnumusers").html("");

        console.log("Users: " + numUsers);
    });
    /*
        ATON.on("VRC_UserEnter", (uid)=>{
            let numUsers = ATON.Photon.getNumUsers();
            $("#idVRCnumusers").html(numUsers);
            console.log("Users: "+numUsers);
        });
        ATON.on("VRC_UserLeave", (uid)=>{
            let numUsers = ATON.Photon.getNumUsers();
            $("#idVRCnumusers").html(numUsers);
            console.log("Users: "+numUsers);
        });
    */
    ATON.on("VRC_Disconnected", () => {
        $("#btn-vrc").attr("class", "atonBTN");
        // Selector color
        //ATON.MatHub.materials.selector.color = ATON.MatHub.colors.green;
        ATON.SUI.setSelectorColor(ATON.MatHub.colors.defUI);

        ATON.MediaFlow.stopAllStreams();

        $("#idVRCnumusers").html("");
    });

    FE._bVRCsetup = true;
};

/**
Add Photon button (to connect/disconnect from collaborative sessions)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonVRC = (idcontainer) => {
    FE.uiAddButton(idcontainer, "vrc", () => {
        if (ATON.Photon.isConnected()) {
            FE.popupVRC();
        }
        else {
            ATON.Photon.connect();
        }
    }, "Photon (collaborative session)");

    $("#btn-vrc").append("<span id='idVRCnumusers' class='atonVRCcounter'></span>");

    //$("<div id='idVRCchatPanel' class='atonVRCsidePanel'>xxx</div>").appendTo(document.body);
    //$("#idVRCchatPanel").append(ATON.Photon._elChat);
    FE._setupVRCevents();

    if (ATON.Photon.uid !== undefined) $("#btn-vrc").addClass(FE.getVRCclassFromID(ATON.Photon.uid));
    else $("#btn-vrc").attr("class", "atonBTN");
};

/**
Add user button (login/logout)
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonUser = (idcontainer) => {
    FE.uiAddButton(idcontainer, "user", () => {
        FE.popupUser();
    }, "User");

    FE.checkAuth((r) => {
        if (r.username !== undefined) $("#btn-user").addClass("switchedON");
        else $("#btn-user").removeClass("switchedON");
    });
};

FE.uiSetEditMode = (b, idcontainer) => {
    ATON.SceneHub._bEdit = b;
    FE.uiSwitchButton("edit", b);

    let canvas = ATON._renderer.domElement;

    if (b) {
        //$("body").addClass("edit");
        $("#" + idcontainer).addClass("atonToolbar-bg-edit");
    }
    else {
        //$("body").removeClass("edit");
        $("#" + idcontainer).removeClass("atonToolbar-bg-edit");
    }
};

/**
Add persistent editing mode button
@param {string} idcontainer - the id of html container (e.g.: "idTopToolbar")
*/
FE.uiAddButtonEditMode = (idcontainer) => {
    FE.uiAddButton(idcontainer, "edit", () => {
        FE.checkAuth((data) => {
            if (data.username !== undefined) {
                if (ATON.SceneHub._bEdit) {
                    FE.uiSetEditMode(false, idcontainer);
                }
                else {
                    FE.uiSetEditMode(true, idcontainer);
                }

                console.log("Persistent Edit Mode: " + ATON.SceneHub._bEdit);
            }

            else {
                FE.popupUser();
            }
        });
    }, "Persistent Edit Mode");

    if (ATON.SceneHub._bEdit) FE.uiSwitchButton("edit", true);
    else FE.uiSwitchButton("edit", false);
};

/**
Add UI Profile to the front-end
@param {string} id - profile ID
@param {function} uiFunction - function that creates UI (HTML or SUI elements) for that profile
*/
FE.uiAddProfile = (id, uiFunction) => {
    if (typeof uiFunction !== 'function') return;

    FE._uiProfiles[id] = uiFunction;
};

/**
Load specific UI Profile for the front-end
@param {string} id - profile ID
*/
FE.uiLoadProfile = (id) => {
    let f = FE._uiProfiles[id];
    if (f === undefined) return;

    f();
    FE._uiCurrProfile = id;
    console.log("Loaded UI Profile: " + FE._uiCurrProfile);
};

FE.getCurrentUIP = () => {
    return FE._uiCurrProfile;
};

FE.attachHandlerToButton = (idbutton, h) => {
    if (h === undefined) return;

    $("#" + idbutton).click(() => { h(); });
};

// Attach ID validator to given input field
FE.uiAttachInputFilterID = (inputid) => {
    $("#" + inputid).on('keyup change input', () => {
        let value = $("#" + inputid).val();
        let regReplace = new RegExp('[^A-Za-z0-9-_]', 'ig');
        $("#" + inputid).val(value.replace(regReplace, ''));

    });
};

// Utility to switch a node in a graph
FE.switchNode = (nid, value, type) => {
    let N = undefined;

    if (type === ATON.NTYPES.SEM) N = ATON.getSemanticNode(nid);
    else N = ATON.getSceneNode(nid);

    if (N === undefined) return;

    N.toggle(value);

    ATON.fireEvent("FE_NodeSwitch", { nid: nid, t: type, v: value });
    //console.log("XXX");
};

// Graphs
FE.uiCreateGraph = (type) => {
    let nodes = ATON.snodes;
    if (type === ATON.NTYPES.SEM) nodes = ATON.semnodes;

    let htmlcontent = "";
    for (let nid in nodes) {
        let N = nodes[nid];

        let chk = N.visible ? "checked" : "";
        if (nid !== ".") {
            htmlcontent += "<input type='checkbox' " + chk + " onchange=\"ATON.FE.switchNode('" + nid + "',this.checked," + type + ");\">" + nid;

            //TODO: gizmos
            //htmlcontent += "<div class='atonBTN atonSmallIcon' onclick=\"ATON.FE.attachGizmoToNode('"+nid+"');\"><img src='"+FE.PATH_RES_ICONS+"axes.png'></div>";

            htmlcontent += "<br>";
        }

        //htmlcontent += "<div class='atonBTN atonBTN-text'></div>";
    }

    return htmlcontent;
};

FE.setupBasicUISounds = () => {
    FE.auLib = {};

    FE.auLib.switch = new Audio(ATON.PATH_RES + "audio/switch.wav");
    FE.auLib.switch.loop = false;
};

FE.playAudioFromSemanticNode = (semid) => {
    //if (FE._auSemNodePlaying) return;
    if (semid === undefined) return;

    let S = ATON.getSemanticNode(semid);
    if (S === undefined) return;

    let au = S.getAudio();
    if (au === undefined) return;

    if (typeof au === "string" && !au.startsWith("data:audio")) {
        au = ATON.Utils.resolveCollectionURL(au);
    }

    if (FE._auSemNode === undefined || FE._auSemNode === null) FE._auSemNode = new THREE.Audio(ATON.AudioHub._listener);
    else FE._auSemNode.stop();

    ATON.AudioHub._loader.load(au, (buffer) => {
        FE._auSemNode.setBuffer(buffer);
        FE._auSemNode.setLoop(false);
        //FE._auSemNode.setVolume( 0.5 );
        //FE._auSemNode.setPlaybackRate(0.9);
        FE._auSemNode.play();
    });

    /*
        if (FE._auSemNode === undefined) FE._auSemNode = new Audio();
        
        FE._auSemNodePlaying = true;
        FE._auSemNode.src = au;
        //FE._auSemNode.type = ATON.MediaFlow.auType;
        FE._auSemNode.play();
    
        FE._auSemNode.onended = ()=>{
            FE._auSemNodePlaying = false;
        };
    */
};


// Popups
//===================================================================

/**
Show a modal popup.
@param {string} htmlcontent - The HTML5 content for the popup
@param {string} cssClasses - (optional) css classes for the popup
*/
FE.popupShow = (htmlcontent, cssClasses) => {
    if (FE._bPopup) return false;

    FE._tPopup = Date.now();

    //console.log("SHOW");

    let clstr = "atonPopup ";
    if (cssClasses) clstr += cssClasses;

    let htcont = "<div id='idPopupContent' class='" + clstr + "'>";
    htcont += htmlcontent + "</div>"

    FE._bPopup = true;
    ATON._bListenKeyboardEvents = false;

    $('#idPopup').html(htcont);
    $('#idPopupContent').click((e) => { e.stopPropagation(); });
    $('#idPopup').show();

    if (FE.popupBlurBG > 0) {
        //ATON._renderer.setPixelRatio( FE.popupBlurBG );
        ATON._renderer.domElement.style.filter = "blur(" + FE.popupBlurBG + "px)"; //`blur(${blur * 5}px)`;
        //ATON._renderer.render( ATON._mainRoot, ATON.Nav._camera );
    }

    ATON._bPauseQuery = true;
    //ATON.renderPause();

    $("#idTopToolbar").hide();
    $("#idBottomToolbar").hide();
    $("#idBottomRToolbar").hide();
    $("#idPoweredBy").hide();

    //$("#idPopup").click( FE.popupClose );

    return true;
};

/**
Close current popup
*/
FE.popupClose = (bNoAnim) => {
    let dt = Date.now() - FE._tPopup;
    if (dt < FE.POPUP_DT) return; // Avoid capturing unwanted tap events

    FE._bPopup = false;

    //console.log("CLOSE");

    //ATON.renderResume();
    ATON._bListenKeyboardEvents = true;

    if (FE.popupBlurBG > 0) {
        //ATON.resetPixelDensity();
        ATON._renderer.domElement.style.filter = "none";
    }

    if (bNoAnim === true) $("#idPopup").hide();
    else $("#idPopup").hide();
    //$("#idPopup").empty();

    ATON._bPauseQuery = false;

    $("#idTopToolbar").show();
    $("#idBottomToolbar").show();
    $("#idBottomRToolbar").show();
    $("#idPoweredBy").show();

    ATON.focusOn3DView();
};

FE.subPopup = (popupFunc) => {
    ATON.FE.popupClose();
    //setTimeout( popupFunc, FE.POPUP_DELAY);
    popupFunc();
};

FE.popupQR = () => {
    let htmlcontent = "<div class='atonPopupTitle'>Share</div>";
    htmlcontent += "<div class='atonQRcontainer' id='idQRcode'></div><br><br>";

    if (!ATON.FE.popupShow(htmlcontent)) return;

    let url = window.location.href;
    new QRCode(document.getElementById("idQRcode"), url);
};

FE.popupScreenShot = () => {
    let cover = ATON.Utils.takeScreenshot(256);

    FE.checkAuth((r) => {

        let htmlcontent = "<div class='atonPopupTitle'>Capture</div>";
        htmlcontent += "This is a preview of what your screenshot will look like:<br><br>";
        htmlcontent += "<img src='" + cover.src + "'><br>";
        htmlcontent += "Resolution: <input id='isShotSize' type='number' min='100' max='4000' value='256'>px<br>";

        htmlcontent += "<div class='atonBTN atonBTN-horizontal' id='btnScreenShot'><img src='" + FE.PATH_RES_ICONS + "sshot.png'>Screenshot</div>";

        htmlcontent += "<div class='atonBTN atonBTN-horizontal' id='btnScreenRec'><img src='" + FE.PATH_RES_ICONS + "recscreen.png'>Record video</div>";

        if (r.username !== undefined) {
            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal' id='btnSetCover'>Set as Cover</div>";
            /*
            htmlcontent += "<div class='atonBTN' id='btnSetCover' style='width:220px; height:220px; padding:5px'>";
            htmlcontent += "<img src='"+cover.src+"'><br>";
            htmlcontent += "Set as Cover</div>";
            */
        }

        if (!ATON.FE.popupShow(htmlcontent)) return;

        if (ATON.MediaFlow._bScreenRec) $("#btnScreenRec").addClass("atonBTN-rec");
        else $("#btnScreenRec").removeClass("atonBTN-rec");

        $("#btnScreenShot").click(() => {
            let s = parseInt($('#isShotSize').val());
            if (s < 100) return;

            ATON.FE.popupClose();

            let img = ATON.Utils.takeScreenshot(s, "shot.png");
        });

        $("#btnScreenRec").click(() => {
            if (!ATON.MediaFlow._bScreenRec) ATON.MediaFlow.startScreenRecording();
            //else 

            ATON.FE.popupClose();
        });

        $("#btnSetCover").click(() => {
            ATON.FE.popupClose();

            ATON.Utils.postJSON(ATON.PATH_RESTAPI + "cover/scene/", { sid: ATON.SceneHub.currID, img: cover.src }, (r) => {
                console.log(r);
            });

        });
    });
};

FE.popupVRC = () => {
    let htmlcontent = "";
    let numUsers = ATON.Photon.getNumUsers();

    if (numUsers > 1) htmlcontent += "<div class='atonPopupTitle'>Collaborative Session (" + numUsers + " users)</div>";
    else htmlcontent += "<div class='atonPopupTitle'>Collaborative Session</div>";

    htmlcontent += "<div id='idCollabTools' style='display:inline'></div>";

    // Username
    //htmlcontent += "Your username in this collaborative session is:<br>";
    htmlcontent += "<input id='idVRCusername' type='text' size='10' placeholder='username...' style='display:none'>";
    htmlcontent += "<div id='idVRCusernameBTN' class='atonBTN' style='width:150px; display:none'>" + ATON.Photon._username + "</div>";
    htmlcontent += "<div class='atonBTN atonBTN-text' id='idVRCdisconnect'><img src='" + ATON.FE.PATH_RES_ICONS + "exit.png'>LEAVE</div>";

    htmlcontent += "<div id='idChatBoxPopup' style='display:block'></div>";
    htmlcontent += "<input id='idVRCmsg' style='width:90%;margin:auto' type='text' placeholder='message...'>";

    if (!ATON.FE.popupShow(htmlcontent, "atonPopupLarge")) return;

    // Tools
    ATON.checkAuth((u) => {
        console.log(u)

        if (!ATON.MediaFlow._bCamStream) ATON.FE.uiAddButton("idCollabTools", "screenshare", () => {
            if (!ATON.MediaFlow._bScreenStream) $("#btn-screenshare").removeClass("atonBTN-rec");
            else $("#btn-screenshare").addClass("atonBTN-rec");

            ATON.MediaFlow.startOrStopScreenStreaming();
            ATON.FE.popupClose();

        }, "Share your screen with other participants");

        if (!ATON.MediaFlow._bScreenStream && ATON.MediaFlow.hasVideoInput()) ATON.FE.uiAddButton("idCollabTools", "camera", () => {
            if (!ATON.MediaFlow._bCamStream) $("#btn-camera").removeClass("atonBTN-rec");
            else $("#btn-camera").addClass("atonBTN-rec");

            ATON.MediaFlow.startOrStopCameraStreaming();
            ATON.FE.popupClose();

        }, "Share your camera with other participants");

        if (ATON.MediaFlow._bScreenStream) $("#btn-screenshare").addClass("atonBTN-rec");
        else $("#btn-screenshare").removeClass("atonBTN-rec");
        if (ATON.MediaFlow._bCamStream) $("#btn-camera").addClass("atonBTN-rec");
        else $("#btn-camera").removeClass("atonBTN-rec");
    });


    if (ATON.Photon._username === undefined) {
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    }
    else {
        $('#idVRCusername').val(ATON.Photon._username);
        $('#idVRCusername').hide();
        $('#idVRCusernameBTN').show();
    }

    if (ATON.Photon.uid !== undefined) $('#idVRCusernameBTN').addClass("atonVRCu" + (ATON.Photon.uid % 6));

    $("#idChatBoxPopup").append(ATON.Photon._elChat);

    $("#idVRCmsg").keypress((e) => {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13') {
            let str = $("#idVRCmsg").val();
            ATON.Photon.setMessage(str);
            $("#idVRCmsg").val("");
            //$("#idChatBox:first-child").scrollTop( $("#idChatBox:first-child").height() );
        }
    });

    $("#idVRCusername").keypress((e) => {
        let keycode = (e.keyCode ? e.keyCode : e.which);
        if (keycode == '13') {
            let str = $("#idVRCusername").val();
            ATON.Photon.setUsername(str);

            $('#idVRCusername').hide();
            $('#idVRCusernameBTN').html(ATON.Photon._username);
            $('#idVRCusernameBTN').show();
        }
    });

    $("#idVRCusernameBTN").click(() => {
        $('#idVRCusername').show();
        $('#idVRCusernameBTN').hide();
    });

    $("#idVRCdisconnect").click(() => {
        ATON.Photon.disconnect();
        ATON.FE.popupClose();
    });
};

// User auth
FE.checkAuth = (onReceive) => {
    ATON.Utils.checkAuth((data) => {
        FE._userAuth = data;
        //console.log(FE._userAuth);

        if (data.username !== undefined) {
            $("#btn-user").addClass("switchedON");
            if (ATON.Photon._username === undefined) ATON.Photon.setUsername(data.username);
        }
        else {
            $("#btn-user").removeClass("switchedON");
        }

        if (onReceive) onReceive(data);
    });
};

/*
FE.checkAuth = (onReceive)=>{
    $.ajax({
        type: 'GET',
        url: ATON.PATH_RESTAPI+"user",
        xhrFields: { withCredentials: true },            
        dataType: 'json',

        success: (data)=>{
            FE._userAuth = data;
            //console.log(FE._userAuth);

            if (data.username !== undefined){
                $("#btn-user").addClass("switchedON");
                if (ATON.Photon._username === undefined) ATON.Photon.setUsername(data.username);
            }
            else {
                $("#btn-user").removeClass("switchedON");
            }

            onReceive(data);
        }
    });
};
*/

/*
FE.logout = ( onSuccess )=>{
    $.get(ATON.PATH_RESTAPI+"logout", (r)=>{
        ATON.SceneHub.setEditMode(false);
        ATON.fireEvent("Logout");
        
        if (onSuccess) onSuccess();
    });
};
*/

FE.popupUser = () => {

    FE.checkAuth((r) => {

        // We are already logged
        if (r.username !== undefined) {
            let htmlcontent = "<img src='" + FE.PATH_RES_ICONS + "user.png'><br>";
            htmlcontent += "<b>'" + r.username + "'</b><br><br>";

            if (Object.keys(FE._uiProfiles).length > 0) {
                htmlcontent += "UI Profile:<br><div class='select' style='width:150px;'><select id='idUIProfiles'>";

                for (let uip in FE._uiProfiles) {
                    htmlcontent += "<option value='" + uip + "'>" + uip + "</option>";
                }
                htmlcontent += "</select><div class='selectArrow'></div></div><br><br>";
            }

            htmlcontent += "<div class='atonBTN atonBTN-red atonBTN-text atonBTN-horizontal' id='idLogoutBTN'>LOGOUT</div>";

            if (!ATON.FE.popupShow(htmlcontent)) return;

            if (FE._uiCurrProfile) {
                console.log(FE._uiCurrProfile);
                $("#idUIProfiles").val(FE._uiCurrProfile);
            }

            $("#idLogoutBTN").click(() => {
                $.get(ATON.PATH_RESTAPI + "logout", (r) => {
                    console.log(r);

                    ATON.SceneHub.setEditMode(false);
                    FE.uiSwitchButton("edit", false);

                    ATON.fireEvent("Logout");
                    $("#btn-user").removeClass("switchedON");
                });

                ATON.FE.popupClose();
            });

            $("#idSHUscenes").click(() => {
                ATON.Utils.goToURL("/shu/scenes/");
            });
            $("#idSHUuser").click(() => {
                ATON.Utils.goToURL("/shu/auth/");
            });

            $("#idUIProfiles").on("change", () => {
                let uip = $("#idUIProfiles").val();
                FE.uiLoadProfile(uip);
                ATON.FE.popupClose();
            });

        }

        // Not logged in
        else {
            let htmlcontent = "<img src='" + FE.PATH_RES_ICONS + "user.png'><br>";
            htmlcontent += "username:<input id='idUsername' type='text' maxlength='15' size='15' ><br>";
            htmlcontent += "password:<input id='idPassword' type='password' maxlength='15' size='15' ><br>";

            htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-text atonBTN-horizontal' id='idLoginBTN'>LOGIN</div>";

            if (!ATON.FE.popupShow(htmlcontent)) return;

            $("#idLoginBTN").click(() => {
                let jstr = JSON.stringify({
                    username: $("#idUsername").val(),
                    password: $("#idPassword").val()
                });

                $.ajax({
                    url: ATON.PATH_RESTAPI + "login",
                    type: "POST",
                    data: jstr,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",

                    success: (r) => {
                        console.log(r);
                        if (r) {
                            ATON.fireEvent("Login", r);
                            $("#btn-user").addClass("switchedON");
                            ATON.FE.popupClose();
                        }
                    }

                }).fail((err) => {
                    //console.log(err);
                    $("#idLoginBTN").html("LOGIN FAILED");
                    $("#idLoginBTN").attr("class", "atonBTN atonBTN-red");
                });
            });
        }
    });
};

/*
FE.popupPOV = ()=>{
    let htmlcontent = "<h1>Viewpoint</h1>";

    htmlcontent += "<div class='select' style='width:200px;'><select id='idPOVmode'>";
    htmlcontent += "<option value='0'>Set as Home viewpoint</option>";
    htmlcontent += "<option value='1'>Add viewpoint</option>";
    htmlcontent += "</select><div class='selectArrow'></div></div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnPOV' style='width:90%'>OK</div>"; // <img src='"+FE.PATH_RES_ICONS+"pov.png'>

    if ( !ATON.FE.popupShow(htmlcontent) ) return;

    let mode = $("#idPOVmode").val();
};
*/

FE.popupSceneInfo = () => {
    let head = ATON.SceneHub.getTitle();
    if (head === undefined) head = ATON.SceneHub.currID;

    let descr = ATON.SceneHub.getDescription();

    let htmlcontent = "<div class='atonPopupTitle'>" + head + "</div>";
    if (descr) htmlcontent += "<div class='atonPopupDescriptionContainer'>" + JSON.parse(descr) + "</div>";

    htmlcontent += "<div class='atonBTN atonBTN-green' id='btnOK' style='width:90%'>OK</div>";

    if (!ATON.FE.popupShow(htmlcontent)) return;

    $("#btnOK").click(() => {
        ATON._onUserInteraction();
        ATON.FE.popupClose();
    });
};

FE.computeSelectorRanges = () => {
    //let sceneBS = ATON.getRootScene().getBound();
    //let r = sceneBS.radius;
    let r = ATON.bounds.radius;

    if (r <= 0.0) return;

    FE._selRanges[0] = r * 0.001;
    FE._selRefRadius = r * 0.01;
    FE._selRanges[1] = r * 0.5;

    //console.log("3D Selector ranges: "+FE._selRanges[0]+", "+FE._selRanges[1]);
};

FE.popupSelector = () => {
    let htmlcontent = "<div class='atonPopupTitle'>3D Selector</div>";

    let rad = ATON.SUI.getSelectorRadius();
    let hr = ATON.Utils.getHumanReadableDistance(rad);

    FE.computeSelectorRanges();

    htmlcontent += "Radius (<span id='idSelRadTxt'>" + hr + "</span>):<br>";
    htmlcontent += "<input id='idSelRad' type='range' min='" + FE._selRanges[0] + "' max='" + FE._selRanges[1] + "' step='" + FE._selRanges[0] + "' style='width:90%'>";

    if (!ATON.FE.popupShow(htmlcontent, "atonPopupLarge")) return;

    $("#idSelRad").val(rad);

    $("#idSelRad").on("input change", () => {
        let r = parseFloat($("#idSelRad").val());

        ATON.SUI.setSelectorRadius(r);
        $("#idSelRadTxt").html(ATON.Utils.getHumanReadableDistance(r));
    });
};

FE.popupNav = () => {
    let htmlcontent = "<div class='atonPopupTitle'>Navigation</div>";

    //htmlcontent += "<div id='idNavModes'></div>";

    htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
    htmlcontent += "<div style='display:inline-block; width:60px; float:left' id='idNMfp'></div>";
    htmlcontent += "<div style='text-align:left'>Switch between first-person and orbit navigation mode</div>";
    htmlcontent += "</div>";

    if (ATON.Utils.isConnectionSecure()) {
        htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
        htmlcontent += "<div style='display:inline-block; width:60px; float:left' id='idNMvr'></div>";
        htmlcontent += "<div style='text-align:left'>Immersive VR mode</div>";
        htmlcontent += "</div>";

        if (ATON.Utils.isMobile()) {
            htmlcontent += "<div style='display:block; width:90%; min-height:50px; vertical-align:top'>";
            htmlcontent += "<div style='display:inline-block; width:60px; float:left' id='idNMdevori'></div>";
            htmlcontent += "<div style='text-align:left'>Enable or disable device-orientation mode</div>";
            htmlcontent += "</div>";
        }
    }

    if (!FE.popupShow(htmlcontent)) return;

    FE.uiAddButtonFirstPerson("idNMfp");
    FE.uiAddButtonDeviceOrientation("idNMdevori");
    FE.uiAddButtonVR("idNMvr");
};

// experimental
FE.popupModalToken = (msg, func) => {
    if (func === undefined) return;

    ATON.FE.popupClose(); // Close any existing popup

    let htmlcontent = "<div class='atonPopupTitle'>Token Required</div>";
    if (msg) htmlcontent += msg;
    htmlcontent += "<br><input id='idTokStr' style='width:90%' type='text' placeholder='paste your token here'><br>";

    htmlcontent += "<br><div class='atonBTN atonBTN-green atonBTN-horizontal atonBTN-text' id='btnTokenOK'>OK</div>";

    if (!FE.popupShow(htmlcontent)) return;

    $("#btnTokenOK").click(() => {
        let tok = $("#idTokStr").val();
        if (tok === undefined || tok.length < 2) return;

        ATON.FE.popupClose();

        func(tok);
    });
};

FE.popupNewNode = (type) => {
    if (type === undefined) type = ATON.NTYPES.SCENE;

    let htmlcontent = "";

    if (type === ATON.NTYPES.SCENE) htmlcontent = "<div class='atonPopupTitle'>New Scene Node</div>";
    if (type === ATON.NTYPES.SEM) htmlcontent = "<div class='atonPopupTitle'>New Semantic Node</div>";

    htmlcontent += "<strong>ID</strong>: <input id='idNID' type='text' size='20' placeholder='node-id'><br>";
    htmlcontent += "<div class='atonBTN atonBTN-green atonBTN-horizontal atonBTN-text' id='btnNewNID'><img src='" + ATON.FE.PATH_RES_ICONS + "add.png'>Add</div><br>";

    if (!FE.popupShow(htmlcontent)) return;

    $("#btnNewNID").click(() => {
        let nnid = $("#idNID").val().trim();
        if (nnid === undefined || nnid.length < 3) return;

        let N = new ATON.Node(nnid, type);
        N.attachToRoot();

        // TODO: send graph edits
    });
};

export default FE;