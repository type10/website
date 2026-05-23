---
locale: en
slug: splitting-a-monolith
title: 'Splitting a monolith into micro services: lessons from streaming'
summary: What a high-traffic streaming platform taught us about decomposing a monolith without breaking it.
publishDate: 2026-01-20
author: chris
cluster: cloud-microservices
tags: [microservices, architecture, cloud, AWS]
seo:
  description: Practical lessons on splitting a monolith into micro services — seams, orchestration and deployment — drawn from scaling a high-traffic streaming platform.
---

"Split the monolith" is easy to say and easy to get wrong. Here's what scaling a high-traffic streaming platform taught us about doing it without breaking production.

## Find seams, don't draw boxes

The worst micro-service boundaries come from an org chart. The best come from the natural seams in the domain — places where data and responsibility already separate cleanly. Start there, extract one service, and prove the pattern before you multiply it.

## An orchestration layer earns its keep

When many clients — web, mobile, OTT — need different shapes of the same data, a thin orchestration API in front of the services saves every client from knowing the whole topology. On [maxdome](/work/maxdome/) this orchestration layer was the single most valuable piece we built.

## Deployment is part of the architecture

Micro services without automated pipelines just multiply your operational pain. The decomposition only paid off because each service had a clear, repeatable path to production. That coupling of architecture and delivery is the heart of our [Backend & Microservices](/services/backend-microservices/) and [Cloud & DevOps](/services/cloud-devops/) work.

## Don't split what doesn't need splitting

Finally: a monolith is not a moral failing. Plenty of systems are better off staying together. Split when independent scaling or independent deployment actually buys you something — not because micro services are fashionable.
