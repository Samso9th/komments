# Komments

A tool that integrates with Google Gemini AI to analyze code and suggest comments.

## Installation

```bash
npm install -g komments
```

Or run directly with npx:

```bash
npx komments
```

## Features

- Scans Git changes to focus on recently modified files
- Uses Google Gemini AI to analyze code and suggest meaningful comments
- Interactive mode to review and apply suggestions
- Support for multiple programming languages
- Customizable AI temperature setting
- Import and apply suggestions from saved files
- Remove comments from codebase with interactive confirmation

## Setup

On first run, you'll be prompted to enter your Google Gemini API key. You can get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

The API key will be saved to `.env.local` and `.env` files in your project root. These files will be automatically added to your `.gitignore` to prevent accidental exposure.

## Usage

### Generate Comments

```bash
# Basic usage - scans Git changes and saves suggestions to komments.json
komments

# Review and apply suggestions interactively
komments --interactive

# Control the creativity of AI suggestions (0.0-1.0)
komments --temperature 0.5
```

### Import Suggestions

```bash
# Import and apply suggestions from a komments.json file
komments import --file path/to/komments.json

# Import and apply all suggestions without interactive review
komments import --apply-all
```

### Remove Comments

```bash
# Remove all comments from the codebase (with interactive confirmation)
komments remove-comments

# Remove all comments without confirmation
komments remove-comments --no-interactive
```

## Output

Suggestions are saved to `komments.json` in the following format:

```json
[
  {
    "id": "gen-1234567890",
    "timestamp": "2023-01-01T12:00:00.000Z",
    "suggestions": [
      {
        "file": "src/example.js",
        "line": 42,
        "codeSnippet": "function calculateTax(...)...",
        "suggestedComment": "Calculates tax based on income and region."
      }
    ]
  }
]
```

The format supports multiple generations of suggestions, with each generation having a unique ID and timestamp. This allows you to track different sets of suggestions over time.

Comment removal operations are also recorded in the `komments.json` file, providing a history of comment management activities.

## Supported Languages

- JavaScript/TypeScript
- Python
- Java
- C/C++
- C#
- Go
- Ruby
- PHP
- Swift
- Rust
- HTML/CSS/SCSS

## License

MIT