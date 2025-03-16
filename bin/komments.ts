#!/usr/bin/env node

import { validateApiKey, setupApiKey } from '../src/config';
import { scanGitChanges } from '../src/git';
import { analyzeCode } from '../src/analyzer';
import { saveSuggestions, applySuggestions } from '../src/suggestions';
import chalk from 'chalk';
import { Command } from 'commander';

/**
 * Main function that runs the Komments tool
 * @param options Command line options
 */
// /**
//  * main - Asynchronously handles main operation
//  * @param options Parameter description
//  * @param temperature? Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
async function main(options: { interactive?: boolean, temperature?: number }) {
  // Validate API key
  const isApiKeyValid = await validateApiKey();
  if (!isApiKeyValid) {
    const setupSuccess = await setupApiKey();
    if (!setupSuccess) {
      console.error(chalk.red('Failed to set up API key. Exiting.'));
      process.exit(1);
    }
  }
  
  // Scan Git changes to find modified files
  const modifiedFiles = await scanGitChanges();
  
  if (modifiedFiles.length === 0) {
    console.log(chalk.yellow('No modified code files found. Exiting.'));
    process.exit(0);
  }
  
  // Analyze code and generate comment suggestions
  const temperature = options.temperature || 0.7;
  const suggestions = await analyzeCode(modifiedFiles, temperature);
  
  // Save suggestions to file
  await saveSuggestions(suggestions);
  console.log(chalk.blue('Suggestions saved to komments.json'));
  
  // Apply suggestions if interactive mode is enabled
  if (options.interactive) {
    await applySuggestions(suggestions);
  } else {
    console.log(chalk.blue('Run with -- --interactive to apply suggestions'));
  }
}

// Set up command line interface
const program = new Command();

program
  .name('komments')
  .description('AI-powered code commenting tool')
  .version('1.0.0')
  .option('-i, --interactive', 'Interactive mode to review and apply suggestions')
  .option('-t, --temperature <number>', 'Temperature for AI generation (0.0-1.0)', parseFloat);

// Default command - generate and save suggestions
program
  .action(async (options) => {
    try {
      await main(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Import command - import suggestions from a komments.json file
program
  .command('import')
  .description('Import and apply comment suggestions from a komments.json file')
  .option('-f, --file <path>', 'Path to the komments.json file')
  .option('-i, --interactive', 'Interactive mode to review suggestions before applying', true)
  .option('-a, --apply-all', 'Apply all suggestions without interactive review')
  .action(async (options) => {
    try {
      // Import the importSuggestions function
      const { importSuggestions } = require('../src/suggestions');
      
      // Determine if we should use interactive mode
      const interactive = options.applyAll ? false : options.interactive;
      
      // Call the import function
      await importSuggestions(options.file, interactive);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);