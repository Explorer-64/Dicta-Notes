# Install Dependencies

The `react-helmet-async` package is listed in `package.json` but needs to be installed.

## Run this command:

```bash
cd frontend
yarn install
```

This will:
- Install `react-helmet-async` (already in package.json)
- Remove `react-helmet` from node_modules (since we removed it from package.json)
- Update all dependencies

## After installation:

The error should be resolved and Vite will be able to resolve the import.

## If you still see errors:

1. Make sure you're in the `frontend` directory
2. Try clearing the cache: `yarn cache clean`
3. Delete `node_modules` and `yarn.lock`, then run `yarn install` again
