import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';

// Define interfaces
interface CommentSuggestion {
  file: string;
  line: number;
  codeSnippet: string;
  suggestedComment: string;
}

interface SuggestionGeneration {
  id: string;
  timestamp: string;
  suggestions: CommentSuggestion[];
  codebaseInfo?: CodebaseInfo;
}

interface CodebaseInfo {
  fileTypes: Record<string, number>; // Maps file extensions to count
  totalFiles: number;
  languages: string[]; // List of programming languages detected
}

/**
 * Saves comment suggestions to a JSON file as a new generation in an array
 * Each generation is stored with a unique identifier and timestamp
 * @param {Array} suggestions - Array of comment suggestions
 * @returns {Promise<void>}
 */
// ```typescript
// /**
//  * Saves comment suggestions to a 'komments.json' file in the project root directory.
//  * This function persists suggestions across application sessions by storing them as 'generations' in a JSON file.
//  * Each generation represents a set of suggestions saved at a particular time and is identified by a timestamp-based ID.
//  * The function handles existing 'komments.json' files, attempting to read and parse their content.
//  * If the file exists but is in an older format (just an array of suggestions instead of an array of generations),
//  * it automatically upgrades the format by wrapping the existing suggestions in a legacy generation object to maintain backward compatibility.
//  * If reading or parsing the existing file fails, it logs a warning and starts with a fresh array of generations.
//  * This approach ensures data persistence and allows tracking of suggestion history, which can be useful for debugging, auditing, or reviewing past suggestions.
//  *
//  * @param suggestions An array of CommentSuggestion objects to be saved as a new generation.
//  * @returns A Promise that resolves when the suggestions have been successfully saved to the file.
//  */
// ```
// /**
//  * saveSuggestions - Asynchronously handles savesuggestions operation
//  * @param suggestions Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
async function saveSuggestions(suggestions: CommentSuggestion[]): Promise<void> {
  const outputPath = path.join(process.cwd(), 'komments.json');
  let generations: SuggestionGeneration[] = [];
  
  // Read existing file if it exists
  if (fs.existsSync(outputPath)) {
    try {
      const fileContent = fs.readFileSync(outputPath, 'utf8');
      generations = JSON.parse(fileContent);
      
      // Ensure the content is an array
      if (!Array.isArray(generations)) {
        // If the existing file has the old format (just an array of suggestions),
        // convert it to the new format by wrapping it in an array
        generations = [{
          id: 'legacy',
          timestamp: new Date().toISOString(),
          suggestions: Array.isArray(JSON.parse(fileContent)) ? JSON.parse(fileContent) : []
        }];
      }
    } catch (error) {
      console.error(chalk.yellow('Error reading existing komments.json, creating new file'));
      generations = [];
    }
  }
  
  // Collect codebase information
  const codebaseInfo = collectCodebaseInfo();
  
  // Create a new generation with a unique ID (timestamp-based)
  const now = new Date();
  const newGeneration: SuggestionGeneration = {
    id: `gen-${now.getTime()}`,
    timestamp: now.toISOString(),
// /**
//  * applySuggestions - Asynchronously handles applysuggestions operation
//  * @param suggestions Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
    suggestions: suggestions,
    codebaseInfo: codebaseInfo
  };
  
  // Add the new generation to the array
  generations.push(newGeneration);
  
  // Write the updated generations back to the file
  fs.writeFileSync(outputPath, JSON.stringify(generations, null, 2));
}

// /**
//  * Presents an interactive command-line interface to review and apply comment suggestions.
//  * This function guides the user through each suggested comment, prompting them to apply, skip, edit, or exit.
//  * It is designed for interactive mode in the comment generation process, allowing developers to manually review and approve AI-generated comments before they are written to source files.
//  * This ensures quality control and prevents unintended changes to the codebase.
//  * The interactive prompt uses `inquirer` to provide a user-friendly experience for reviewing and managing comment suggestions.
//  *
//  * @param suggestions - An array of CommentSuggestion objects, each containing details about a suggested comment including the file, line number, code snippet, and the suggested comment text.
//  * @returns A Promise that resolves when the interactive review session is completed, either by processing all suggestions or by the user choosing to exit.
//  */
/**
 * Applies comment suggestions interactively
 * @param {Array} suggestions - Array of comment suggestions
 * @returns {Promise<void>}
 */
async function applySuggestions(suggestions: CommentSuggestion[]): Promise<void> {
  console.log(chalk.blue('\nInteractive mode: Review and apply suggestions'));
  console.log(chalk.yellow('This will modify your source files by adding comments.\n'));
  
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    
    console.log(chalk.cyan(`\nFile: ${suggestion.file}`));
    console.log(chalk.cyan(`Line: ${suggestion.line}`));
    console.log(chalk.cyan(`Code: ${suggestion.codeSnippet}`));
    console.log(chalk.green(`Suggested comment: ${suggestion.suggestedComment}`));
    
    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Apply this comment', value: 'apply' },
        { name: 'Skip this comment', value: 'skip' },
        { name: 'Edit before applying', value: 'edit' },
        { name: 'Exit interactive mode', value: 'exit' }
      ]
    }]);
    
    if (action === 'exit') {
      console.log(chalk.yellow('Exiting interactive mode.'));
      break;
    }
    
    if (action === 'skip') {
      console.log(chalk.yellow('Skipped.'));
      continue;
    }
    
    let commentToApply = suggestion.suggestedComment;
    
    if (action === 'edit') {
      const { editedComment } = await inquirer.prompt([{
        type: 'editor',
        name: 'editedComment',
        message: 'Edit the comment:',
        default: suggestion.suggestedComment
      }]);
      
      commentToApply = editedComment;
    }
    
// /**
//  * Asynchronously applies a comment to a specific line in a file.
//  * This function programmatically adds comments to code files, enabling automated documentation or annotation processes.
//  * It resolves file paths, determines the appropriate comment style based on the file extension (e.g., '//' for JavaScript, '/*' '*/' for C-style languages),
//  * formats the comment accordingly (handling single-line, multi-line, and block comments), and inserts it at the specified line number.
//  * The function ensures file paths are correctly resolved, whether absolute or relative to the project root, providing flexibility in usage.
//  * It reads and writes file content using the file system, making it suitable for file manipulation tasks within a build process or tooling.
//  * @param filePath - The path to the file to be modified. Can be absolute or relative to the project's current working directory.
//  * @param lineNumber - The line number where the comment should be inserted (1-based index).
//  * @param comment - The comment string to be inserted. Can be a single-line or multi-line string.
//  * @returns A Promise that resolves when the comment has been successfully applied to the file.
//  */
    if (action === 'apply' || action === 'edit') {
      try {
        await applyCommentToFile(suggestion.file, suggestion.line, commentToApply);
        console.log(chalk.green('Comment applied successfully!'));
      } catch (error: any) {
// ```typescript
// /**
//  * Asynchronously applies a comment to a specific line in a file.
//  * This function is designed to programmatically add comments to code files, 
//  * for example, during automated documentation updates or code modification scripts. 
//  * It dynamically determines the comment style based on the file extension using the `getCommentStyle` function, 
//  * supporting various programming languages. The function resolves relative file paths against the project root.
//  * It handles single-line, multi-line, and block comments appropriately based on the file type and comment content.
//  * @param filePath The path to the file to be modified. Can be absolute or relative to the project root.
//  * @param lineNumber The line number where the comment should be inserted (1-based index).
//  * @param comment The comment string to be inserted. Can be a single-line or multi-line string.
//  * @returns {Promise<void>} A Promise that resolves when the comment has been successfully applied to the file.
//  */
// ```
        console.error(chalk.red(`Error applying comment: ${error.message}`));
      }
    }
  }
  
  console.log(chalk.green('\nInteractive session completed.'));
}

/**
 * Applies a comment to a file at the specified line
 * @param {string} filePath - Path to the file
 * @param {number} lineNumber - Line number to add comment
 * @param {string} comment - Comment text to add
 * @returns {Promise<void>}
 */
async function applyCommentToFile(filePath: string, lineNumber: number, comment: string): Promise<void> {
  // Resolve the file path relative to the project root if it's not absolute
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  // Read the file content
  const fileContent = fs.readFileSync(resolvedPath, 'utf8');
  const lines = fileContent.split('\n');
  
  // Determine the appropriate comment style based on file extension
  const extension = path.extname(resolvedPath).toLowerCase();
// /**
//  * getCommentStyle handles getcommentstyle operation
//  * @param extension Parameter description
//  */
  const { prefix, suffix } = getCommentStyle(extension);
  
  // Format the comment
// /**
//  * Retrieves the appropriate comment style (prefix and suffix) based on the provided file extension.
//  * This function is used to dynamically determine the correct syntax for commenting code in different programming languages.
//  * It supports a predefined set of common file extensions and their corresponding comment styles.
//  * If an extension is not found in the predefined styles, it defaults to a single-line comment style ('//').
//  * This is crucial for features that need to generate or manipulate code comments across various languages, ensuring correct syntax and avoiding parsing errors.
//  * @param extension The file extension (e.g., '.js', '.py', '.html') as a string. Case-insensitive.
//  * @returns An object of type CommentStyle, containing 'prefix' and 'suffix' properties representing the comment syntax for the given extension.
//  * For example, for '.js', it returns { prefix: '//', suffix: '' }, and for '.html', it returns { prefix: '<!--', suffix: '-->' }.
//  */
  let formattedComment: string;
  if (suffix) {
    // For languages with block comments
    formattedComment = `${prefix} ${comment} ${suffix}`;
  } else if (comment.includes('\n')) {
    // For multi-line comments
    formattedComment = comment.split('\n').map(line => `${prefix} ${line}`).join('\n');
  } else {
    // For single-line comments
    formattedComment = `${prefix} ${comment}`;
  }
  
  // Insert the comment before the specified line
  lines.splice(lineNumber - 1, 0, formattedComment);
  
  // Write the modified content back to the file
  fs.writeFileSync(resolvedPath, lines.join('\n'));
}

interface CommentStyle {
  prefix: string;
  suffix: string;
}

/**
 * Gets the appropriate comment style for a file extension
 * @param {string} extension - File extension
 * @returns {{prefix: string, suffix: string}} Comment style
 */
function getCommentStyle(extension: string): CommentStyle {
  const commentStyles: Record<string, CommentStyle> = {
    '.js': { prefix: '//', suffix: '' },
    '.jsx': { prefix: '//', suffix: '' },
    '.ts': { prefix: '//', suffix: '' },
    '.tsx': { prefix: '//', suffix: '' },
    '.py': { prefix: '#', suffix: '' },
    '.java': { prefix: '//', suffix: '' },
    '.c': { prefix: '//', suffix: '' },
    '.cpp': { prefix: '//', suffix: '' },
    '.cs': { prefix: '//', suffix: '' },
    '.go': { prefix: '//', suffix: '' },
    '.rb': { prefix: '#', suffix: '' },
    '.php': { prefix: '//', suffix: '' },
    '.swift': { prefix: '//', suffix: '' },
    '.rs': { prefix: '//', suffix: '' },
    '.html': { prefix: '<!--', suffix: '-->' },
    '.css': { prefix: '/*', suffix: '*/' },
    '.scss': { prefix: '//', suffix: '' }
  };
  
  const key = extension.toLowerCase();
  return commentStyles[key as keyof typeof commentStyles] || { prefix: '//', suffix: '' };
}

/**
 * Imports and applies comment suggestions from a komments.json file
 * @param {string} filePath - Path to the komments.json file (optional, defaults to komments.json in current directory)
 * @param {boolean} interactive - Whether to apply suggestions interactively
 * @returns {Promise<void>}
 */
async function importSuggestions(filePath?: string, interactive: boolean = true): Promise<void> {
  const inputPath = filePath || path.join(process.cwd(), 'komments.json');
  
  if (!fs.existsSync(inputPath)) {
    console.error(chalk.red(`Error: File ${inputPath} does not exist.`));
    return;
  }
  
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle both new format (array of generations) and old format (array of suggestions)
    let suggestions: CommentSuggestion[] = [];
    
    if (Array.isArray(data)) {
      if (data.length > 0 && data[0].suggestions) {
        // New format - array of generations
        // Get the most recent generation by default
        const latestGeneration = data[data.length - 1];
        suggestions = latestGeneration.suggestions;
        
        // If the generation has codebaseInfo, use it to set up context
        if (latestGeneration.codebaseInfo) {
          console.log(chalk.blue('Using codebase information from komments.json for context'));
          // This information could be used to optimize comment generation in the future
        }
      } else {
        // Old format - direct array of suggestions
        suggestions = data;
      }
    } else {
      console.error(chalk.red('Error: Invalid komments.json format.'));
      return;
    }
    
    console.log(chalk.green(`Found ${suggestions.length} comment suggestions to import.`));
    
    if (interactive) {
      // Use the existing interactive applySuggestions function
      await applySuggestions(suggestions);
    } else {
      // Apply all suggestions without interaction
      console.log(chalk.blue('Applying all suggestions without interaction...'));
      
      for (const suggestion of suggestions) {
        try {
          await applyCommentToFile(suggestion.file, suggestion.line, suggestion.suggestedComment);
          console.log(chalk.green(`Applied comment to ${suggestion.file}:${suggestion.line}`));
        } catch (error: any) {
          console.error(chalk.red(`Error applying comment to ${suggestion.file}:${suggestion.line}: ${error.message}`));
        }
      }
      
      console.log(chalk.green('\nAll suggestions have been applied.'));
    }
  } catch (error: any) {
    console.error(chalk.red(`Error importing suggestions: ${error.message}`));
  }
}

export {
  saveSuggestions,
  applySuggestions,
  importSuggestions
};


/**
 * Collects information about the codebase to provide context for comment generation
 * @returns {CodebaseInfo} Object containing information about the codebase
 */
function collectCodebaseInfo(): CodebaseInfo {
  const cwd = process.cwd();
  const fileTypes: Record<string, number> = {};
  const languages = new Set<string>();
  let totalFiles = 0;
  
  // Function to recursively scan directories
  function scanDir(dirPath: string) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Skip node_modules and hidden directories
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
            continue;
          }
          scanDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext) {
            // Count file types
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
            totalFiles++;
            
            // Map extensions to languages
            const language = getLanguageFromExtension(ext);
            if (language) {
              languages.add(language);
            }
          }
        }
      }
    } catch (error) {
      // Silently continue if we can't read a directory
    }
  }
  
  // Start scanning from current directory
  scanDir(cwd);
  
  return {
    fileTypes,
    totalFiles,
    languages: Array.from(languages)
  };
}

/**
 * Gets the programming language name from file extension
 * @param {string} extension - File extension
 * @returns {string|null} Programming language name or null if unknown
 */
function getLanguageFromExtension(extension: string): string | null {
  const languageMap: Record<string, string> = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript (React)',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript (React)',
    '.py': 'Python',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.cs': 'C#',
    '.go': 'Go',
    '.rb': 'Ruby',
    '.php': 'PHP',
    '.swift': 'Swift',
    '.rs': 'Rust',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS'
  };
  
  return languageMap[extension.toLowerCase()] || null;
}