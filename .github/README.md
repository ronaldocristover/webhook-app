# GitHub Actions Workflows

This project uses GitHub Actions for CI/CD automation.

## Workflows

### 1. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Features:**
- Runs tests with MySQL database
- Executes database migrations
- Lints the codebase
- Builds Docker image
- Deploys to production server on push to main

**Secrets Required:**
- `DEPLOY_HOST`: Production server hostname or IP
- `DEPLOY_USER`: SSH username
- `DEPLOY_KEY`: SSH private key
- `DEPLOY_PATH`: (Optional) Deployment directory

**Usage:**
This workflow automatically runs on every push. The deployment step only runs when pushing to the main branch (not on pull requests).

### 2. Docker Build Workflow (`.github/workflows/docker-build.yml`)

**Triggers:**
- Push to `main` branch
- Version tags (e.g., `v1.0.0`)
- Pull requests to `main`

**Features:**
- Builds multi-platform Docker images
- Pushes to GitHub Container Registry (GHCR)
- Automatic semantic versioning tags
- Caches Docker layers for faster builds

**Registry:**
Images are published to: `ghcr.io/<owner>/<repository>`

**Tags Format:**
- Branch name (e.g., `main`)
- Semver (e.g., `1.0.0`, `1.0`, `1`)
- SHA with branch prefix
- Pull request numbers

## Setup Instructions

### 1. Configure Repository Secrets

Go to your repository → Settings → Secrets and variables → Actions, and add:

```
DEPLOY_HOST=your-server.com
DEPLOY_USER=deploy
DEPLOY_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
DEPLOY_PATH=/opt/webhook-app
```

### 2. Setup Production Server

On your production server, create the deployment directory and add required files:

```bash
mkdir -p /opt/webhook-app
cd /opt/webhook-app

# Copy docker-compose.yml and other deployment files
git clone <your-repo> .
```

Create a `.env` file with your production configuration:

```bash
cp env.example .env
nano .env
```

### 3. SSH Key Setup

Generate a deployment SSH key pair:

```bash
ssh-keygen -t ed25519 -f deploy_key -N ""
```

Add the public key to the server:

```bash
ssh-copy-id -i deploy_key.pub deploy@your-server.com
```

Add the private key (`deploy_key`) as the `DEPLOY_KEY` secret in GitHub.

### 4. First Deployment

Workflows will run automatically on push, or you can manually trigger them:

1. Go to Actions tab
2. Select "Deploy Webhook Service" workflow
3. Click "Run workflow"

## Troubleshooting

### Deployment Fails

- Check SSH connection: `ssh -i deploy_key deploy@your-server.com`
- Verify secrets are set correctly
- Check GitHub Actions logs for detailed error messages

### Docker Build Fails

- Ensure Dockerfile is correct
- Check for syntax errors in workflow files
- Review build logs in Actions tab

### Database Connection Issues

- Verify MySQL is running: `docker-compose ps`
- Check database credentials in `.env`
- Review container logs: `docker-compose logs webhook-app`

## Manual Deployment

If you need to deploy manually:

```bash
# On your local machine
docker build -t webhook-app .
docker save webhook-app | gzip > webhook-app.tar.gz

# Transfer to server
scp webhook-app.tar.gz docker-compose.yml deploy@server:/opt/webhook-app/

# On the server
cd /opt/webhook-app
docker load -i webhook-app.tar.gz
docker-compose up -d
```

