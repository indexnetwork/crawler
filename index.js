import express from "express";
import { Actor } from "apify";
import { PuppeteerCrawler, RequestList, sleep } from "crawlee";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await Actor.init();

const contentMap = new Map(); // Map to store the page content based on request id

const initializeCrawler = async () => {
  const requestList = await RequestList.open("my-list", [], {
    keepDuplicateUrls: true,
  });
  const requestQueue = await Actor.openRequestQueue();

  const crawler = new PuppeteerCrawler({
    requestList,
    requestQueue,
    useSessionPool: false,
    persistCookiesPerSession: false,
    headless: true,
    keepAlive: true,
    minConcurrency: 5,
    maxConcurrency: 15,
    launchContext: {
      launchOptions: {
        defaultViewport: {
          width: 1512,
          height: 982,
        },
      },
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    requestHandler: async ({ request, page }) => {
      await page.waitForNavigation({ waitUntil: "load" });

      await sleep(2000);

      await page.evaluate(() => {
        return window.scrollBy(0, window.innerHeight);
      });
      await sleep(152);

      await page.evaluate(() => {
        return window.scrollBy(0, window.innerHeight);
      });

      await sleep(263);

      const content = await page.content();
      console.log(`Title: ${await page.title()}`);
      console.log(`Content: ${content}`);
      contentMap.set(request.uniqueKey, content); // Store content with uniqueKey
      await requestQueue.markRequestHandled(request);
    },
  });

  crawler.run();
  return crawler;
};

const addToQueue = async (queue, url, uniqueKey) => {
  await queue.addRequests([{ url, uniqueKey }]);
};

const getContent = async (uniqueKey, maxRetries = 20, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    if (contentMap.has(uniqueKey)) {
      const content = contentMap.get(uniqueKey);
      contentMap.delete(uniqueKey); // Clean up the map
      return content;
    }
    await sleep(delay); // wait before retrying
  }
  throw new Error("Failed to fetch the content in time");
};

app.post("/", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL query parameter is required" });
    }

    const queue = req.app.get("queue");
    const uniqueKey = Math.random().toString();
    console.log(`Adding URL to queue: ${url}`);

    await addToQueue(queue, url, uniqueKey);
    const content = await getContent(uniqueKey);

    return res.json({ url, content });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const startServer = async () => {
  try {
    app.set("queue", await initializeCrawler());
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error initializing server:", error);
    process.exit(1);
  }
};

startServer();
