import simpleGit from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Scans Git changes to find modified files for analysis
 * @returns {Promise<Array<string>>} Array of file paths that have been modified
 */
async function scanGitChanges(): Promise<string[]> {
  const spinner = ora('Scanning Git changes...').start();
  
  try {
    const git = simpleGit();
    
    // Check if the current directory is a Git repository
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      spinner.fail('Not a Git repository. Please run this command in a Git repository.');
      return [];
    }
    
    // Get status of the repository
    const status = await git.status();
    
    // Collect modified, added, and renamed files
    const modifiedFiles = [
      ...status.modified,
      ...status.not_added,
      ...status.created,
      ...status.renamed.map((file: { to: string }) => file.to)
    ];
    
    // Filter out non-code files and files that don't exist
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php', '.swift', '.rs', '.html', '.css', '.scss'];
    
    const existingCodeFiles = modifiedFiles.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return codeExtensions.includes(ext) && fs.existsSync(file);
    });
    
    spinner.succeed(`Found ${existingCodeFiles.length} modified code files.`);
    
    return existingCodeFiles;
  } catch (error: any) {
    spinner.fail(`Error scanning Git changes: ${error.message}`);
    return [];
  }
}

export {
  scanGitChanges
};