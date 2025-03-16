import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Validates if the Gemini API key exists in environment variables
 * @returns {boolean} True if API key exists, false otherwise
 */
// /**
//  * Validates the presence of the Google Gemini API key.
//  * This function checks if the `GOOGLE_GEMINI_API_KEY` environment variable is set.
//  * It serves as a basic configuration validation step to ensure the application is properly configured to interact with the Google Gemini API.
//  * The application logic depends on this check to prevent runtime errors that would occur when attempting to use the Gemini API without a configured API key.
//  * The function returns a boolean indicating whether the environment variable is considered truthy (present and not empty).
//  * @returns {Promise<boolean>} - A Promise that resolves to `true` if the `GOOGLE_GEMINI_API_KEY` environment variable is set and considered truthy, otherwise `false`.
//  */
async function validateApiKey(): Promise<boolean> {
  return !!process.env.GOOGLE_GEMINI_API_KEY;
}

/**
 * Sets up the Gemini API key by prompting the user and saving to .env files
 */
async function setupApiKey(): Promise<boolean> {
  console.log(chalk.yellow('Gemini API key not found.'));
  console.log(chalk.blue('You can get a free API key from Google AI Studio:'));
  console.log(chalk.blue('https://aistudio.google.com/app/apikey'));
  
  const { apiKey } = await inquirer.prompt([{
    type: 'password',
    name: 'apiKey',
    message: 'Enter your Gemini API key:',
    validate: (input: string) => input.length > 0 ? true : 'API key cannot be empty'
  }]);
  
  // Save to .env.local in project root
  const envLocalPath = path.join(process.cwd(), '.env.local');
  fs.writeFileSync(envLocalPath, `GOOGLE_GEMINI_API_KEY=${apiKey}\n`);
  
  // Also save to .env for backward compatibility
  const envPath = path.join(process.cwd(), '.env');
  fs.writeFileSync(envPath, `GOOGLE_GEMINI_API_KEY=${apiKey}\n`);
  
  // Add to .gitignore if it exists
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  try {
    let gitignoreContent = '';
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    // Check if .env files are already in .gitignore
    const envEntries = ['.env', '.env.local'];
    const missingEntries = envEntries.filter(entry => !gitignoreContent.includes(entry));
    
    if (missingEntries.length > 0) {
      const appendContent = '\n# Komments API keys\n' + missingEntries.join('\n') + '\n';
      fs.appendFileSync(gitignorePath, appendContent);
      console.log(chalk.green(`Added ${missingEntries.join(', ')} to .gitignore for security`));
    }
  } catch (error: any) {
    console.warn(chalk.yellow(`Warning: Could not update .gitignore. Please manually add .env and .env.local to your .gitignore file.`));
  }
  
  // Reload environment variables
  dotenv.config();
  console.log(chalk.green('API key saved successfully!'));
  
  return true;
}

export {
  validateApiKey,
  setupApiKey
};