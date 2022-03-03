export type Message = {
  type: "GET_STATUS" | "TOGGLE_STATUS";
  data?: { [key: string]: any };
};

let IS_ACTIVE = true;
let PROCRASTINATING_SINCE: number | undefined = undefined;
chrome.runtime.onMessage.addListener((message: Message, sender, sendRes) => {
  console.log({ message, sender });
  if (message.type === "GET_STATUS") {
    sendRes({
      type: "GET_STATUS",
      data: {
        active: IS_ACTIVE,
        procrastinatingSince: PROCRASTINATING_SINCE,
        procrastinatingSinceSeconds:
          PROCRASTINATING_SINCE && (Date.now() - PROCRASTINATING_SINCE) / 1000,
      },
    } as Message);
  }
  if (message.type === "TOGGLE_STATUS") {
    IS_ACTIVE = !IS_ACTIVE;
    if (!IS_ACTIVE) {
      PROCRASTINATING_SINCE = Date.now();
    } else {
      PROCRASTINATING_SINCE = undefined;
    }
    sendRes({
      type: "TOGGLE_STATUS",
      data: {
        active: IS_ACTIVE,
        procrastinatingSince: PROCRASTINATING_SINCE,
      },
    } as Message);
    sendEventToEs({
      isActive: IS_ACTIVE,
      type: "TOGGLE_STATUS",
    });
  }
});

const getBadDomains = async (set: Set<string>) => {
  const [procrastinationRes, badUrlsRes] = await Promise.all([
    fetch(
      "https://raw.githubusercontent.com/bytescout/list-of-procrastination-websites/main/sites-all.txt"
    ),
    fetch(
      "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts"
    ),
  ]);

  // Get all text
  const [procrastinationResText, badUrlsResText] = await Promise.all([
    procrastinationRes.text(),
    badUrlsRes.text(),
  ]);

  const procrastinationUrls = procrastinationResText
    .split("\n")
    .filter((x) => x.length > 1)
    .map((x) => x.trim());

  const badUrls = badUrlsResText
    .split("\n")
    .filter((x) => x.startsWith("0.0.0.0 "))
    .filter((x) => x.split(" ").length > 1)
    .map((x) => x.split(" ")[1].trim());

  procrastinationUrls.forEach((url) => set.add(url));
  badUrls.forEach((url) => set.add(url));

  [
    "www.youtube.com",
    "youtube.com",
    "www.ynet.co.il",
    "ynet.co.il",
    "calcalist.co.il",
    "www.calcalist.co.il",
    "messenger.com",
    "www.messenger.com",
    "news.ycombinator.com",
    "facebook.com",
    "www.facebook.com",
  ].forEach((x) => set.add(x));

  set.delete("linkedin.com");
  set.delete("www.linkedin.com");
};

type BrainPoopElasticEvent = {
  timestamp: number;
  url: string;
};

const sendEventToEs = async (event: { [key: string]: any }) => {
  const timestamp = Date.now();
  const body = {
    ...event,
    timestamp,
  };

  const res = await fetch("https://es.wfh.dj/brainpoop2/_doc", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res;
};

const BAD_DOMAINS = new Set<string>();
(async () => {
  await getBadDomains(BAD_DOMAINS);
  console.log("[+] Loaded bad domains 2");

  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.tabId === -1) {
        return;
      }

      const url = new URL(details.url);
      const domain = url.host.replace(/^www\./, "");
      if (domain === "wallpaperaccess.com") {
        return;
      }
      sendEventToEs({
        data: domain,
        isActive: IS_ACTIVE,
        type: "CHROME_TAB",
      });
      if (BAD_DOMAINS.has(domain)) {
        if (IS_ACTIVE) {
          return {
            redirectUrl: "https://wallpaperaccess.com/full/3821307.jpg",
          };
        }
      }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
  );

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log(changeInfo);
    if (changeInfo.url) {
      console.log("WE GOT IT");
      const url = new URL(changeInfo.url);
      const domain = url.host.replace(/^www\./, "");
      if (BAD_DOMAINS.has(domain)) {
        chrome.tabs.executeScript(tabId, {
          file: "dist/content.js",
        });
      }
    }
  });
})();
