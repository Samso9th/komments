import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as cliProgress from 'cli-progress';

// Define interfaces for the project
interface CodeSnippet {
  code: string;
  lineNumber: number;
}

interface CommentSuggestion {
  file: string;
  line: number;
  codeSnippet: string;
  suggestedComment: string;
}

/**
 * Analyzes code files and generates comment suggestions using Gemini AI
 * @param {Array<string>} filePaths - Array of file paths to analyze
 * @param {number} temperature - Controls the creativity of AI suggestions (0.0-1.0)
 * @returns {Promise<Array>} Array of comment suggestions
 */
// ```typescript
// /**
//  * Analyzes code in the given file paths using Google Gemini AI to generate comment suggestions for code snippets.
//  * This function is designed to enhance code maintainability and readability by automatically providing intelligent comments.
//  * It iterates through each file, extracts code snippets (functions, classes, etc.), and sends them to Gemini AI for analysis.
//  * The AI-generated comments are then collected and returned, along with file and line number information, as CommentSuggestion objects.
//  * A progress bar is displayed in the console to provide feedback on the analysis progress, improving user experience for potentially long operations.
//  * The temperature parameter allows control over the randomness of the AI's suggestions, with higher values leading to more creative but potentially less consistent results.
//  * If Gemini AI fails to provide a useful comment (empty or too short), a default comment is generated to ensure every snippet gets a suggestion.
//  * @param filePaths - An array of file paths (strings) to analyze. Each path should point to a code file that can be read by the script.
//  * @param temperature - A number between 0 and 1 that controls the randomness of the Gemini AI's output. Higher values (e.g., 0.7) make the output more random and creative, while lower values (e.g., 0.2) make it more focused and deterministic. Defaults to 0.7.
//  * @returns A Promise that resolves to an array of CommentSuggestion objects. Each object contains the file path, line number, code snippet, and the suggested comment. Returns a Promise because it performs asynchronous operations involving file reading and API calls to Gemini AI.
//  */
// ```
async function analyzeCode(filePaths: string[], temperature: number = 0.7): Promise<CommentSuggestion[]> {
  console.log(chalk.blue('Analyzing code with Gemini AI...'));
  
  // Initialize Gemini AI client
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY as string);
  const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash-thinking-exp-01-21' });
  
  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Analyzing code [{bar}] {percentage}% | {value}/{total} files',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });
  
  progressBar.start(filePaths.length, 0);
  
  const allSuggestions: CommentSuggestion[] = [];
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    try {
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Extract code snippets (functions, classes, etc.)
      const codeSnippets = extractCodeSnippets(fileContent, filePath);
      
      // Generate suggestions for each snippet
      for (const snippet of codeSnippets) {
        try {
          const prompt = generatePrompt(snippet.code, path.extname(filePath));
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: 1024,
            },
          });
          
          const response = result.response;
          let suggestedComment = response.text().trim();
          
          // If the AI didn't return a useful comment, generate a default one
          if (!suggestedComment || suggestedComment.length < 5) {
            suggestedComment = generateDefaultComment(snippet.code, path.extname(filePath));
          }
          
          allSuggestions.push({
            file: filePath,
            line: snippet.lineNumber,
            codeSnippet: snippet.code.split('\n')[0] + (snippet.code.split('\n').length > 1 ? '...' : ''),
            suggestedComment: suggestedComment
          });
        } catch (error: any) {
          console.error(chalk.red(`Error generating suggestion for snippet in ${filePath}: ${error.message}`));
        }
      }
    } catch (error: any) {
      console.error(chalk.red(`Error analyzing file ${filePath}: ${error.message}`));
    }
    
    // Update progress
    progressBar.update(i + 1);
  }
  
  progressBar.stop();
  console.log(chalk.green(`Generated ${allSuggestions.length} comment suggestions.`));
  
  return allSuggestions;
}

/**
 * Extracts code snippets (functions, classes, methods) from file content
 * @param {string} fileContent - Content of the file
 * @param {string} filePath - Path to the file
 * @returns {Array<{code: string, lineNumber: number}>} Array of code snippets with line numbers
 */
function extractCodeSnippets(fileContent: string, filePath: string): CodeSnippet[] {
  const extension = path.extname(filePath).toLowerCase();
  const lines = fileContent.split('\n');
  const snippets: CodeSnippet[] = [];
  
  // Simple regex patterns for different languages
  const patterns: Record<string, RegExp> = {
    '.js': /^\s*(async\s+)?(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?function|class\s+\w+|\w+\s*:\s*(async\s+)?function)/,
    '.ts': /^\s*(async\s+)?(function\s+\w+|const\s+\w+\s*=\s*(async\s+)?function|class\s+\w+|\w+\s*:\s*(async\s+)?function)/,
    '.py': /^\s*(def\s+\w+|class\s+\w+)/,
    '.java': /^\s*(public|private|protected)?\s*(static)?\s*(\w+)\s+\w+\s*\([^)]*\)\s*\{/,
    '.go': /^\s*func\s+\w+/,
    '.rb': /^\s*(def\s+\w+|class\s+\w+)/,
    '.php': /^\s*(function\s+\w+|class\s+\w+)/,
    // Add more language patterns as needed
  };
  
  // Default to JavaScript pattern if language not supported
  const pattern = patterns[extension] || patterns['.js'];
  
  let inSnippet = false;
  let snippetStart = 0;
  let bracketCount = 0;
  let currentSnippet = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!inSnippet && pattern.test(line)) {
      inSnippet = true;
      snippetStart = i + 1; // 1-indexed line numbers
      currentSnippet = line;
      bracketCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
    } else if (inSnippet) {
      currentSnippet += '\n' + line;
      bracketCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // For Python and Ruby, we'll use indentation
      if (['.py', '.rb'].includes(extension)) {
        if (i + 1 < lines.length && !lines[i + 1].startsWith(' ') && !lines[i + 1].startsWith('\t')) {
          inSnippet = false;
          snippets.push({ code: currentSnippet, lineNumber: snippetStart });
        }
      } else if (bracketCount <= 0) {
        // For bracket-based languages
        inSnippet = false;
        snippets.push({ code: currentSnippet, lineNumber: snippetStart });
      }
    }
  }
  
  return snippets;
}

/**
 * Generates a prompt for the AI based on the code snippet and language
 * @param {string} codeSnippet - The code snippet to analyze
 * @param {string} extension - File extension to determine language
 * @returns {string} Prompt for the AI
 */
function generatePrompt(codeSnippet: string, extension: string): string {
  const language = getLanguageFromExtension(extension);
  
  return `Please generate a concise, descriptive comment for the following ${language} code snippet. 
` +
    `Focus on explaining both what the code does AND why the logic exists there. Include its purpose, business context, design rationale, parameters, and return values if applicable. 
` +
    `Do not include any markdown formatting, just provide the comment text in the appropriate style for ${language}.
` +
    `If this is a function, include @param tags for each parameter and @returns tag if it returns a value.
` +
    `If this is an async function, mention that it returns a Promise in the @returns tag.
` +
    `Be thorough and specific about what the code does and why certain implementation choices were made.

` +
    `CODE SNIPPET:
${codeSnippet}

` +
    `COMMENT:`;
}

/**
 * Gets the programming language name from file extension
 * @param {string} extension - File extension
 * @returns {string} Programming language name
 */
function getLanguageFromExtension(extension: string): string {
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
  
  return languageMap[extension.toLowerCase()] || 'JavaScript';
}

/**
 * Generates a default comment when the AI doesn't provide a useful one
 * @param {string} codeSnippet - The code snippet to analyze
 * @param {string} extension - File extension to determine language
 * @returns {string} A basic comment describing the code
 */
function generateDefaultComment(codeSnippet: string, extension: string): string {
  // Extract function/class name and parameters
  const firstLine = codeSnippet.split('\n')[0].trim();
  let name = 'function';
  let params = '';
  
  // Extract function name
  const functionMatch = firstLine.match(/(?:function|class|const|let|var)\s+(\w+)|(?:\w+)\s*=\s*(?:async\s*)?(?:function|\()/i);
  if (functionMatch && functionMatch[1]) {
    name = functionMatch[1];
  } else {
    // Try to extract method name
    const methodMatch = firstLine.match(/(\w+)\s*\(/i);
    if (methodMatch && methodMatch[1]) {
      name = methodMatch[1];
    }
  }
  
  // Extract parameters
  const paramsMatch = firstLine.match(/\(([^)]*?)\)/);
  if (paramsMatch && paramsMatch[1]) {
    params = paramsMatch[1].trim();
  }
  
  // Determine if it returns a Promise
  const isAsync = firstLine.includes('async') || codeSnippet.includes('return new Promise');
  const returnType = isAsync ? 'Promise' : '';
  
  // Generate a basic comment
  let comment = '';
  if (firstLine.includes('class')) {
    comment = `/**\n * ${name} class\n */`;
  } else {
    comment = `/**\n * ${name} ${returnType ? `- Asynchronously ` : ''}handles ${name.toLowerCase()} operation\n`;
    
    // Add parameters if they exist
    if (params) {
      const paramList = params.split(',');
      paramList.forEach(param => {
        const paramName = param.trim().split(':')[0].split('=')[0].trim();
        if (paramName && !paramName.includes('...')) {
          comment += ` * @param ${paramName} Parameter description\n`;
        }
      });
    }
    
    // Add return type if async
    if (returnType) {
      comment += ` * @returns {${returnType}} Promise that resolves when the operation completes\n`;
    }
    
    comment += ` */`;
  }
  
  return comment;
}

export {
  analyzeCode,
  extractCodeSnippets,
  generatePrompt,
  getLanguageFromExtension,
  generateDefaultComment
};