FROM nginx
# FROM node:14

# ENV mongo_db_username=admin \
#     mongo_db_pwd=password

WORKDIR /usr/src/app

# RUN curl -fsSL https://deb.nodesource.com/setup_17.x | bash -
# RUN apt-get install -y nodejs

COPY package*.json ./

RUN npm install

COPY . .
COPY .env.production .env

RUN npm run build

ENV NODE_ENV production

# RUN rm -r /usr/share/nginx/html/*

# RUN cp -a build/. /usr/share/nginx/html

EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER node