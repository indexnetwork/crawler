FROM apify/actor-node-playwright:latest
COPY --chown=myuser package*.json ./
COPY --chown=myuser yarn.lock ./

RUN yarn install
RUN yarn create playwright


COPY --chown=myuser . ./

ENTRYPOINT yarn start
