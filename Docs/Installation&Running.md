# 3D ATON — Installation & Deployment Guide

This guide provides clear, step-by-step instructions for installing and running **3D ATON** on a local machine (Windows or Linux) or on a remote server using **Docker**.

---

## 📑 Table of Contents
1. [Quick Start](#quick-start)
2. [Local Deployment](#1-local-deployment)
   - [Windows Prerequisites](#windows-prerequisites)
   - [Linux Prerequisites](#linux-prerequisites)
   - [Running on Windows](#running-on-windows)
   - [Running on Linux](#running-on-linux)
3. [Remote Server Deployment](#2-remote-server-deployment)
4. [Additional Notes](#3-additional-notes)

---

## 🚀 Quick Start
For experienced users familiar with Docker:
```bash
# Pull and run in one command
docker run -d -p 8083:8083 --restart unless-stopped meddali/sennse_aton:2.0.6

# Access the platform
https://localhost:8083
```

---

## 1. Local Deployment

### Windows Prerequisites
1. Download and install **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**.
2. Enable **WSL 2** during setup if prompted.
3. Start Docker Desktop before continuing.

### Linux Prerequisites
```bash
# Update packages
sudo apt update

# Install Docker
sudo apt install docker.io

# Install Docker Compose
sudo apt install docker-compose

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker
```

---

### Running on Windows
1. Open **Docker Desktop**.
2. Pull the application image:
   ```bash
   meddali/sennse_aton:2.0.6
   ```
3. Create a container:
   - **Host Port**: `8083`
   - **Container Port**: `8083`
4. Start the container.
5. Access in your browser:
   ```
   https://localhost:8083
   ```

---

### Running on Linux
1. Create a `docker-compose.yml` file:
   ```yaml
   version: "3.8"
   services:
     sennse_aton:
       image: meddali/sennse_aton:2.0.6
       ports:
         - "8083:8083"
       restart: unless-stopped
   ```
2. Start the service:
   ```bash
   sudo docker-compose up -d
   ```
3. Access in your browser:
   ```
   https://localhost:8083
   ```

---

## 2. Remote Server Deployment
1. Connect to your server:
   ```bash
   ssh user@your-server-ip
   ```
2. Install Docker & Docker Compose (follow [Linux Prerequisites](#linux-prerequisites)).
3. Use the same `docker-compose.yml` file from the Linux section.
4. Start the service:
   ```bash
   sudo docker-compose up -d
   ```
5. Access from your local machine:
   ```
   https://<server-ip>:8083
   ```
6. After server reboot, restart the service:
   ```bash
   sudo docker-compose up -d
   ```

---

## 3. Additional Notes
- **Port Access**: Ensure port `8083` is open in firewall/security group when running remotely.
- **HTTPS Warning**: The platform uses a self-signed SSL certificate. Your browser may show a security warning — proceed or replace with a trusted certificate.
- **Stopping the Service**:
   ```bash
   sudo docker-compose down
   ```

---
