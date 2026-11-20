# Platform Architecture, Data and Solutions

> **Source and approval note:** This document reorganizes architecture
> and data-ingestion descriptions from the supplied Netcore reference
> material. Confirm connector availability, architecture details, and
> deployment-specific capabilities with Netcore.

## Platform architecture

The supplied material presents the platform in four conceptual layers:

1.  **Data ingestion and storage:** Customer data, event streams, SDKs,
    and data warehouses.
2.  **Context engine and knowledge graph:** Brand rules, product
    catalog, historical conversions, and governance context.
3.  **Agent orchestration:** Audience, Content, Scheduler, Insight,
    Decisioning, and Shopping agents.
4.  **Omnichannel delivery:** Email, WhatsApp, RCS, SMS, web
    personalization, and app push.

This is a conceptual architecture reproduced from the source, not a
deployment-specific architecture diagram.

## Unified customer data engine

The source describes three data-ingestion mechanisms:

### Client-side SDKs

The source lists iOS, Android, Flutter, React Native, and Web SDKs for
collecting behavioral events such as: - Session depth. - Cart actions. -
Screen views. - Other customer interaction events.

### Server-side APIs and webhooks

The source describes real-time ingestion of operational data such as: -
Offline point-of-sale receipts. - Transaction records. - Return data. -
Fulfillment milestones.

### Cloud data warehouse connectors

The source names Snowflake, BigQuery, Databricks, and Amazon Redshift as
warehouse integrations. Confirm connector type and availability for the
relevant customer deployment.

## Dynamic context graph

The source describes a context layer that helps agents use relevant
business information.

### Catalog understanding

-   Stock levels.
-   Margin parameters.
-   Product taxonomy.
-   Seasonal attributes.
-   Product affinity clusters.

### Brand governance

-   Style guides and tone rules.
-   Restricted keywords.
-   Legal disclaimers.
-   Regional compliance criteria.
-   Pricing constraints.

### Customer interaction history

The source describes using engagement history across push, email, SMS,
and messaging apps to understand channel affinity and churn
vulnerability.

## Solutions supported by the described platform

The source positions the platform around: - Customer audience
discovery. - Personalized content generation. - Campaign delivery
planning. - Next Best Action decisioning. - Journey and campaign
performance diagnosis. - Conversational commerce.


