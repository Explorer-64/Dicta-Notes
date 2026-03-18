# Download PWA Assets - Correct Command

## The Issue

You're currently in the `frontend` directory, but the script is in the project root's `scripts` directory.

## Solution: Run from Project Root

**Option 1: Go back to project root first**
```bash
cd ..
python scripts/download_pwa_assets.py
```

**Option 2: Run from frontend directory with correct path**
```bash
python ../scripts/download_pwa_assets.py
```

## Full Steps

1. **Make sure you're in the project root:**
   ```bash
   cd ~/Downloads/dicta-notes\ \(1\)
   # or
   cd "c:/Users/abere/Downloads/dicta-notes (1)"
   ```

2. **Run the download script:**
   ```bash
   python scripts/download_pwa_assets.py
   ```

3. **Verify files were downloaded:**
   ```bash
   # Check icons
   ls frontend/public/icons/*.png | wc -l
   # Should show 17
   
   # Check splash screens
   ls frontend/public/splash/*.png | wc -l
   # Should show 16
   ```

## What the Script Does

- Downloads 17 icon files → `frontend/public/icons/`
- Downloads 16 splash screen files → `frontend/public/splash/`
- Shows progress and summary

## After Download

Once files are downloaded, you can start the dev server:
```bash
cd frontend
yarn dev
```
