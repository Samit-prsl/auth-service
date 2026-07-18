# MedHelp Auth Service Setup Guide

This guide will walk you through setting up the **Auth Service** and the containerized database environment using Docker Compose and Prisma 7.

---

## 🚀 Setup Steps

### 1. Environment Configuration
First, you need to create your local configuration `.env` file. You can easily clone the template configuration using the following terminal command:

```bash
cp .env.example .env
```

Open the newly created `.env` file and make sure the required environment variables are configured (such as database credentials and pgAdmin login tokens):

```ini
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auth_db_medhelp
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"

PGADMIN_DEFAULT_EMAIL=admin@medhelp.com
PGADMIN_DEFAULT_PASSWORD=adminpassword
```

### 2. Build and Start the Containers
Compile the application environment and launch all necessary background services (Node.js application container, PostgreSQL database engine, and pgAdmin administration client) by executing:

```bash
docker compose up --build
```
*(Note: If you are using an older Docker setup, use `docker-compose up --build` instead).*

---

## 🗄️ Database Management with pgAdmin

Once all your containers are fully built and running, you can manage your database visual tables directly from your browser.

### 3. Log In to pgAdmin
1. Open your web browser and navigate to: **[http://localhost:5050](http://localhost:5050)**
2. Log in using the default administrative credentials defined in your `.env` file:
   * **Email:** `admin@medhelp.com` (or your customized `PGADMIN_DEFAULT_EMAIL`)
   * **Password:** `adminpassword` (or your customized `PGADMIN_DEFAULT_PASSWORD`)

### 4. Register the Postgres Server
Since pgAdmin is running *inside* the isolated Docker network environment alongside your application, it connects internally to the database service. 

To link your database:
1. Right-click on **Servers** -> **Register** -> **Server...**
2. In the **General** tab:
   * **Name:** `MedHelp Auth DB` (or any label you prefer)
3. In the **Connection** tab, input the following configuration parameters exactly:
   * **Host name/address:** `postgres` *(Crucial: Do **NOT** use `localhost` here. Since pgAdmin is operating within the Docker network bridge, it resolves the Postgres container directly via its service name).*
   * **Port:** `5432` *(Use the native internal container port).*
   * **Maintenance database:** `auth_db_medhelp` *(Must match your `.env` `POSTGRES_DB`)*.
   * **Username:** `postgres` *(Must match your `.env` `POSTGRES_USER`)*.
   * **Password:** `postgres` *(Must match your `.env` `POSTGRES_PASSWORD`)*.
4. Toggle **Save password?** to active.
5. Click **Save**.

Your database hierarchy is now available in the left navigation sidebar!