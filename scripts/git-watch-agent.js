const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');

/**
 * SDE Mastery: Git Watch Agent
 * Automatically runs linting, auto-fixes errors, and commits on save.
 */

console.log('🚀 Git Watch Agent active. Monitoring for saves...');
console.log('Standards: ESLint Auto-fix | Git Auto-commit');

// Initialize watcher on domain directories
const watcher = chokidar.watch(['frontend', 'backend', 'basics', 'database'], {
    ignored: [
        /(^|[\/\\])\../, // ignore dotfiles
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**'
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
    }
});

let isProcessing = false;

watcher.on('change', (filePath) => {
    if (isProcessing) return;
    
    // Only process JS/JSX files for linting/fixing
    const ext = path.extname(filePath);
    if (!['.js', '.jsx'].includes(ext)) return;

    isProcessing = true;
    const fileName = path.basename(filePath);

    console.log(`\n[AGENT] Save detected: ${fileName}`);

    try {
        // 1. Run Lint and Auto-fix
        console.log(`[LINT] Fixing ${fileName}...`);
        try {
            execSync(`npx eslint "${filePath}" --fix`, { stdio: 'inherit' });
        } catch (lintError) {
            console.warn(`[LINT] Warning: Some errors could not be auto-fixed.`);
        }

        // 2. Stage the file
        execSync(`git add "${filePath}"`);

        // 3. Check for changes (avoid empty commits)
        const hasChanges = execSync('git diff --cached --name-only').toString().trim();
        
        if (hasChanges) {
            const commitMsg = `style: auto-fix and track changes in ${fileName}`;
            console.log(`[GIT] Committing: ${commitMsg}`);
            execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
            console.log(`[DONE] ${fileName} synchronized.`);
        } else {
            console.log(`[SKIP] No changes detected after linting.`);
        }

    } catch (error) {
        console.error(`[ERROR] Agent failed for ${fileName}:`, error.message);
    } finally {
        isProcessing = false;
    }
});
