import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { escapeRegExp } from './utils';

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
  commentRemoval?: CommentRemovalOperation;
}

interface CommentRemovalOperation {
  timestamp: string;
  filesProcessed: string[];
  commentsRemoved: number;
  details: CommentRemovalDetail[];
}

interface CommentRemovalDetail {
  file: string;
  commentsRemoved: number;
}

interface CodebaseInfo {
  fileTypes: Record<string, number>; // Maps file extensions to count
  totalFiles: number;
  languages: string[]; // List of programming languages detected
}

// /**
//  * Saves comment suggestions to a 'komments.json' file in the project root.
//  * This function persists comment suggestions across different runs of the application.
//  * It reads existing generations from the file, if present, handling potential legacy formats where the file might only contain a flat array of suggestions.
//  * If a legacy format is detected, it wraps the existing suggestions into a new generation object.
//  * A new 'generation' of suggestions is created for each invocation, including a timestamp and codebase information captured at the time of generation.
//  * This allows for tracking and reviewing suggestions generated at different points in time and with different codebase states.
//  * The updated list of generations, including the newly provided suggestions, is then written back to the 'komments.json' file.
//  *
//  * @param suggestions An array of CommentSuggestion objects representing the suggestions to
// /**
//  * Saves comment suggestions to a 'komments.json' file in the project root.
//  * This function persists generated comment suggestions across sessions, allowing for review and later application.
//  * It reads any existing 'komments.json' file to maintain previous suggestion generations.
//  * If the file exists and is in an older format (just an array of suggestions), it migrates it to the new format.
//  * Each save operation creates a new "generation" with a unique ID (timestamp-based) and includes codebase information captured at the time of saving.
//  * This allows for tracking suggestions over time and contextualizing them with codebase snapshots.
//  * @param suggestions An array of comment suggestions to be saved in the new generation.
//  * @returns A Promise that resolves when the suggestions are successfully saved to 'komments.json'.
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
// /**
//  * Presents comment suggestions to the user in an interactive command-line interface for review and application.
//  * For each suggestion, the user is prompted to apply, skip, edit, or exit the interactive session.
//  * This interactive mode is designed to ensure user oversight and refinement of automatically generated comments before they are applied to source code, promoting code quality and accurate documentation.
//  * @param suggestions An array of comment suggestions, each containing details like file path, line number, code snippet, and the suggested comment text.
//  * @returns {Promise<void>} A Promise that resolves when the interactive review session is completed.
//  */
// /**
//  * Asynchronously presents an interactive command-line interface to review and apply suggested comments to code files.
//  * This function is designed for interactive comment application, allowing users to examine each suggested comment,
//  * preview the code context, and decide whether to apply the comment, skip it, edit it before applying, or exit the interactive session.
//  * It iterates through an array of `CommentSuggestion` objects, each containing details about a suggested comment,
//  * and uses `inquirer` to prompt the user for an action for each suggestion.
//  * The purpose is to provide a user-friendly way to manually review and control the application of automatically generated comments,
//  * ensuring accuracy and relevance before modifying source code files. This is particularly useful in workflows where
//  * automated comment generation is used but human oversight is desired for quality assurance.
//  *
//  * @param suggestions An array of `CommentSuggestion` objects, each representing a suggested comment and its context (file, line, code snippet).
//  * @returns A Promise that resolves when the interactive session is completed or exited.
//  */
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
// /**
//  * Asynchronously applies a formatted comment to a specific line in a file.
//  * This function is designed to programmatically insert comments into code files, adapting to different file types by using the appropriate comment syntax.
//  * It resolves file paths, reads file content, determines comment style based on file extension using `getCommentStyle`, formats the comment, inserts it at the specified line, and writes the changes back to the file.
//  * The purpose is to automate the process of adding comments to files, ensuring correct syntax for various programming languages and file formats.
// /**
//  * applyCommentToFile - Asynchronously handles applycommenttofile operation
//  * @param filePath Parameter description
//  * @param lineNumber Parameter description
//  * @param comment Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
//  * This is useful in scenarios like code generation, automated documentation, or adding annotations to code.
//  * @param filePath The path to the file to be modified. Can be absolute or relative to the project root.
//  * @param lineNumber The line number where the comment should be inserted (1-based index).
//  * @param comment The comment string to be inserted. The function will handle formatting this comment based on the file type.
//  * @returns A Promise that resolves when the comment has been successfully applied to the file.
//  */
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
  const { prefix, suffix } = getCommentStyle(extension);
  
  // Format the comment
  let formattedComment: string;
  
  // Check if the comment appears to be a JSDoc comment (contains @param, @returns, etc.)
  const isJSDocComment = (
    (extension === '.js' || extension === '.jsx' || extension === '.ts' || extension === '.tsx') &&
    (comment.includes('@param') || comment.includes('@return') || comment.includes('@returns') || 
     comment.includes('@description') || comment.includes('@example') || comment.includes('@typedef') ||
     comment.includes('@type') || comment.includes('@function') || comment.includes('@class'))
  );
  
  if (isJSDocComment) {
    // Format as proper JSDoc comment
    if (comment.startsWith('/**') && comment.endsWith('*/')) {
      // Comment is already properly formatted
      formattedComment = comment;
    } else {
      // Format as JSDoc comment
      const commentLines = comment.split('\n');
      formattedComment = '/**\n';
      for (const line of commentLines) {
        // Remove any existing comment prefixes
        let cleanLine = line.trim();
        if (cleanLine.startsWith('//') || cleanLine.startsWith('*') || cleanLine.startsWith('/*')) {
          cleanLine = cleanLine.replace(/^\/\/|^\*|^\/\*/, '').trim();
        }
        formattedComment += ` * ${cleanLine}\n`;
      }
      formattedComment += ' */';
    }
  } else if (suffix) {
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
// /**
//  * Retrieves the comment style (prefix and suffix) based on the provided file extension.
//  * This function is used to determine the correct comment syntax for different programming languages when programmatically generating or manipulating code.
//  * It relies on a predefined mapping of file extensions to their corresponding comment styles.
//  * This ensures that comments added to files are syntactically correct for the target language, improving code readability and maintainability.
//  * If the provided extension is not found in the mapping, it defaults to single-line JavaScript-style comments ('//') as a common and widely compatible fallback.
//  * The extension lookup is case-insensitive to handle variations in file extension casing.
//  * @param extension The file extension string (e.g., '.js', '.py', '.html'). Case-insensitive.
//  * @returns An object of type CommentStyle containing the 'prefix' and 'suffix' strings for comments.
//  */
// ```typescript
// /**
//  * Imports comment suggestions from a komments.json file and applies them to the codebase.
//  * This function facilitates the integration of pre-generated AI comment suggestions into the project.
//  * It supports two formats for the komments.json file: an older format containing a direct array of suggestions,
//  * and a newer format which is an array of "generations," each containing an array of suggestions and optional codebase information.
//  * The function defaults to applying suggestions interactively, prompting the user before applying each suggestion.
//  * Alternatively, it can apply all suggestions non-interactively.
//  *
//  * Design Rationale:
//  * This function allows for offline or pre-computed comment suggestions to be easily imported and applied,
//  * enabling workflows where comment generation happens separately from the application process.
//  * Supporting both formats ensures backward compatibility with older versions of comment generation tools,
//  * while the newer format allows for future expansion, such as including codebase context for potentially smarter comment application logic.
//  *
//  * Business Context:
//  * Streamlines the process of integrating AI-generated comments into the codebase, improving developer productivity and code documentation consistency.
//  * Allows for batch processing of comment suggestions and review before application.
//  *
//  * @param filePath - Optional path to the komments.json file. If not provided, defaults to 'komments.json' in the current working directory.
//  * @param interactive - Optional boolean indicating whether to apply suggestions interactively (prompting user). Defaults to true.
// /**
//  * Asynchronously imports comment suggestions from a JSON file and applies them to the codebase.
//  * This function facilitates the integration of pre-generated or externally sourced comment suggestions into the project.
//  * It reads suggestions from a JSON file, which can be either a specified file path or defaults to 'komments.json' in the current working directory.
//  * The JSON file can be in two formats: an older format with a direct array of suggestions, or a newer format with an array of generations, where the latest generation's suggestions are used.
//  * In interactive mode (default), it leverages the `applySuggestions` function (assumed to handle user prompts and selective application).
//  * In non-interactive mode, it automatically applies all suggestions using `applyCommentToFile` for each suggestion.
//  * This process is designed to streamline the incorporation of suggested comments, potentially generated by automated analysis or external tools, into the codebase, enhancing documentation and code clarity.
//  * @param filePath Optional path to the JSON file containing comment suggestions. If not provided, defaults to 'komments.json' in the current working directory.
//  * @param interactive Boolean flag to enable interactive mode, prompting the user for confirmation before applying suggestions. Defaults to true.
//  * @returns A Promise that resolves to void when the import and application process is complete.
//  */
//  * @returns A Promise that resolves when the suggestions have been processed (either interactively or non-interactively) or rejects if an error occurs during file reading, parsing, or application. Returns void on successful completion.
//  */
// ```

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
// ```typescript
// /**
//  * Asynchronously removes comments from source code files. This function is designed to prepare code for distribution or reduce codebase size by eliminating unnecessary comments.
//  * It operates in two modes: either on a specified list of files or by scanning the entire codebase if no file paths are provided.
//  * In interactive mode (enabled by default), it prompts the user for confirmation before proceeding with the irreversible comment removal.
//  * This is a destructive operation, meaning comments are permanently removed from the files. It's crucial to ensure proper backups or version control before running this function.
//  * The function handles different file types by detecting the appropriate comment styles based on file extensions.
//  * It logs detailed information about the process, including the number of comments removed from each file and any errors encountered.
//  * Finally, it saves a record of the comment removal operation to `komments.json` for auditing and tracking purposes.
//  * @param filePaths An optional array of file paths to process. If not provided or empty, the function will scan the entire codebase for files.
//  * @param interactive A boolean indicating whether to run in interactive mode, prompting for user confirmation before removing comments. Defaults to true.
//  * @returns A Promise that resolves to a CommentRemovalOperation object, containing details about the operation such as timestamp, files processed, comments removed, and per-file details.
//  */
// ```
  }
  
  try {
    const fileContent = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Handle both new format (array of generations) and old format (array of suggestions)
    let suggestions: CommentSuggestion[] = [];
    
// /**
//  * removeComments - Asynchronously handles removecomments operation
//  * @param filePaths? Parameter description
//  * @param interactive Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
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

/**
 * Removes comments from files in the codebase and logs the operation
 * @param {string[]} filePaths - Array of file paths to process (or empty to scan the entire codebase)
 * @param {boolean} interactive - Whether to prompt for confirmation before removing comments
 * @returns {Promise<CommentRemovalOperation>} Details about the comment removal operation
 */
async function removeComments(filePaths?: string[], interactive: boolean = true): Promise<CommentRemovalOperation> {
  console.log(chalk.blue('\nComment removal mode: This will remove comments from your source files.'));
  console.log(chalk.yellow('This operation cannot be undone.\n'));
  
  // If no specific files are provided, scan the entire codebase
  if (!filePaths || filePaths.length === 0) {
    filePaths = scanCodebase();
  }
  
  if (filePaths.length === 0) {
    console.log(chalk.yellow('No code files found to process. Exiting.'));
    return {
      timestamp: new Date().toISOString(),
      filesProcessed: [],
      commentsRemoved: 0,
      details: []
    };
  }
  
  console.log(chalk.green(`Found ${filePaths.length} files to process.`));
  
  // If interactive mode is enabled, ask for confirmation
  if (interactive) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to remove all comments from these files?',
      default: false
    }]);
    
    if (!confirm) {
      console.log(chalk.yellow('Operation cancelled.'));
      return {
// /**
//  * removeCommentsFromContent handles removecommentsfromcontent operation
//  * @param content Parameter description
//  * @param extension Parameter description
//  * @param prefix Parameter description
//  * @param suffix Parameter description
//  */
        timestamp: new Date().toISOString(),
        filesProcessed: [],
        commentsRemoved: 0,
        details: []
      };
    }
  }
  
  // Process each file
  const details: CommentRemovalDetail[] = [];
  let totalCommentsRemoved = 0;
  
  for (const filePath of filePaths) {
    try {
      // Resolve the file path relative to the project root if it's not absolute
      const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
      
      // Skip files that don't exist
      if (!fs.existsSync(resolvedPath)) {
        console.log(chalk.yellow(`File not found: ${filePath}`));
        continue;
      }
// /**
//  * removeCommentsFromContent handles removecommentsfromcontent operation
//  * @param content Parameter description
//  * @param extension Parameter description
//  * @param prefix Parameter description
//  * @param suffix Parameter description
//  */
      
      // Read the file content
      const fileContent = fs.readFileSync(resolvedPath, 'utf8');
      
      // Get the file extension and comment style
      const extension = path.extname(resolvedPath).toLowerCase();
      const { prefix, suffix } = getCommentStyle(extension);
      
      // Remove comments from the file
      const { content: newContent, count } = removeCommentsFromContent(fileContent, extension, prefix, suffix);
      
      // Only write back if comments were removed
      if (count > 0) {
        fs.writeFileSync(resolvedPath, newContent);
        console.log(chalk.green(`Removed ${count} comments from ${filePath}`));
// ```typescript
// /**
//  * Recursively scans the codebase starting from the current working directory to identify files that are likely to contain code comments.
//  * This function is designed to locate relevant source code files for further processing, such as documentation generation or code analysis.
//  * It traverses the
        
        details.push({
          file: filePath,
          commentsRemoved: count
        });
        
        totalCommentsRemoved += count;
      } else {
        console.log(chalk.blue(`No comments found in ${filePath}`));
      }
    } catch (error: any) {
      console.error(chalk.red(`Error processing ${filePath}: ${error.message}`));
    }
  }
  
  // Create the comment removal operation record
  const commentRemovalOperation: CommentRemovalOperation = {
// /**
//  * Scans the codebase starting from the current working directory to identify files that potentially contain comments.
//  * This function is crucial for tools that analyze or extract comments from source code, such as documentation generators or code quality checkers.
//  * It recursively traverses directories, excluding 'node_modules' and hidden directories (starting with '.'), to improve performance and focus on project-specific code.
//  * Only files with extensions for which comment styles are defined (determined by `getCommentStyle`) are included, ensuring that only relevant source code files are processed and avoiding unnecessary scanning of irrelevant file types.
//  * @returns string[] - An array of strings, where each string is the absolute path to a file within the codebase that is expected to contain comments.
//  */
    timestamp: new Date().toISOString(),
    filesProcessed: filePaths,
    commentsRemoved: totalCommentsRemoved,
    details: details
  };
  
  // Save the operation to komments.json
  await saveCommentRemovalOperation(commentRemovalOperation);
  
  console.log(chalk.green(`\nComment removal completed. Removed ${totalCommentsRemoved} comments from ${details.length} files.`));
  return commentRemovalOperation;
}

/**
 * Removes comments from a string of code content
 * @param {string} content - The file content
 * @param {string} extension - File extension
 * @param {string} prefix - Comment prefix
 * @param {string} suffix - Comment suffix
 * @returns {{content: string, count: number}} Modified content and number of comments removed
 */
function removeCommentsFromContent(content: string, extension: string, prefix: string, suffix: string): { content: string, count: number } {
  let count = 0;
  let newContent = content;
  
  // Escape special characters in prefix and suffix for regex
  const escPrefix = escapeRegExp(prefix);
  const escSuffix = suffix ? escapeRegExp(suffix) : '';
  
  if (suffix) {
    // Handle block comments (/* ... */)
    const blockCommentRegex = new RegExp(`${escPrefix}[\\s\\S]*?${escSuffix}`, 'g');
    newContent = newContent.replace(blockCommentRegex, (match) => {
      count++;
      return '';
    });
  } else {
    // Handle line comments (// or #)
// /**
//  * saveCommentRemovalOperation - Asynchronously handles savecommentremovaloperation operation
//  * @param operation Parameter description
//  * @returns {Promise} Promise that resolves when the operation completes
//  */
    const lineCommentRegex = new RegExp(`${escPrefix}.*?$`, 'gm');
    newContent = newContent.replace(lineCommentRegex, (match) => {
      count++;
      return '';
    });
  }
  
  // Special handling for specific languages
  if (extension === '.js' || extension === '.jsx' || extension === '.ts' || extension === '.tsx') {
    // Handle JS/TS block comments
    const jsBlockCommentRegex = /\/\*[\s\S]*?\*\//g;
    newContent = newContent.replace(jsBlockCommentRegex, (match) => {
      count++;
      return '';
    });
  }
  
  // Clean up empty lines created by comment removal
  newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return { content: newContent, count };
}

/**
 * Scans the codebase for code files
 * @returns {string[]} Array of file paths
 */
function scanCodebase(): string[] {
  const cwd = process.cwd();
// /**
//  * collectCodebaseInfo handles collectcodebaseinfo operation
//  */
  const filePaths: string[] = [];
  
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
          // Only include files with extensions that can have comments
          if (ext && Object.keys(getCommentStyle(ext)).length > 0) {
            filePaths.push(fullPath);
          }
        }
      }
// /**
//  * Collects information about the codebase in the current working directory.
//  * This function analyzes the files in the current directory and its subdirectories to determine the file types and programming languages used.
//  * It's designed to provide a high-level overview of the project's composition by scanning the file system, counting files by extension, and identifying associated programming languages.
//  * The logic skips 'node_modules' directories and hidden directories (starting with '.') to focus analysis on project source code and avoid processing dependency files or configuration directories.
//  * Error handling is implemented to gracefully continue scanning even if some directories cannot be read,
    } catch (error) {
      // Silently continue if we can't read a directory
    }
  }
  
  // Start scanning from current directory
  scanDir(cwd);
  
  return filePaths;
}

/**
 * Saves the comment removal operation to komments.json
 * @param {CommentRemovalOperation} operation - The comment removal operation details
 * @returns {Promise<void>}
 */
async function saveCommentRemovalOperation(operation: CommentRemovalOperation): Promise<void> {
  const outputPath = path.join(process.cwd(), 'komments.json');
  let generations: SuggestionGeneration[] = [];
  
  // Read existing file if it exists
  if (fs.existsSync(outputPath)) {
    try {
      const fileContent = fs.readFileSync(outputPath, 'utf8');
      generations = JSON.parse(fileContent);
      
      // Ensure the content is an array
      if (!Array.isArray(generations)) {
// /**
//  * Retrieves the programming language name based on the provided file extension.
//  * This function is used to identify the programming language of a file based on its extension, enabling features like syntax highlighting and language-specific code analysis within the application.
//  * It utilizes a predefined mapping of common file extensions to their corresponding language names for efficient lookup.
//  * The lookup is case-insensitive, ensuring that extensions like '.JS' and '.js' are treated the same.
//  * If the provided extension is not found in the mapping, it returns null indicating an unknown or unsupported language.
//  * @param extension The file extension (e.g., '.js', '.py', '.tsx') to identify the language for.
//  * @returns The name of the programming language as a string (e.g., 'JavaScript', 'Python', 'TypeScript (React)') or null if the extension is not recognized.
//  */
        generations = [];
      }
    } catch (error) {
      console.error(chalk.yellow('Error reading existing komments.json, creating new file'));
      generations = [];
    }
  }
  
  // If there are existing generations, add the comment removal operation to the latest one
  if (generations.length > 0) {
    const latestGeneration = generations[generations.length - 1];
    latestGeneration.commentRemoval = operation;
// /**
//  * Determines the programming language based on the provided file extension.
//  * This function is used to infer the programming language of a file, primarily for features like syntax highlighting or language-specific code processing in applications such as code editors or file viewers.
//  * It utilizes a `Record` for efficient lookup of language names based on file extensions. The lookup is case-insensitive by converting the input extension to lowercase to ensure consistent matching regardless of the input case.
//  * @param extension The file extension string (e.g., ".js", ".PY", ".Tsx").
//  * @returns The programming language name as a string (e.g., "JavaScript", "Python", "TypeScript (React)") if a match is found in the internal language map, otherwise returns null if the extension is not recognized.
//  */
  } else {
    // If no generations exist, create a new one with just the comment removal operation
    const newGeneration: SuggestionGeneration = {
      id: `gen-${new Date().getTime()}`,
      timestamp: new Date().toISOString(),
      suggestions: [],
      commentRemoval: operation
    };
    generations.push(newGeneration);
  }
  
  // Write the updated generations back to the file
  fs.writeFileSync(outputPath, JSON.stringify(generations, null, 2));
  console.log(chalk.blue('Comment removal operation saved to komments.json'));
}

export {
  saveSuggestions,
  applySuggestions,
  importSuggestions,
  removeComments
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