---
locale: en
slug: maxdome
title: maxdome Streaming Platform
client: ProSiebenSat.1 / maxdome
clientUrl: https://www.maxdome.de/
industry: streaming-media
years: 2015–2016
heroImage: /assets/work/2015-maxdome-2.png
gallery:
  - /assets/work/2015-maxdome-1.png
  - /assets/work/2016-maxdome-1.png
  - /assets/work/2016-maxdome-2.png
  - /assets/work/2016-maxdome-3.png
  - /assets/work/2016-maxdome-4.png
stack: [Node.js, Microservices, Redis, AWS, OTT, CI/CD]
summary: A highly scalable Node.js orchestration API and the move from monolith to micro services on AWS for one of Germany's largest VOD platforms.
featured: true
order: 1
seo:
  description: How TYPE10 Media helped maxdome (ProSiebenSat.1) scale its streaming platform — a Node.js orchestration API, micro-service decomposition and AWS deployment pipelines.
---

maxdome was one of Germany's largest video-on-demand platforms. TYPE10 Media joined to help it scale — both its architecture and the way it shipped.

## What we did

We built a series of micro services, most notably a highly scalable **Node.js orchestration API** that dispatched requests from every client platform — web, mobile and OTT — to the backend of micro services. **Redis** played a central role, used both for caching and as a content store.

Beyond the services themselves, we helped split maxdome's **monolithic infrastructure into micro services** and deploy them to the **AWS cloud** through automated build-and-deployment pipelines.

## Why it mattered

Decoupling the platform let teams ship independently and let the system absorb the spiky, unpredictable load that streaming brings — without the whole thing having to move in lockstep.
