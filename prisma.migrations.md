# Prisma Migrations Workflow Guide

This document outlines the standard sequential process for managing database schemas, validating relationship structures, and executing migrations using **Prisma 7** in a containerized environment.

---

## 🧱 The Prisma Lifecycle

Follow these four steps sequentially whenever you initialize your database for the first time, or whenever you modify any data models in your application.

### ✅ Step 1. Write the Prisma Schema
Your application's data layer structures, field datatypes, and complex constraints (such as the self-referential tracking on the `Employee` model) are authored within your primary configuration file.
* **Primary Target File:** `prisma/schema.prisma`

---

### ✅ Step 2. Format
Before verifying logic, clean up file typography and structure. Running the formatter auto-indents text columns, groups configurations, and injects missing reciprocal back-relation tracking lists where relationships exist across tables.

```bash
npx prisma format
```

> **Why?** This isolates structural syntax typos immediately and keeps your schema file clean, normalized, and highly legible.

---

### ✅ Step 3. Validate
Once your schema file is neatly formatted, check that the underlying relationship models make sense semantically. This command validates that references point to correct keys, data constraints are sound, and no circular dependencies exist.

```bash
npx prisma validate
```

> **Why?** If this step succeeds, Prisma confirms it completely understands your schema logic and guarantees that it is free of relational errors before touching the live database.

---

### 🚀 Step 4. Create and Apply the Migration
Now it is time to synchronize your running Postgres engine with your updated Prisma schema layout. 

Because your terminal operates from your local machine host environment outside of the container network bridge, you need to explicitly supply the host gateway url (`localhost:5433`) directly to the migration execution pipeline:

```bash
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@{localhost:5433}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"
```

#### What Prisma handles automatically under the hood:
1. **Generates the SQL File:** It evaluates your schema file, compares it directly against your active database snapshot, and writes a standard relational change-log `.sql` migration script inside a timestamped folder under `prisma/migrations/`.
2. **Executes the Script:** It runs that newly generated SQL file against your active container database instance, building all tables, indexes, enums, and foreign-key restrictions.
3. **Generates the Client:** It automatically triggers a `prisma generate` step afterward, compiling fresh, highly precise, type-safe TypeScript models inside your code project that accurately match your new database architecture.