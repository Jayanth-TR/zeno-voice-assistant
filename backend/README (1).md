# Zeno --- Netcore Knowledge Base

This folder contains seven topic-focused Markdown documents prepared for
the Zeno RAG knowledge base.

## Files

1.  `01_company_overview.md` --- company/platform overview and operating
    principle.
2.  `02_agentic_marketing.md` --- agentic marketing concept and
    workflow.
3.  `03_ai_agents.md` --- Audience, Content, Scheduler, Insight,
    Decisioning, and Shopping agents.
4.  `04_products_and_solutions.md` --- architecture, data ingestion,
    context graph, and solution areas.
5.  `05_customer_success_stories.md` --- Crocs, Anveshan, and IGP
    outcomes stated in the source.
6.  `06_channels_and_integrations.md` --- Email, AMP, WhatsApp, RCS,
    SMS, web, push, and MCP.
7.  `07_security_and_compliance.md` --- security and compliance claims
    requiring validation.

## Important source limitation

These files reorganize the supplied
`Netcore_Agentic_Marketing_Knowledge_Base` material. They do not
independently verify the claims. The source itself says to validate the
material with Netcore before public use. This is especially important
for customer metrics, company scale figures, security certifications,
compliance statements, encryption standards, and specific integration
capabilities.

## Ingestion

Place these files inside your backend `knowledge_base/` directory. Then
run your existing ingestion script to rebuild the ChromaDB collection.
Since the current ingestion implementation deletes and recreates the
collection, back up the vector store first if you need to preserve the
previous index.
