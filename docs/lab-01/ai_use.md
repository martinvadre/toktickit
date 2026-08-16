# AI Use & Prompt Log - Lab 1

I used the Antigravity coding agent through my Google Cloud Platform account. I mainly used Gemini 3.5 Flash as the LLM with a thinking level of Medium.

## Selected Key Prompts

| Prompt Name | Actual Prompt Text | My Reflection |
| :--- | :--- | :--- |
| **Plan Lab 1 Implementation** | Read the enclosed TokTickIT Lab 1 requirements. Summarize the four GitHub Issues, their dependencies, required outputs, and required automated tests. Propose an implementation order, but do not write code yet. | The agent provided a structured plan adhering to all acceptance criteria and issue dependencies. |
| **Set Up Full-Stack Project** | Setup the TokTickIT project tech stack as given in Lab 1 using React, TypeScript, Vite, and Bootstrap for the frontend, and Node.js, Express, and TypeScript for the backend. Configure PostgreSQL and Prisma. Use the required folder structure. | The foundation setup was cleanly generated across client and server subdirectories. |
| **Implement Health Check** | Add `GET /api/health` to the Express backend returning status ok and service TokTickIT API. Add Supertest test. | The API endpoint and Supertest test ran and passed without issue. |
| **Implement Category Feature** | Create the Prisma Category model, migration/push, and seed script for the four categories. Add `GET /api/categories`. | Seed script executed idempotently with `upsert`. |
| **Build and Test Check System UI** | Create a Bootstrap-based page with [Check System] button. When clicked, show a loading state, call backend endpoints, and display system status & categories. | UI responsive states worked as expected and unit tests passed cleanly. |
| **Review Final Lab 1 Work** | Review the completed TokTickIT Lab 1 implementation against all acceptance criteria and run tests. | All automated tests passed and structure matched lab specification. |
