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
