FROM apify/actor-node-playwright:latest
COPY --chown=myuser package*.json ./
COPY --chown=myuser yarn.lock ./

COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

COPY --chown=myuser . ./

ENTRYPOINT yarn start
