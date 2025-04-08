# Deployment Guide for Retail Billing Application

This guide provides instructions for deploying this Retail Billing application to various free platforms.

## Option 1: Railway (Recommended for Free Deployment)

1. **Create a Railway Account**
   - Go to [Railway.app](https://railway.app/)
   - Sign up for a free account

2. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

3. **Login to Railway**
   ```bash
   railway login
   ```

4. **Initialize Railway in your project**
   ```bash
   railway init
   ```

5. **Add a Postgres Database**
   - In the Railway dashboard, add a new Postgres database
   - The DATABASE_URL will be automatically linked to your project

6. **Deploy Your Application**
   ```bash
   railway up
   ```

7. **Set Environment Variables**
   - In the Railway dashboard, add the following environment variables:
     - `NODE_ENV=production`
     - `VITE_FIREBASE_API_KEY` (from your current .env file)
     - `VITE_FIREBASE_AUTH_DOMAIN` (from your current .env file)
     - `VITE_FIREBASE_PROJECT_ID` (from your current .env file)
     - `VITE_FIREBASE_STORAGE_BUCKET` (from your current .env file)
     - `VITE_FIREBASE_MESSAGING_SENDER_ID` (from your current .env file)
     - `VITE_FIREBASE_APP_ID` (from your current .env file)
     - `TWILIO_ACCOUNT_SID` (from your current .env file)
     - `TWILIO_AUTH_TOKEN` (from your current .env file)
     - `TWILIO_PHONE_NUMBER` (from your current .env file)

8. **Generate Domain**
   - In the Railway dashboard, go to your deployment settings and generate a domain

## Option 2: Render

1. **Create a Render Account**
   - Go to [Render.com](https://render.com/)
   - Sign up for a free account

2. **Create a New Web Service**
   - Select "Web Service"
   - Connect your GitHub repository
   - Select the branch to deploy

3. **Configure Service**
   - Name: retail-billing-app
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables**
   - Add the same environment variables listed in the Railway section above
   - For the database, create a PostgreSQL database in Render and link it

5. **Deploy**
   - Click "Create Web Service"
   - Your application will be deployed and a domain will be generated

## Option 3: Netlify + Heroku

For this option, you'll deploy the frontend to Netlify and the backend to Heroku:

### Frontend (Netlify)

1. **Create a Netlify Account**
   - Go to [Netlify.com](https://netlify.com/)
   - Sign up for a free account

2. **Create a netlify.toml file in your project root**
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
     base = "."

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

3. **Deploy to Netlify**
   - Connect your GitHub repository
   - Configure build settings as above
   - Set environment variables for your Firebase configuration

### Backend (Heroku)

1. **Create a Heroku Account**
   - Go to [Heroku.com](https://heroku.com/)
   - Sign up for a free account

2. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

3. **Login to Heroku**
   ```bash
   heroku login
   ```

4. **Create a Heroku App**
   ```bash
   heroku create retail-billing-backend
   ```

5. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

6. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   # Add all other environment variables as well
   ```

7. **Deploy to Heroku**
   ```bash
   git push heroku main
   ```

8. **Configure the Frontend**
   - Update your frontend API URL to point to your Heroku backend

## Preparing Your Code for Deployment

Before deploying, make sure:

1. **Update package.json start script**
   - Make sure your package.json has the correct start script (already done in this project)

2. **Create a Procfile file** (for Heroku)
   - Create a file named `Procfile` with the content: `web: npm start`

3. **Environment Variables**
   - Make sure all required environment variables are set in your deployment platform
   - Ensure DATABASE_URL is properly configured

4. **Build the Application**
   - Run `npm run build` locally to test the build process

## Database Migration

For the first deployment:

1. **Run the Database Migration**
   - Set up the DATABASE_URL environment variable
   - Run: `npm run db:push`

## Important Notes

- Free tiers on these platforms may have limitations on uptime, resources, or database size
- For production use, consider upgrading to a paid plan when your user base grows
- Always back up your database regularly
- The free tier on Railway allows projects to run for up to 500 hours per month
- Render's free tier may sleep after inactivity