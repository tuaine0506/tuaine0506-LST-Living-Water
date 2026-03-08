# Persistent Database Setup

This application supports both **SQLite** (default, for development) and **PostgreSQL** (for production persistence).

## 1. Development (SQLite)
By default, the app uses a local file named `database.sqlite`. No configuration is needed.
**Warning:** On many cloud platforms (like Google Cloud Run, Heroku, Vercel), this file will be deleted every time the app restarts or redeploys.

## 2. Production (PostgreSQL)
To use a persistent database that survives restarts, you must use PostgreSQL.

### Step 1: Get a Database
You can get a free or paid PostgreSQL database from providers like:
- **Supabase** (Free tier available)
- **Neon** (Free tier available)
- **Render** (Free tier available)
- **Google Cloud SQL**

### Step 2: Get the Connection String
Once created, copy the **Connection String** (or Database URL). It looks like this:
`postgres://user:password@hostname:port/database_name`

### Step 3: Configure the App
Set the `DATABASE_URL` environment variable in your hosting platform.

**Example:**
```
DATABASE_URL=postgres://myuser:mypassword@ep-cool-frog-123456.us-east-2.aws.neon.tech/neondb
```

### Automatic Migration
When the app starts with `DATABASE_URL` set:
1. It will automatically connect to Postgres.
2. It will create all necessary tables if they don't exist.
3. It will migrate any existing `data.json` file into the database (one-time operation).

## Troubleshooting
- If the app fails to start, check that your `DATABASE_URL` is correct.
- Ensure your database provider allows connections from your hosting platform (0.0.0.0/0).
