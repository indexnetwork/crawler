FROM apify/actor-node-playwright:latest
COPY --chown=myuser package*.json ./
COPY --chown=myuser yarn.lock ./

COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

USER root
# Create the directory and set permissions
RUN mkdir -p /home/myuser/storage/key_value_stores/__CRAWLEE_MIGRATING_KEY_VALUE_STORE__ && chown -R myuser:myuser /home/myuser/storage

# Switch back to the node user
USER myuser

COPY . ./
ENTRYPOINT yarn start
