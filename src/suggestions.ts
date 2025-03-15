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

/**
 * Saves comment suggestions to a JSON file
 * @param {Array} suggestions - Array of comment suggestions
 * @returns {Promise<void>}
 */
async function saveSuggestions(suggestions: CommentSuggestion[]): Promise<void> {
  const outputPath = path.join(process.cwd(), 'komments.json');
  fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2));
}

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
    
    if (action === 'apply' || action === 'edit') {
      try {
        await applyCommentToFile(suggestion.file, suggestion.line, commentToApply);
        console.log(chalk.green('Comment applied successfully!'));
      } catch (error: any) {
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

export {
  saveSuggestions,
  applySuggestions
};