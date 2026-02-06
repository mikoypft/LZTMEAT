# LZTMEAT Deployment Workflow Guide

## Overview
This document outlines the process for developing features in the `local` branch and safely deploying them to the `prod` branch without disrupting production settings.

## Branch Strategy

### `local` (Development/Main Branch)
- Where all feature development happens
- Merged into `prod` when ready for production
- Protected files via `.gitignore` (environment configs, server settings)

### `prod` (Production Branch)
- Mirrors current production environment
- Contains production-only configuration files
- Should only receive carefully tested, reviewed changes from `local`

## Files Protected from Development

The following production-critical files are listed in `.gitignore` and will NOT be committed from the `local` branch:

### Environment/Configuration Files
- `.env.production` - Production database credentials
- `backend/.env.production` - Backend production configuration
- `backend/.env` - Server environment config
- `.htaccess` - Apache/Plesk server directives

### Server/Deployment Files
- `PLESK_DEPLOYMENT.md` - Deployment notes and Plesk-specific settings
- `backend/bootstrap/cache/` - Server runtime cache

### Logs and Temporary Files
- `*.log` files
- `backend/history_output.txt`
- `backend_server.log`

## Workflow: Developing a Feature

1. **Switch to local branch**
   ```bash
   git checkout local
   ```

2. **Create a feature branch (optional but recommended)**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Develop and commit your changes**
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

4. **Push to local or create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Workflow: Deploying to Production

### Step 1: Test Thoroughly
- Test all changes locally
- Ensure database migrations work
- Verify API endpoints
- Test frontend components

### Step 2: Prepare for Merge
```bash
git checkout local
git pull origin local
```

### Step 3: Merge local → prod (Selective Merge)
```bash
# Option A: Merge with production as the authoritative source for conflicts
git checkout prod
git merge -X theirs -m "Merge features from local to prod" local

# Option B: Squash merge for cleaner history (review all changes)
git checkout prod
git merge --squash -m "Merge features from local to prod" local
git commit
```

### Step 4: Verify Production Files Are Intact
Before pushing, manually verify:
```bash
# Check that production files weren't accidentally modified
git status
```

**Critical files to check:**
- `.env.production` status
- `backend/.env.production` status
- `.htaccess` status
- `PLESK_DEPLOYMENT.md` status
- `backend/bootstrap/cache/` status

### Step 5: Push to Production
```bash
git push origin prod
```

### Step 6: Deploy to Plesk
Follow your standard Plesk deployment process:
1. Log into Plesk control panel
2. Deploy the `prod` branch
3. Run any necessary migrations
4. Clear caches
5. Verify the site is working

## Important: If Merge Goes Wrong

If you accidentally merged changes that affected production files:

```bash
# Abort the merge (if not yet pushed)
git merge --abort

# Or revert the merge (if already pushed)
git revert -m 1 HEAD
git push origin prod
```

## Recovery: Restore Production Files from Remote

If critical production files were modified locally:

```bash
git checkout origin/prod -- .env.production backend/.env.production .htaccess
git commit -m "Restore production files from remote"
git push origin local
```

## Best Practices

✓ **Do:**
- Develop features in the `local` branch
- Use feature branches for complex features
- Test thoroughly before merging to `prod`
- Always review `.gitignore` violations
- Keep `.env.production` files NEVER in git
- Document any Plesk-specific configurations in `PLESK_DEPLOYMENT.md`

✗ **Don't:**
- Commit `.env.production` or sensitive credentials
- Directly push to `prod` without testing
- Commit database connection strings
- Commit server cache files
- Manually modify `prod` branch except for approved deployments

## Protected Branches (Recommended GitHub Setting)

For additional safety, you can protect the `prod` branch in GitHub to:
- Require pull request reviews before merging
- Require status checks to pass
- Require code reviews from team members
- Prevent force pushes

Go to: GitHub → Settings → Branches → Branch protection rules

## Workflow Diagram

```
local (Development)
   ↓
   ├─→ Feature branches (feature/*)
   │   ↓
   │   ├─ Test locally
   │   ├─ Code review
   │   └─→ Merge back to local
   │
   ↓ (when ready for production)
   
prod (Production - Stable)
   ↓
   └─→ Deploy to Plesk
```

## Troubleshooting

### "Too many files changed in merge"
- Check if you're merging unintended branches
- Use `git merge --squash` for cleaner history
- Manually review changes before committing

### "Production files were modified"
- Check if `.gitignore` is working: `git check-ignore -v [filename]`
- Restore from remote: `git checkout origin/prod -- [filename]`
- Re-add file to `.gitignore` if needed

### "Can't push to prod"
- Ensure you're on the `prod` branch
- Check if the branch is protected (GitHub Settings)
- Verify you have push permissions

## Questions?
Refer to this document before merging to production. When in doubt, manually verify all changes before pushing.
