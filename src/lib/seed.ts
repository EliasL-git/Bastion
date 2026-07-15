import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const AD_DOMAINS = [
  "doubleclick.net", "googlesyndication.com", "googleadservices.com",
  "ads.yahoo.com", "adnxs.com", "adsrvr.org", "adroll.com",
  "amazon-adsystem.com", "facebook.com/tr", "analytics.google.com",
  "pixel.facebook.com", "connect.facebook.net", "ads.twitter.com",
  "analytics.tiktok.com", "ads.tiktok.com", "ads.linkedin.com",
  "tracking.hubspot.com", "hotjar.com", "mixpanel.com",
  "segment.io", "amplitude.com", "fullstory.com",
  "crazyegg.com", "optimizely.com", "chartbeat.com",
  "scorecardresearch.com", "quantserve.com", "moatads.com",
  "taboola.com", "outbrain.com", "popads.net",
  "adsterra.com", "propellerads.com", "popcash.net",
  "revcontent.com", "mgid.com", "zedo.com",
  "casalemedia.com", "rubiconproject.com", "openx.net",
  "pubmatic.com", "indexexchange.com", "sharethrough.com",
  "bidswitch.com", "serving-sys.com", "adsymptotic.com",
  "demdex.net", "exelator.com", "eyeota.net",
  "krxd.net", "rlcdn.com", "agkn.com",
  "rlcdn.com", "pippio.com", "intentiq.com",
];

const TRACKING_DOMAINS = [
  "googletagmanager.com", "google-analytics.com", "gtm.ms",
  "mc.yandex.ru", "hm.baidu.com", "analytics.163.com",
  "tongji.baidu.com", "cnzz.com", "umeng.com",
  "kissmetrics.com", "crazyegg.com", "mouseflow.com",
  "clicktale.com", "inspectlet.com", "hotjar.com",
  "fullstory.com", "crazyegg.com", "userzoom.com",
  "qualaroo.com", "visistat.com", "mousestats.com",
  "statcounter.com", "sitemeter.com", "extremetracking.com",
];

const MALWARE_DOMAINS = [
  "malware-site.example", "phishing-login.example",
  "fake-bank.example", "crypto-miner.example",
  "drive-by-download.example", "ransomware-c2.example",
  "botnet-controller.example", "keylogger-server.example",
];

const CLIENTS = ["192.168.1.10", "192.168.1.11", "192.168.1.22", "192.168.1.50", "192.168.1.101", "10.0.0.5", "10.0.0.12"];
const QUERY_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function subdomain(domain: string): string {
  const prefixes = ["www", "api", "cdn", "static", "img", "assets", "track", "pixel", "ads", "s", "go", "click", "serve"];
  return Math.random() > 0.4 ? `${randomFrom(prefixes)}.${domain}` : domain;
}

export async function seed() {
  // Check if already seeded
  const count = await db.dnsQuery.count();
  if (count > 0) {
    console.log(`[bastion] Already has ${count} queries, skipping seed.`);
    return;
  }

  console.log("[bastion] Seeding database with sample data...");

  // Create blocklists
  await db.blocklist.createMany({
    data: [
      {
        name: "StevenBlack's Ad List",
        source: "https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
        enabled: true,
        entries: AD_DOMAINS.join("\n"),
      },
      {
        name: "Tracking Domains",
        source: "custom",
        enabled: true,
        entries: TRACKING_DOMAINS.join("\n"),
      },
      {
        name: "Malware Blocklist",
        source: "custom",
        enabled: true,
        entries: MALWARE_DOMAINS.join("\n"),
      },
    ],
  });

  // Create some allowlist entries
  await db.allowlist.createMany({
    data: [
      { domain: "safe-analytics.example.com", note: "Internal analytics" },
      { domain: "ads.our-own-service.com", note: "First-party ads" },
    ],
  });

  // Create settings
  await db.setting.createMany({
    data: [
      { key: "upstream_dns", value: "1.1.1.1, 1.0.0.1" },
      { key: "blocking_enabled", value: "true" },
      { key: "query_logging", value: "true" },
    ],
  });

  // Generate DNS queries over the last 24 hours
  const allBlockable = [...AD_DOMAINS, ...TRACKING_DOMAINS, ...MALWARE_DOMAINS];
  const safeDomains = [
    "google.com", "github.com", "youtube.com", "reddit.com", "stackoverflow.com",
    "wikipedia.org", "amazon.com", "netflix.com", "twitch.tv", "discord.com",
    "mozilla.org", "cloudflare.com", "vercel.com", "npmjs.com", "docker.com",
    "linux.org", "ubuntu.com", "archlinux.org", "python.org", "rust-lang.org",
    "typescriptlang.org", "nextjs.org", "react.dev", "tailwindcss.com", "prisma.io",
  ];

  const queries: Prisma.DnsQueryCreateManyInput[] = [];
  const now = Date.now();

  for (let i = 0; i < 2000; i++) {
    const hoursAgo = Math.random() * 24;
    const minutesAgo = Math.random() * 60;
    const createdAt = new Date(now - (hoursAgo * 3600 + minutesAgo * 60) * 1000);

    // ~35% blocked rate
    const isBlocked = Math.random() < 0.35;
    const domain = isBlocked
      ? subdomain(randomFrom(allBlockable))
      : subdomain(randomFrom(safeDomains));

    const listName = isBlocked
      ? (domain.includes("malware") || domain.includes("phishing") || domain.includes("fake") || domain.includes("ransomware")
        ? "Malware Blocklist"
        : (TRACKING_DOMAINS.some(d => domain.includes(d)) ? "Tracking Domains" : "StevenBlack's Ad List"))
      : null;

    queries.push({
      domain,
      clientIp: randomFrom(CLIENTS),
      queryType: randomFrom(QUERY_TYPES),
      status: isBlocked ? "blocked" : "allowed",
      list: listName,
      createdAt,
    });
  }

  // Insert in batches
  const BATCH = 200;
  for (let i = 0; i < queries.length; i += BATCH) {
    await db.dnsQuery.createMany({ data: queries.slice(i, i + BATCH) });
  }

  console.log(`[bastion] Seeded ${queries.length} queries, 3 blocklists, 2 allowlist entries.`);
}