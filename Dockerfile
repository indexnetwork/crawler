FROM apify/actor-node-puppeteer-chrome:latest
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install
COPY . ./
ENTRYPOINT yarn start
