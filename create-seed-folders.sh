#!/bin/bash

# Create seed-assets directory structure for TradingView screenshots
# Usage: chmod +x create-seed-folders.sh && ./create-seed-folders.sh

PAIRS=("EURUSD" "GBPUSD" "USDJPY" "EURJPY" "GBPJPY" "AUDUSD" "XAUUSD")
TIMEFRAMES=("weekly.png" "daily.png" "4h.png" "1h.png")

mkdir -p seed-assets

for pair in "${PAIRS[@]}"; do
  mkdir -p "seed-assets/$pair"
  for tf in "${TIMEFRAMES[@]}"; do
    # Create empty placeholder files (you'll replace these with real screenshots)
    touch "seed-assets/$pair/$tf"
  done
  echo "✓ Created seed-assets/$pair/"
done

echo ""
echo "Folder structure created!"
echo "Now replace the empty .png files with your TradingView screenshots."
echo ""
echo "You can delete any timeframe files you don't have screenshots for."
