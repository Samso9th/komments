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

## Setup

On first run, you'll be prompted to enter your Google Gemini API key. You can get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

The API key will be saved to `.env.local` and `.env` files in your project root. These files will be automatically added to your `.gitignore` to prevent accidental exposure.

## Usage

```bash
# Basic usage - scans Git changes and saves suggestions to komments.json
komments

# Preview suggestions without saving
komments --dry-run

# Review and apply suggestions interactively
komments --interactive

# Control the creativity of AI suggestions (0.0-1.0)
komments --temperature 0.5
```

## Output

Suggestions are saved to `komments.json` in the following format:

```json
[
  {
    "file": "src/example.js",
    "line": 42,
    "codeSnippet": "function calculateTax(...)...",
    "suggestedComment": "Calculates tax based on income and region."
  }
]
```

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