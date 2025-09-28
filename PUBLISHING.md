# Task-Marshal Publishing Guide

**BuildWorks.AI - Publishing to NPM and GitHub Packages**

This guide explains how to publish the Task-Marshal MCP server to both the NPM registry and GitHub Package Registry.

## Prerequisites

### 1. GitHub Personal Access Token

Create a Personal Access Token with the following scopes:
- `write:packages` - Upload packages to GitHub Package Registry
- `read:packages` - Download packages from GitHub Package Registry
- `delete:packages` - Delete packages from GitHub Package Registry
- `repo` - Access to repositories (for GitHub Actions)

**Steps:**
1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select the required scopes
4. Copy the token and store it securely

### 2. NPM Account and Token

**Steps:**
1. Create an account at [npmjs.com](https://www.npmjs.com)
2. Enable 2FA on your account
3. Create an automation token:
   ```bash
   npm token create --type=automation
   ```
4. Copy the token and store it securely

## Configuration

### 1. Environment Variables

Set up the following environment variables:

```bash
# GitHub Package Registry
export NODE_AUTH_TOKEN="your-github-token"

# NPM Registry (for manual publishing)
export NPM_TOKEN="your-npm-token"
```

### 2. GitHub Secrets

Add the following secrets to your GitHub repository:

**Repository Settings > Secrets and variables > Actions:**

- `NPM_TOKEN`: Your NPM automation token
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Publishing Methods

### Method 1: Automated Publishing (Recommended)

The GitHub Actions workflow automatically publishes to both registries when:
- Pushing to the `main` branch
- Creating a version tag (e.g., `v1.1.0`)
- Manual workflow dispatch

**Trigger automated publishing:**
```bash
# Push to main branch
git push origin main

# Or create a version tag
git tag v1.1.0
git push origin v1.1.0
```

### Method 2: Manual Publishing

#### Publish to NPM Registry
```bash
# Build and test
npm run build
npm run test

# Publish to NPM
npm run publish:npm
```

#### Publish to GitHub Package Registry
```bash
# Build and test
npm run build
npm run test

# Publish to GitHub Packages
npm run publish:github
```

#### Publish to Both Registries
```bash
# Build and test
npm run build
npm run test

# Publish to both
npm run publish:both
```

### Method 3: Version Management

Use the version management scripts:

```bash
# Patch version (1.1.0 -> 1.1.1)
npm run version:patch

# Minor version (1.1.0 -> 1.2.0)
npm run version:minor

# Major version (1.1.0 -> 2.0.0)
npm run version:major
```

## Installation from Published Packages

### From NPM Registry
```bash
npm install @buildworksai/task-marshal
```

### From GitHub Package Registry
```bash
# Configure npm to use GitHub Packages for @buildworksai scope
echo "@buildworksai:registry=https://npm.pkg.github.com" >> .npmrc

# Install the package
npm install @buildworksai/task-marshal
```

## Package Information

### NPM Registry
- **Package Name**: `@buildworksai/task-marshal`
- **Registry**: https://registry.npmjs.org
- **Package URL**: https://www.npmjs.com/package/@buildworksai/task-marshal

### GitHub Package Registry
- **Package Name**: `@buildworksai/task-marshal`
- **Registry**: https://npm.pkg.github.com
- **Package URL**: https://github.com/buildworksai/task-marshal/packages

## Verification

### Check NPM Publication
```bash
npm view @buildworksai/task-marshal
```

### Check GitHub Package Publication
```bash
npm view @buildworksai/task-marshal --registry=https://npm.pkg.github.com
```

### Test Installation
```bash
# Test from NPM
npm install @buildworksai/task-marshal --dry-run

# Test from GitHub Packages
npm install @buildworksai/task-marshal --dry-run --registry=https://npm.pkg.github.com
```

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: 401 Unauthorized
```
**Solution**: Verify your tokens are correct and have the required scopes.

#### 2. Package Already Exists
```
Error: 403 Forbidden - Package already exists
```
**Solution**: Update the version number in `package.json` before publishing.

#### 3. Scope Mismatch
```
Error: 400 Bad Request - Invalid scope
```
**Solution**: Ensure the package name matches your GitHub organization/username.

#### 4. Registry Configuration
```
Error: 404 Not Found
```
**Solution**: Check your `.npmrc` configuration and registry URLs.

### Debug Commands

```bash
# Check npm configuration
npm config list

# Check registry configuration
npm config get registry

# Check authentication
npm whoami --registry=https://registry.npmjs.org
npm whoami --registry=https://npm.pkg.github.com

# Verbose publishing
npm publish --verbose
```

## Best Practices

### 1. Version Management
- Use semantic versioning (semver)
- Update version before publishing
- Create git tags for releases

### 2. Quality Assurance
- Run tests before publishing
- Ensure all linting passes
- Build the package successfully

### 3. Documentation
- Update README.md with new features
- Maintain CHANGELOG.md
- Document breaking changes

### 4. Security
- Use automation tokens for CI/CD
- Never commit tokens to version control
- Regularly rotate access tokens

## Support

For issues with publishing:
1. Check the GitHub Actions logs
2. Verify token permissions
3. Review package.json configuration
4. Contact BuildWorks.AI support

## Links

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Package Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)
- [Semantic Versioning](https://semver.org/)
- [BuildWorks.AI Support](https://buildworks.ai/support)
