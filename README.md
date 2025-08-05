<<<<<<< HEAD
# SENNSE-3D Platform Tutorial: From 3D Model to Immersive VR Scene

Welcome to the **SENNSE-3D Platform** tutorial a comprehensive, step-by-step guide designed to help you to build an interactive 3D scenes enhanced with real-time sensor data. Whether you're a digital heritage professional or a tech enthusiast, this guide will walk you through the process from model upload to immersive visualization.

---

## 🔍 Overview

**SENNSE-3D** is a web-based application based on the open-source platform ATON that enables users to upload 3D models, configure smart sensors, and visualize live data in immersive environments.

This tutorial covers:

* Accessing the SENNSE-3D platform
* Uploading and rendering 3D models
* Designing and injecting sensor networks
* Real-time data annotation and visualization

---

## 🔗 Accessing the SENNSE-3D Platform

1. Open your browser and go to:
   [https://3d.sennse.ispc.cnr.it](https://3d.sennse.ispc.cnr.it)

2. **Login Credentials**:

   * **Username**: `*****`
   * **Password**: `*********`

3. Upon logging in, the dashboard will appear. If no scenes are present, the view will be empty.

---

## 🌍 Creating a New Scene with a 3D Model

1. Click on the **"New Scene"** green button.

2. In the interface that appears:

   * Click **"Add New Model"**
   * Upload your 3D model file from your local machine
   * ⚠️ *Tip*: Avoid large files to ensure smooth upload and rendering

3. Once uploaded successfully, a pop-up confirmation will appear.

4. Locate your model using the search bar, then click the **"+"** icon to add it to the scene list.

5. Choose an environment:

   * Select a **Panorama** background or enable **Automatic LightProb** for auto-lighting

6. Click **"Create Scene"** to finalize. You'll be redirected to your rendered 3D scene.

---

## 💡 Switching to Editor Mode

1. In the top-left corner, click the **Profile Icon**
2. Switch your role from **Default** to **Editor**
3. This unlocks additional editing features in the bottom menu

---

## 🛠️ Sensor Network Configuration

1. Click on the **"SENNSE Interfacing"** option

2. Authenticate using:

   * **Email**: `******@sennse.ispc.cnr.it`
   * **Password**: `******66!`

3. You'll enter the **Design** mode

   * Click **"Add New Device"** to begin
   * Select a device from the dropdown
   * Choose related sensors for the selected device

4. To add multiple devices, repeat the above steps

5. Preview your setup using **"Visualize Graph"**

   * Use **Full Screen** for complex sensor networks

6. Once the design is complete, click **"SENNSE Injection"** to push the configuration into your scene

---

## 📏 Annotating the 3D Scene with Sensors

1. Exit the SENNSE interface

2. Choose a shape for annotation:

   * **Basic Sphere** or **Convex Shape** from the bottom menu

3. Click on a position on the model to place the annotation

4. In the pop-up:

   * Select a device
   * Choose a sensor (used sensors will be excluded)

5. Click **"Add"** to save the annotation

---

## 📊 Visualizing Real-Time Sensor Data

* Hover over an annotation to view sensor details

  * A widget will display **current data**
  * Historical data is shown via a **line chart**

* Devices using data loggers may show **blinking annotations** in different colors to indicate active data flow

---

## ✉️ Best Practices & Notes

* Use optimized 3D models (preferably < 50MB)
* Place annotations carefully to reflect real-world sensor positions
* Avoid overcrowding with too many sensors for better performance
* Save your work regularly


---

> Crafted by \[Dali Jaziri] | Powered by ISPC Lecce | Last updated: July 2025
=======
# ATON 3.0 framework

[Official ATON website](https://osiris.itabc.cnr.it/aton/) | 
[Telegram open-group](https://t.me/ATON_Framework) | 
[Live examples](https://aton.ispc.cnr.it/examples/) | 
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/phoenixbf/aton)

![Header](./public/res/aton-header.jpg)

[ATON framework](http://osiris.itabc.cnr.it/aton/) - designed, developed and coordinated by B. Fanini (CNR ISPC, ex ITABC) - allows to create scalable, collaborative and *cross-device* 3D Web-Apps (mobile, desktop and immersive VR) targeting Cultural Heritage exploiting modern web standards, without any installation required for final users. ATON offers:
* Responsive, adaptive and scalable presentation of interactive 3D content (mobile, desktop PCs, museum kiosks, immersive VR devices)
* Real-time collaborative multi-user features (*Photon* component)
* Immersive VR (WebXR) for 3-DOF and 6-DOF devices
* Multi-resolution for massive 3D datasets through OGC standards
* Multi-touch interfaces
* Spatial UI (3D labels, buttons, etc...) targeting immersive XR sessions
* Built-in navigation modes, including *orbit*, *first-person*, *device-orientation* and *immersive VR*
* 3D semantic annotations including free-form volumetric shapes
* Fast, real-time 3D queries on visible and semantic graphs and UI nodes
* Built-in front-end ("Hathor") with WYSIWYG rich HTML5 content editor
* Built-in profiler (automatically adapt 3D presentation to different devices)
* Built-in services to access 3D collections and scenes for multiple users via authentication
* Built-in export of 3D scenes/models using different formats (gltf/glb, obj, usd,...) right from the browser
* Event-driven API for fully customizable events (local and synchronous collaborative contexts)
* 360 panoramas and virtual tours
* Physically-Based Rendering (PBR) for advanced materials and custom shaders for complex representations, including latest extensions
* Advanced lighting, including IBL and multiple Light Probes
* Camera/POV transitions, viewpoint handling and custom navigation constraints
* Complex scene-graph manipulation, hierarchical culling, instancing, composition and cascading transformations
* Scalable deployment, from low-cost SBCs (e.g. Raspberry Pi) to large infrastructures
* Multi-temporal (4D) visualization
* Easily extensible through *plug&play* apps architecture and plugins

The framework also provides a *built-in* front-end and services based on [Node.js](https://nodejs.org/) for deployment on servers, infrastructures or single-board computers; real-time collaborative multi-user features and support for remote/immersive visual analytics.

## Getting started (quick)
1) Install [Node.js](https://nodejs.org/) for your operating system.

2) Install (or update) required modules from main ATON folder by typing:
```
npm install
```

3) Deploy ATON *main service* on local machine simply using:
```
npm start
```

4) Open http://localhost:8080 on your browser.

# Citation
You can cite ATON framework using [this open-access publication](https://www.mdpi.com/2076-3417/11/22/11062) with the following BibTeX entry:
```
@article{fanini2021aton,
  title={ATON: An Open-Source Framework for Creating Immersive, Collaborative and Liquid Web-Apps for Cultural Heritage},
  author={Fanini, Bruno and Ferdani, Daniele and Demetrescu, Emanuel and Berto, Simone and d’Annibale, Enzo},
  journal={Applied Sciences},
  volume={11},
  number={22},
  pages={11062},
  year={2021},
  publisher={Multidisciplinary Digital Publishing Institute}
}
```

or - as software - using the Zenodo DOI [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.4618387.svg)](https://doi.org/10.5281/zenodo.4618387) with the following BibTeX entry:
```
@software{aton2020_4618387,
  author       = {Bruno Fanini},
  title        = {ATON framework},
  year         = 2020,
  publisher    = {Zenodo},
  version      = {3.0},
  doi          = {10.5281/zenodo.4618387},
  url          = {https://doi.org/10.5281/zenodo.4618387}
}
```

# Publications
Main bibliographical reference (open access) of the framework is:

*Fanini, B., Ferdani, D., Demetrescu, E., Berto, S., & d’Annibale, E. (2021). [ATON: An Open-Source Framework for Creating Immersive, Collaborative and Liquid Web-Apps for Cultural Heritage](https://www.mdpi.com/2076-3417/11/22/11062). Applied Sciences, 11(22), 11062.*

You can find [here](https://osiris.itabc.cnr.it/aton/index.php/publications/) a complete list of publications where ATON was employed in different national and international projects.

# Contribute
You are more than welcome to contribute to the project by spotting bugs/issues and providing code or solutions through pull requests to fix or improve ATON functionalities (see TODO list below). Get in touch here on github, through the [telegram open-group](https://t.me/ATON_Framework) or through the other channels.

# TODO list

- [ ] Move and refactor 2D user interface routines from ATON.FE into ATON.UI component (2D labels, popup system, input search, etc.)
- [ ] Rewrite Hathor UI elements using new routines from ATON.UI.*
- [ ] Improve main landing page (public gallery), port to ejs and provide more customization
- [ ] New REST API (v2)
- [ ] Rewrite Shu using ejs
- [ ] Improve Shu UI (e.g. new scene, galleries) using new routines from ATON.UI
>>>>>>> master
