@echo off
echo =======================================================
echo 🚀 Pushing Studyys to GitHub Repository
echo =======================================================
cd /d "%~dp0"

REM 1. Initialize Git repository if not present
if not exist .git (
    echo [1/5] Initializing new Git repository...
    git init
) else (
    echo [1/5] Git repository already initialized.
)

REM Set local git author configs so commit doesn't fail
git config user.name "Varun Goud"
git config user.email "varungoudk03@gmail.com"

REM 2. Stage all files
echo [2/5] Staging files...
git add -A

REM 3. Create a commit
echo [3/5] Creating commit...
git commit -m "feat: Initial commit of Studyys project with Google OAuth and Gemini AI"
if %errorlevel% neq 0 (
    echo [!] Commit failed or there are no new changes to commit.
)

REM 4. Set the Remote URL
echo [4/5] Setting remote repository origin...
git remote remove origin 2>nul
git remote add origin https://github.com/varungoud18/Studyys.git

REM 5. Rename branch to main and push
echo [5/5] Pushing to main branch on GitHub...
git branch -M main
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo 🎉 Successfully pushed to https://github.com/varungoud18/Studyys.git!
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo ❌ Push failed. Please make sure:
    echo    1. You have logged into GitHub in your terminal.
    echo    2. The repository exists under your username.
    echo =======================================================
)
pause
