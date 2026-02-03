#!/bin/bash

# Convert Org mode file to GitHub Flavored Markdown
# Usage: ./org-to-gfm.sh <org-file>

if [ $# -eq 0 ]; then
	echo "Usage: $0 <org-file>"
	echo "Example: $0 README.org"
	exit 1
fi

ORG_FILE="$1"

if [ ! -f "$ORG_FILE" ]; then
	echo "Error: File '$ORG_FILE' not found"
	exit 1
fi

# Get the base name without extension
BASE_NAME="${ORG_FILE%.org}"
MD_FILE="${BASE_NAME}.md"

echo "Converting $ORG_FILE to $MD_FILE..."

# Use pandoc to convert org to GitHub Flavored Markdown
pandoc -f org -t gfm "$ORG_FILE" -o "$MD_FILE"

if [ $? -eq 0 ]; then
	echo "Successfully converted to $MD_FILE"
else
	echo "Error: Conversion failed"
	exit 1
fi
