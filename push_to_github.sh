#!/bin/bash
echo "======================================================="
echo "🚀 Pushing Studyys to GitHub Repository"
echo "======================================================="

# Navigate to script directory
cd "$(dirname "$0")"

# 1. Initialize Git repository if not present
if [ ! -d ".git" ]; then
    echo "[1/5] Initializing new Git repository..."
    git init
else
    echo "[1/5] Git repository already initialized."
fi

# Set local git author configs so commit doesn't fail
git config user.name "Varun Goud"
git config user.email "varungoudk03@gmail.com"

# 2. Stage all files
echo "[2/5] Staging files..."
git add -A

# 3. Create a commit
echo "[3/5] Creating commit..."
git commit -m "feat: Initial commit of Studyys project with Google OAuth and Gemini AI"

# 4. Set the Remote URL
echo "[4/5] Setting remote repository origin..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/varungoud18/Studyys.git

# 5. Rename branch to main and push
echo "[5/5] Pushing to main branch on GitHub..."
git branch -M main
git push -u origin main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================================="
    echo "🎉 Successfully pushed to https://github.com/varungoud18/Studyys.git!"
    echo "======================================================="
else
    echo ""
    echo "======================================================="
    echo "❌ Push failed. Please make sure:"
    echo "   1. You have logged into GitHub in your terminal."
    echo "   2. The repository exists under your username."
    echo "======================================================="
fi
read -p "Press enter to continue..."
