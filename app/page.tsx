"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Copy, Sparkles, Zap, Clipboard, ArrowRight, Github } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ToastManager, { ToastManagerHandles } from "./components/ui/toast-manager";

export default function Home() {
  const [markdown, setMarkdown] = useState("");
  const [isMac, setIsMac] = useState(false);
  const [lastPasteTime, setLastPasteTime] = useState(0);
  const toastRef = useRef<ToastManagerHandles>(null);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  const convertToMarkdown = (text: string) => {
    const converted = text.trim();
    const lines = converted.split('\n');
    const processedLines: string[] = [];
    let inCodeBlock = false;
    let codeBlockLines: string[] = [];
    let codeBlockType = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines (but preserve them)
      if (!trimmedLine) {
        if (inCodeBlock) {
          codeBlockLines.push('');
        } else {
          processedLines.push('');
        }
        continue;
      }

      // Detect code blocks - look for JSON, scripts, or code patterns
      const isCodeLike = (
        /^[{\[]/.test(trimmedLine) || // JSON objects/arrays
        /^"[^"]*":\s*/.test(trimmedLine) || // JSON properties
        /^\s*["}]/.test(line) || // Closing braces
        /^(npx|npm|yarn|git|cd|next|create-)/.test(trimmedLine) || // Commands
        /\.(js|ts|tsx|jsx|json|css|html)$/.test(trimmedLine) || // File extensions
        /^[a-zA-Z]+:/.test(trimmedLine) && trimmedLine.includes('"') // Key-value pairs
      );

      // Handle code block detection
      if (isCodeLike && !inCodeBlock) {
        // Detect type of code block
        if (trimmedLine.includes('.json') || /^[{\[]/.test(trimmedLine) || /^"[^"]*":\s*/.test(trimmedLine)) {
          codeBlockType = 'json';
        } else if (/^(npx|npm|yarn|git|cd)/.test(trimmedLine)) {
          codeBlockType = 'bash';
        } else if (trimmedLine.includes('.js') || trimmedLine.includes('.ts')) {
          codeBlockType = 'javascript';
        } else {
          codeBlockType = 'text';
        }
        inCodeBlock = true;
        codeBlockLines = [line];
        continue;
      }

      // Continue code block or end it
      if (inCodeBlock) {
        codeBlockLines.push(line);

        // Check if code block should end
        const shouldEndCodeBlock = (
          // Next line looks like regular text or heading
          (i + 1 < lines.length &&
            lines[i + 1].trim() &&
            !isCodeLike &&
            !/^\s/.test(lines[i + 1]) && // Not indented
            /^[A-Z]/.test(lines[i + 1].trim())) || // Starts with capital
          // Current line ends a JSON/object structure
          (/^[}\]]/.test(trimmedLine) && codeBlockType === 'json') ||
          // No more lines
          i === lines.length - 1
        );

        if (shouldEndCodeBlock) {
          processedLines.push(`\`\`\`${codeBlockType}`);
          processedLines.push(...codeBlockLines);
          processedLines.push('```');
          inCodeBlock = false;
          codeBlockLines = [];
          codeBlockType = '';
        }
        continue;
      }

      // Regular text processing (when not in code block)

      // Check for headings - improved logic
      const isHeading = (
        trimmedLine.length < 80 &&
        /^[A-Z#]/.test(trimmedLine) &&
        !/[.!?;:]$/.test(trimmedLine) &&
        !trimmedLine.includes('?') &&
        !trimmedLine.includes('"') &&
        !trimmedLine.toLowerCase().startsWith('these') &&
        !trimmedLine.toLowerCase().startsWith('then') &&
        !trimmedLine.toLowerCase().startsWith('the ') &&
        (trimmedLine.split(' ').length <= 10) &&
        !trimmedLine.includes('package.json') &&
        !trimmedLine.includes('Next.js')
      );

      if (isHeading) {
        // Make heading uppercase
        processedLines.push(`# ${trimmedLine.toUpperCase()}`);
        continue;
      }

      // Handle bullet points (various formats)
      if (/^[-•*◦▪▫⁃]\s+/.test(trimmedLine)) {
        processedLines.push(`- ${trimmedLine.replace(/^[-•*◦▪▫⁃]\s+/, '')}`);
        continue;
      }

      // Handle numbered lists
      if (/^\d+[.)]\s+/.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)[.)]\s+(.+)$/);
        if (match) {
          processedLines.push(`${match[1]}. ${match[2]}`);
          continue;
        }
      }

      // Regular paragraph - process inline formatting
      let processedLine = trimmedLine;

      // Convert inline code (backticks, file names, commands)
      processedLine = processedLine.replace(/`([^`]+)`/g, '`$1`');
      processedLine = processedLine.replace(/\b([a-zA-Z0-9._-]+\.(js|ts|tsx|jsx|json|css|html|md))\b/g, '`$1`');
      processedLine = processedLine.replace(/\b(package\.json|next\.config\.[jt]s|layout\.tsx|page\.tsx)\b/g, '`$1`');

      // Convert framework/library names to code
      processedLine = processedLine.replace(/\b(Next\.js|React|TypeScript|ESLint)\b/g, '`$1`');

      // Convert ALL CAPS words to bold (but not single letters or very short words)
      processedLine = processedLine.replace(/\b[A-Z]{3,}\b/g, '**$&**');

      // Convert URLs to markdown links
      processedLine = processedLine.replace(/(https?:\/\/[^\s]+)/g, '[$1]($1)');

      // Convert email addresses
      processedLine = processedLine.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[$1](mailto:$1)');

      processedLines.push(processedLine);
    }

    // If we ended while still in a code block, close it
    if (inCodeBlock) {
      processedLines.push(`\`\`\`${codeBlockType}`);
      processedLines.push(...codeBlockLines);
      processedLines.push('```');
    }

    return processedLines.join('\n');
  };

  const handleGlobalPaste = async () => {
    const now = Date.now();
    if (now - lastPasteTime < 1000) return; // Prevent rapid pastes
    setLastPasteTime(now);

    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const converted = convertToMarkdown(text);
        setMarkdown(converted);
        toastRef.current?.show("Text pasted and converted!", "success");

        // Auto-copy to clipboard
        await navigator.clipboard.writeText(converted);
        setTimeout(() => {
          toastRef.current?.show("Markdown copied to clipboard!", "success");
        }, 500);
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handleGlobalPaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lastPasteTime, handleGlobalPaste]);

  const copyMarkdown = async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      toastRef.current?.show("Markdown copied to clipboard!", "success");
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toastRef.current?.show("Failed to copy to clipboard", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          {[...Array(20)].map((_, i) => {
            // Use index-based positioning for consistent SSR/client rendering
            const left = (i * 17 + 13) % 100;
            const top = (i * 23 + 7) % 100;
            const duration = (i % 5) * 2 + 8;

            return (
              <motion.div
                key={i}
                className="absolute h-2 w-2 bg-purple-400 rounded-full"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.5,
                }}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* GitHub Link */}
      <div className="absolute top-6 right-6 z-50">
        <a
          href="https://github.com/ratnesh-maurya/mdconverter"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 bg-gray-800/50 hover:bg-gray-700/50 backdrop-blur-sm px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-700"
        >
          <Github className="h-5 w-5" />
          <span className="hidden sm:inline">View on GitHub</span>
        </a>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="flex items-center justify-center mb-4 sm:mb-6 flex-wrap">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mr-2 sm:mr-3" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MDConverter
            </h1>
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400 ml-2 sm:ml-3" />
          </div>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
            Instantly transform any text into beautiful markdown. Just paste and watch the magic happen.
          </p>
          <div className="mt-6 sm:mt-8 flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-400 flex-wrap">
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600">
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600">V</kbd>
            <span className="text-purple-400">to paste and convert</span>
          </div>
        </motion.div>

        {/* Toast Notifications */}
        <ToastManager ref={toastRef} />

        {/* Main Converter */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {markdown ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Markdown Preview */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Markdown Preview</h2>
                  <button
                    onClick={copyMarkdown}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copy Raw</span>
                  </button>
                </div>
                <div className="text-gray-800 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-800 mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-3 text-gray-800 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-3 text-gray-800 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-800">{children}</li>,
                      strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                      a: ({ href, children }) => <a href={href} className="text-blue-600 hover:text-blue-800 underline">{children}</a>,
                      code: ({ className, children }) => {
                        const isInline = !className;
                        if (isInline) {
                          return <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono font-medium">{children}</code>;
                        }
                        // This is a code block
                        const language = className?.replace('language-', '') || 'text';
                        return (
                          <div className="mb-4">
                            <div className="bg-gray-800 text-gray-300 px-3 py-1 text-xs font-medium rounded-t-lg border-b border-gray-700">
                              {language}
                            </div>
                            <pre className="bg-gray-900 text-green-400 p-3 sm:p-4 rounded-b-lg overflow-auto border border-gray-800">
                              <code className="text-xs sm:text-sm font-mono leading-relaxed">{children}</code>
                            </pre>
                          </div>
                        );
                      },
                      pre: ({ children }) => {
                        // Handle pre blocks that don't have code children
                        return <div>{children}</div>;
                      },
                    }}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Raw Markdown */}
              <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Raw Markdown</h3>
                <pre className="text-green-400 font-mono text-xs sm:text-sm whitespace-pre-wrap overflow-auto max-h-48 sm:max-h-64 p-3 sm:p-4 bg-gray-900/50 rounded-lg">
                  {markdown}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 sm:py-20 px-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clipboard className="h-16 sm:h-20 lg:h-24 w-16 sm:w-20 lg:w-24 text-purple-400 mx-auto mb-4 sm:mb-6" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Ready to Convert!</h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-6 sm:mb-8 max-w-md sm:max-w-2xl mx-auto leading-relaxed">
                Press <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 mx-1 text-xs sm:text-sm">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd> + <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-600 mx-1 text-xs sm:text-sm">V</kbd>
                anywhere on this page to paste and convert text to markdown
              </p>
              <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-sm sm:text-base text-gray-400 flex-wrap">
                <span>Paste</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Convert</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Auto-Copy</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 sm:mt-16 lg:mt-20 text-center"
        >
          <h3 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-white px-4">Why MDConverter?</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4">
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700">
              <Zap className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">Lightning Fast</h4>
              <p className="text-sm sm:text-base text-gray-300">Instant conversion as you type or paste</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400 mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">Smart Detection</h4>
              <p className="text-sm sm:text-base text-gray-300">Automatically detects headings, lists, and formatting</p>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-gray-700 sm:col-span-2 lg:col-span-1">
              <Copy className="h-10 w-10 sm:h-12 sm:w-12 text-green-400 mx-auto mb-3 sm:mb-4" />
              <h4 className="text-lg sm:text-xl font-semibold mb-2">One-Click Copy</h4>
              <p className="text-sm sm:text-base text-gray-300">Copy the result instantly to your clipboard</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="mt-12 sm:mt-16 lg:mt-20 border-t border-gray-800 pt-8 sm:pt-12 pb-6 sm:pb-8">
          <div className="max-w-4xl mx-auto text-center px-4">
            <div className="mb-6 sm:mb-8">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                MDConverter
              </h3>
              <p className="text-sm sm:text-base text-gray-400">
                Lightweight and powerful markdown conversion tool
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4 sm:space-x-6 mb-6 sm:mb-8">
              <a
                href="https://github.com/ratnesh-maurya/mdconverter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://x.com/ratnesh_maurya_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Twitter"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.ratnesh-maurya.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Portfolio"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </a>
            </div>

            <div className="text-gray-500 text-xs sm:text-sm space-y-2">
              <p>© 2025 MDConverter. All rights reserved.</p>
              <p>
                Made with ❤️ by{" "}
                <a
                  href="https://www.ratnesh-maurya.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
                >
                  Ratnesh Maurya
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
