# The SDE2 Repository Master Guide 🎓

This guide explains the architectural and engineering principles used to transform this repository. Use this as a reference to build professional-grade codebases from scratch.

---

## 🏗 Part 1: Folder Architecture (Domain-Driven Design)

### The Beginner's Mistake: Chronological Organizing
Organizing by `Week 1`, `Week 2`, etc., makes it impossible to find specific technical knowledge later. If you want to find "Express Middlewares," you shouldn't have to remember you learned it in "Week 4."

### The SDE2 Approach: Domain-Based Organizing
Group code by **what it does**, not **when you wrote it**.

**Example Structure:**
```text
/backend    -> Node.js, Express, Go, Python servers
/frontend   -> React, Tailwind, HTML/CSS projects
/database   -> SQL scripts, MongoDB schemas, Indexing notes
/basics     -> Language fundamentals (Promises, Loops, Logic)
/docs       -> Architecture diagrams, templates, study notes
```

**Pro Tip:** Use the **Master Roadmap** in your root `README.md` to bridge the gap. Link "Week 4" to your `/backend/week-4` folder so you keep the chronological history without the mess.

---

## 🚨 Part 2: Deep Dive into Linting

### What is Linting?
Think of a **Linter** as an automated "Code Police Officer." It scans your code as you write it and flags errors, potential bugs, or messy formatting.

### Why do we need it?
1.  **Consistency:** Ensures `camelCase` vs `snake_case` is uniform.
2.  **Error Prevention:** Flags variables that are defined but never used (which waste memory).
3.  **Safety:** Forces you to use `===` instead of `==` to avoid weird JavaScript type-coercion bugs.

### Anatomy of `.eslintrc.json`
This is the configuration file for **ESLint** (the industry-standard JavaScript linter).

```json
{
  "env": {
    "node": true,    // Tells ESLint you are using Node.js globals like 'process'
    "browser": true, // Tells ESLint you are using browser globals like 'window'
    "jest": true     // Allows testing keywords like 'describe' and 'it'
  },
  "extends": "eslint:recommended", // Uses the standard rules used by companies like Google/Airbnb
  "rules": {
    "semi": ["error", "always"],    // FORCES every line to end with a semicolon
    "quotes": ["warn", "single"],   // SUGGESTS using 'single quotes' instead of "double"
    "no-console": "off"             // ALLOWS you to use console.log (usually banned in production)
  }
}
```

### The Workflow
1.  **Lint:** Run `npm run lint`. It lists all the crimes in your code.
2.  **Fix:** Run `npm run lint -- --fix`. ESLint will automatically fix about 90% of the issues (like adding semicolons).
3.  **Manual Correction:** Fix the remaining 10% (like unused variables) by hand.

---

## 🛠 Part 3: CI/CD (GitHub Actions)

### What is it?
**CI** stands for **Continuous Integration**. It means that every time you "Integrate" (push) code to GitHub, an automated process checks it.

### How it works (`.yml` files)
The file in `.github/workflows/lint.yml` tells GitHub:
1.  "Hey, when I push code..."
2.  "Start a new Ubuntu computer in the cloud."
3.  "Download my code onto that computer."
4.  "Run `npm install` and `npm run lint`."
5.  "If the linter finds errors, fail the build and send me an email!"

**Why this matters:** In a professional job, you cannot merge your code into the "master" branch if the CI build is failing. It’s the ultimate quality gate.

---

## 📝 Part 4: Professional Documentation

### The README.md (The "Face")
A professional README should answer:
1.  **What is this?** (Description)
2.  **How do I run it?** (Setup Instructions)
3.  **What did you use?** (Tech Stack)
4.  **Where is the content?** (Roadmap/Table of Contents)

### The CONTRIBUTING.md (The "Rules")
Even if you are the only developer, this file defines the "Git Flow."
- **Branch names:** `feature/xxx`, `bugfix/xxx`.
- **Commit messages:** Use clear descriptions (e.g., `feat: add user authentication`).

---

## ✅ The SDE2 Checklist for New Projects
Whenever you start a new folder or repo, do this:
1.  [ ] `git init`
2.  [ ] Create a `.gitignore` (don't upload `node_modules`!).
3.  [ ] `npm init -y` to create a `package.json`.
4.  [ ] `npm install eslint --save-dev` to set up your "Code Police."
5.  [ ] Create a `README.md` using your [template](./docs/README_TEMPLATE.md).
6.  [ ] Set up a GitHub Action to automate testing/linting.

**Following this guide ensures that your repository is not just a "learning log," but a portfolio that proves you are ready for a professional engineering role.**
