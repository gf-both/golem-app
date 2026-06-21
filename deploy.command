#!/bin/bash
cd "$(dirname "$0")"
rm -f .git/index.lock
git add -A
git commit -m "fix: light mode visibility (57 files), ritual card cleanup, Gene Keys synthesis, website copy revamp, CSS palette upgrade"
git push origin main
echo ""
echo "✅ Deployed! Changes will be live on Vercel in ~60 seconds."
echo ""
read -p "Press Enter to close..."
