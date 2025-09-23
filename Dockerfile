FROM node:18

# Install required system libraries for sharp
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libvips-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g npm

# Create main ATON folder
WORKDIR /aton

# Install app dependencies
COPY package*.json ./

# Force sharp to compile from source (no prebuilt binary)
RUN npm install --build-from-source sharp
RUN npm install pm2 -g

# Bundle app source
COPY . .

EXPOSE 8083

CMD [ "node", "services/ATON.service.main.js" ]