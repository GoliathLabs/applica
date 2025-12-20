# `Applica` 👥

A full-stack platform for managing user applications and memberships, designed for university clubs.

## Features

- **Course Applications**: Students can apply to join university clubs/courses
- **Membership Applications**: Digital membership application system with:
  - Public form for submitting membership applications
  - IBAN/BIC validation for payment details
  - Digital signature tracking (timestamp, IP address)
  - Email notifications for confirmations and status updates
  - Admin interface for managing applications
- **LDAP Integration**: Automatic user account creation upon acceptance
- **Email Notifications**: Automated emails for application status updates

## Development

1. Start the required Docker containers with the `dev` profile:

   ```bash
   sudo docker-compose --profile dev up -d
   ```

2. Run the frontend or backend:

- **Frontend** (`localhost:3000`):

  ```bash
  cd frontend
  bun install
  bun run dev
  ```

- **Backend** (`localhost:8080/api`):

  ```bash
  cd backend
  bun install
  bun run dev
  ```

## Production

1. Start the production containers with the `prod` profile:

   ```bash
   sudo docker-compose --profile prod up -d
   ```

2. Make sure to configure your `.env` file with your LDAP URL.

This will launch the frontend, backend, and a PostgreSQL database.

## Environment / Docker Compose

1. Copy the example env file and edit secrets:

```bash
cp .env.example .env
# edit .env and set JWT_SECRET, LDAP and SMTP values
```

2. `docker-compose.yml` reads from your shell environment and from `.env`.

- The frontend uses `PUBLIC_API_BASE_URL` to configure `runtimeConfig.public.apiBaseURL`.
- The backend reads `FRONTEND_ORIGIN` to restrict CORS and `JWT_SECRET` for auth.

3. Start services:

```bash
# Development (includes postgres and ldap)
docker compose up --profile dev --build

# Production
docker compose up --profile prod --build
```

Notes:
- For production, set `NODE_ENV=production` and ensure `JWT_SECRET` is set (process exits if missing).
- If you deploy the frontend as a static build, set `PUBLIC_API_BASE_URL` at build or runtime depending on your hosting.

## Database Migrations

After setting up the database, run migrations:

```bash
cd backend
bun run db:migrate
```

This will create all necessary tables including:
- Course applications and fields
- Membership applications
- User management tables

## Public Pages

The following pages are publicly accessible without authentication:

- `/apply` - Digital membership application form (Mitgliedsantrag)

## Admin Pages

The following pages require authentication:

- `/` - Course applications management
- `/memberships` - Membership applications management

## Email Configuration

For the membership application feature to send confirmation emails, configure SMTP settings in `.env`:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=supersecret
SMTP_FROM_NAME="Applica"
SMTP_FROM_EMAIL=no-reply@example.com
SMTP_REPLY_TO=reply@example.com
```
