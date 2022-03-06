export type Message = {
  type: "GET_STATUS" | "TOGGLE_STATUS";
  data?: { [key: string]: any };
};

let IS_ACTIVE = true;
let PROCRASTINATING_SINCE: number | undefined = undefined;
const DOMAINS_PROCRASTINATION = new Set<string>();
const DOMAINS_FAKENEWS_GAMBLING_PORN = new Set<string>();

chrome.runtime.onMessage.addListener((message: Message, sender, sendRes) => {
  console.debug({ message, sender });
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

const getBadDomains = async () => {
  const [procrastinationResponse, fakenewsGamblingPornHostsResponse] =
    await Promise.all([
      fetch(
        "https://raw.githubusercontent.com/bytescout/list-of-procrastination-websites/main/sites-all.txt"
      ),
      fetch(
        "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn/hosts"
      ),
    ]);

  // Get all text
  const [procrastinationResponseText, fakenewsGamblingPornHostsResponseText] =
    await Promise.all([
      procrastinationResponse.text(),
      fakenewsGamblingPornHostsResponse.text(),
    ]);

  const procrastinationHosts = procrastinationResponseText
    .split("\n")
    .filter((x) => x.length > 1)
    .map((x) => x.trim());

  const fakenewsGamblingPornHosts = fakenewsGamblingPornHostsResponseText
    .split("\n")
    .filter((x) => x.startsWith("0.0.0.0 "))
    .filter((x) => x.split(" ").length > 1)
    .map((x) => x.split(" ")[1].trim());

  procrastinationHosts.forEach((url) => DOMAINS_PROCRASTINATION.add(url));

  fakenewsGamblingPornHosts.forEach((url) =>
    DOMAINS_FAKENEWS_GAMBLING_PORN.add(url)
  );

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
  ].forEach((x) => DOMAINS_PROCRASTINATION.add(x));

  DOMAINS_PROCRASTINATION.delete("linkedin.com");
  DOMAINS_PROCRASTINATION.delete("www.linkedin.com");
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

(async () => {
  await getBadDomains();
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
      if (DOMAINS_FAKENEWS_GAMBLING_PORN.has(domain)) {
        return {
          redirectUrl: "https://wikipedia.org",
        };
      }
      if (DOMAINS_PROCRASTINATION.has(domain) && IS_ACTIVE) {
        return {
          redirectUrl: "https://wallpaperaccess.com/full/3821307.jpg",
        };
      }
    },
    { urls: ["<all_urls>"], types: ["main_frame"] },
    ["blocking"]
  );

  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    let url: string | undefined = undefined;
    console.warn({ tabId, changeInfo, tab });
    if (changeInfo.status === "loading") {
      url = tab.url;
    }
    if (changeInfo.url) {
      url = changeInfo.url;
    }

    if (!url) {
      return;
    }

    const domain = new URL(url).host.replace(/^www\./, "");
    if (
      DOMAINS_FAKENEWS_GAMBLING_PORN.has(domain) ||
      DOMAINS_PROCRASTINATION.has(domain)
    ) {
      chrome.tabs.executeScript(tabId, {
        file: "dist/content.js",
      });
    }
  });
})();
