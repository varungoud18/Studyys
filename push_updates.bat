@echo off
echo =======================================================
echo 🚀 Pushing Dark Mode & AI Studyys updates to GitHub
echo =======================================================

REM Set git config to ensure the commit succeeds
git config user.name "Varun Goud"
git config user.email "varungoudk03@gmail.com"

echo [1/3] Staging changes...
git add -A

echo [2/3] Committing changes...
git commit -m "feat: complete global dark mode styling and fix flashcards state variable mismatches"

echo [3/3] Pushing to main branch...
git push origin main

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo 🎉 Successfully pushed updates to GitHub!
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo ❌ Push failed. Please check your network or terminal authentication.
    echo =======================================================
)
pause
