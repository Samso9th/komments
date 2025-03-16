import { validateApiKey, setupApiKey } from './config';
import { scanGitChanges } from './git';
import { analyzeCode } from './analyzer';
import { saveSuggestions, applySuggestions, removeComments } from './suggestions';
import chalk from 'chalk';
import { Command } from 'commander';

/**
 * Main function that runs the Komments tool
 * @param {Object} options - Command line options
 */
// /**
//  * main - Asynchronously handles main operation
//  * @param options Parameter description
//  * @param temperature? Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
// /**
//  * main - Asynchronously handles main operation
//  * @param options Parameter description
//  * @param temperature? Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
/**
 * main - Asynchronously handles main operation
 * @param options Parameter description
 * @param temperature? Parameter description
 * @returns {Promise} Promise that resolves when the operation completes
 */
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
// /**
//  * handleRemoveComments - Asynchronously handles handleremovecomments operation
//  * @param options Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
// /**
//  * Handles the overall process of removing comments.
//  * This function validates the API key
/**
 * *
 * Handles the process of removing comments.
 * This function is the entry point for the comment removal feature. It first validates the API key to ensure it's available for potential future API-dependent operations, even if not immediately used in the current comment removal process. If the API key is invalid, it attempts to guide the user through the setup process. If setup fails, the program exits. Finally, it calls the `removeComments` function to perform the actual comment removal logic. The API key validation step is included to anticipate future enhancements that might leverage cloud services or require authentication for comment processing.
 * @param options - An object containing options for comment removal.
 * @param options.interactive -  A boolean indicating whether to run in interactive mode. If `true` or undefined, `removeComments` will likely prompt the user for confirmation or choices during the removal process. If `false`, it will run non-interactively.
 * @returns A Promise that resolves
 */
const program = new Command();

/**
 * Handles the remove-comments command
 * @param {Object} options - Command line options
 */
async function handleRemoveComments(options: { interactive?: boolean }) {
  // Validate API key (still needed for potential future operations)
  const isApiKeyValid = await validateApiKey();
  if (!isApiKeyValid) {
    const setupSuccess = await setupApiKey();
    if (!setupSuccess) {
      console.error(chalk.red('Failed to set up API key. Exiting.'));
      process.exit(1);
    }
  }
  
  // Call the removeComments function
  await removeComments([], options.interactive !== false);
}

program
  .name('komments')
  .description('AI-powered code commenting tool')
  .version('1.0.0')
  .option('-i, --interactive', 'Interactive mode to review and apply suggestions')
  .option('-t, --temperature <number>', 'Temperature for AI generation (0.0-1.0)', parseFloat)
  .action(async (options) => {
    try {
      await main(options);
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('remove-comments')
  .description('Remove all comments from the codebase')
  .option('-i, --interactive', 'Enable interactive mode to confirm before removing comments', true)
  .action(async (options) => {
    await handleRemoveComments(options);
  });

program.parse(process.argv);