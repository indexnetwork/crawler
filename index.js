import express from "express";
import { Actor } from "apify";
import { PuppeteerCrawler, RequestList, sleep } from "crawlee";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await Actor.init();

const initQueue = async () => {
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
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    requestHandler: async ({ request, page }) => {
      await page.waitForNetworkIdle();
      const title = await page.title();
      console.log(title);
      const content = await page.content();
      console.log(content);
      await requestQueue.markRequestHandled(request);
    },
  });

  crawler.run();

  return crawler;
};

app.get("/", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL query parameter is required" });
    }

    const queue = req.app.get("queue");
    console.log(`Adding URL to queue: ${url}`);
    await queue.addRequests([{ url, uniqueKey: Math.random().toString() }]);
    return res.json({ url });
  } catch (error) {
    console.error("Error adding request to queue:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const run = async () => {
  try {
    app.set("queue", await initQueue());
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Error initializing queue:", error);
    process.exit(1);
  }
};

run();
