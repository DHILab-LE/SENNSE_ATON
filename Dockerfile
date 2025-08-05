<<<<<<< HEAD
FROM node:18
=======
FROM node:20
>>>>>>> master

RUN npm install -g npm

# Create main ATON folder
WORKDIR /aton

# Install app dependencies
COPY package*.json ./

RUN npm install
RUN npm install pm2 -g

# Bundle app source
COPY . .

<<<<<<< HEAD
EXPOSE 8083
=======
#EXPOSE 8080
>>>>>>> master

# Single
#CMD [ "node", "services/ATON.service.main.js" ]

# PM2
CMD ["pm2-runtime", "ecosystem.config.js"]
#CMD ["pm2-runtime", "ecosystem.config.js", "--only", "APP"]
