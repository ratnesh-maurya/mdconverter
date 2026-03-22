"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Github,
  FileText,
  Eye,
  Code2,
  Wand2,
  RotateCcw,
  Download,
  Moon,
  Sun,
  ChevronDown,
  Type,
  Hash,
  List,
  Bold,
  Link,
  Terminal,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import ToastManager, { ToastManagerHandles } from "./components/ui/toast-manager";

// ─── Ultra-rich Markdown Converter ────────────────────────────────────────────

function convertToMarkdown(text: string): string {
  if (!text.trim()) return "";

  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // blank lines
    if (!trimmed) {
      out.push("");
      i++;
      continue;
    }

    // ── already-markdown passthrough ──
    if (/^#{1,6}\s/.test(trimmed) || /^```/.test(trimmed) || /^---+$/.test(trimmed)) {
      out.push(raw);
      i++;
      continue;
    }

    // ── code fence detection ──
    const isCodeStart =
      /^[{\[]/.test(trimmed) ||
      /^"[^"]*"\s*:\s*/.test(trimmed) ||
      /^(npx|npm|yarn|pnpm|bun|git|cd|ls|cat|curl|wget|docker|kubectl|aws|node|python|ruby|go|rust|cargo)\s/.test(trimmed) ||
      /^<[a-zA-Z]/.test(trimmed) ||
      /\.(js|ts|tsx|jsx|json|css|scss|html|py|go|rb|rs|sh|yaml|yml|toml|env)$/.test(trimmed) ||
      (/^[a-zA-Z_$][a-zA-Z0-9_]*\s*[=(]/.test(trimmed) && !/ /.test(trimmed.split(/[=(]/)[0])) ||
      /^\s{2,}/.test(raw);

    if (isCodeStart) {
      // collect code block lines
      const codeLines: string[] = [raw];
      let lang = "text";

      if (/^[{\[]/.test(trimmed) || /^"[^"]*"\s*:/.test(trimmed)) lang = "json";
      else if (/^(npx|npm|yarn|pnpm|bun|git|cd|ls|cat|curl|wget)\s/.test(trimmed)) lang = "bash";
      else if (/\.tsx?$/.test(trimmed) || /^(import|export|const|let|var|function|class|interface|type)\s/.test(trimmed)) lang = "typescript";
      else if (/\.jsx?$/.test(trimmed)) lang = "javascript";
      else if (/\.py$/.test(trimmed) || /^(def |class |import |from |if __name__)/.test(trimmed)) lang = "python";
      else if (/\.(sh|bash)$/.test(trimmed)) lang = "bash";
      else if (/\.(css|scss)$/.test(trimmed)) lang = "css";
      else if (/\.(html|xml)$/.test(trimmed)) lang = "html";
      else if (/\.(ya?ml)$/.test(trimmed)) lang = "yaml";

      i++;
      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextTrimmed = nextRaw.trim();
        if (!nextTrimmed) {
          // peek ahead – if next non-empty line is also code-like, keep going
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && isCodeLikeLine(lines[j])) {
            codeLines.push("");
            i++;
            continue;
          }
          break;
        }
        if (isRegularTextLine(nextTrimmed)) break;
        codeLines.push(nextRaw);
        i++;
      }

      out.push("```" + lang);
      out.push(...codeLines);
      out.push("```");
      out.push("");
      continue;
    }

    // ── horizontal rule ──
    if (/^[*\-_]{3,}$/.test(trimmed)) {
      out.push("---");
      i++;
      continue;
    }

    // ── blockquote ──
    if (/^[>»]/.test(trimmed)) {
      out.push(`> ${trimmed.replace(/^[>»]\s*/, "")}`);
      i++;
      continue;
    }

    // ── tables – detect pipe-separated rows ──
    if (/\|/.test(trimmed) && trimmed.split("|").length >= 3) {
      const tableLines: string[] = [raw];
      i++;
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
        tableLines.push(lines[i]);
        i++;
      }
      // inject separator if missing
      if (tableLines.length >= 2 && !/^[\s|:-]+$/.test(tableLines[1].trim())) {
        const cols = tableLines[0].split("|").filter(Boolean).length;
        tableLines.splice(1, 0, "| " + Array(cols).fill("---").join(" | ") + " |");
      }
      out.push(...tableLines, "");
      continue;
    }

    // ── headings ──
    const isHeading =
      trimmed.length <= 100 &&
      trimmed.length >= 2 &&
      /^[A-Z]/.test(trimmed) &&
      !/[.!?,;]$/.test(trimmed) &&
      trimmed.split(" ").length <= 12 &&
      !trimmed.includes('"') &&
      !trimmed.includes("(") &&
      !/^(The|A|An|This|These|That|Those|It|He|She|They|We|I|You)\s/.test(trimmed) &&
      !trimmed.includes("http");

    if (isHeading) {
      // guess heading level by position / previous context
      const prevNonEmpty = out.filter(Boolean).slice(-1)[0] ?? "";
      const level = prevNonEmpty === "" || /^#/.test(prevNonEmpty) ? "##" : "#";
      out.push(`${level} ${trimmed}`);
      i++;
      continue;
    }

    // ── bullet lists ──
    if (/^[-•*◦▪▫⁃➤➜➸→▸▹]\s+/.test(trimmed)) {
      // collect multi-line list
      const listItem = trimmed.replace(/^[-•*◦▪▫⁃➤➜➸→▸▹]\s+/, "");
      out.push(`- ${processInline(listItem)}`);
      i++;
      continue;
    }

    // ── numbered lists ──
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (match) {
        out.push(`${match[1]}. ${processInline(match[2])}`);
        i++;
        continue;
      }
    }

    // ── task lists ──
    if (/^\[[ xX]\]\s+/.test(trimmed)) {
      const checked = /^\[[xX]\]/.test(trimmed);
      const label = trimmed.replace(/^\[[ xX]\]\s+/, "");
      out.push(`- [${checked ? "x" : " "}] ${processInline(label)}`);
      i++;
      continue;
    }

    // ── definition / key-value pairs ──
    if (/^[A-Z][a-zA-Z ]+:\s+\S/.test(trimmed)) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();
      out.push(`**${key}:** ${processInline(val)}`);
      i++;
      continue;
    }

    // ── regular paragraph ──
    // collect wrapped lines into a single paragraph
    const paraLines = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isHeadingLine(lines[i].trim()) &&
      !/^[-•*◦▪▫⁃➤➜➸→▸▹]\s/.test(lines[i].trim()) &&
      !/^\d+[.)]\s/.test(lines[i].trim()) &&
      !/\|/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    out.push(processInline(paraLines.join(" ")));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isCodeLikeLine(line: string): boolean {
  const t = line.trim();
  return (
    /^[{\[\s]/.test(t) ||
    /^"[^"]*"\s*:/.test(t) ||
    /^\s{2,}/.test(line)
  );
}

function isRegularTextLine(trimmed: string): boolean {
  return (
    /^[A-Z]/.test(trimmed) &&
    !isCodeLikeLine(trimmed) &&
    !/^(import|export|const|let|var|function|class)/.test(trimmed)
  );
}

function isHeadingLine(trimmed: string): boolean {
  return (
    /^#{1,6}\s/.test(trimmed) ||
    (trimmed.length <= 100 &&
      /^[A-Z]/.test(trimmed) &&
      !/[.!?,;]$/.test(trimmed) &&
      trimmed.split(" ").length <= 12)
  );
}

function processInline(text: string): string {
  let s = text;

  // preserve existing markdown
  if (/[*_`\[\]]/.test(s)) return s;

  // URLs → links
  s = s.replace(/(https?:\/\/[^\s)>]+)/g, "[$1]($1)");

  // emails
  s = s.replace(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, "[$1](mailto:$1)");

  // file paths / extensions
  s = s.replace(/\b([a-zA-Z0-9._/-]+\.(js|ts|tsx|jsx|json|css|scss|html|md|yaml|yml|toml|env|sh|py|go|rb|rs))\b/g, "`$1`");

  // inline code snippets with backticks already
  s = s.replace(/`([^`]+)`/g, "`$1`");

  // ALL_CAPS acronyms → bold (3+ chars)
  s = s.replace(/\b([A-Z]{3,})\b/g, "**$1**");

  // tech terms
  s = s.replace(/\b(React|Next\.js|TypeScript|JavaScript|Tailwind|Prisma|GraphQL|Node\.js|Vercel|Supabase|PostgreSQL|MongoDB|Docker|Kubernetes|Redis|AWS|GCP|Azure)\b/g, "`$1`");

  return s;
}

// ─── Component ────────────────────────────────────────────────────────────────

type Tab = "editor" | "preview" | "split";

export default function Home() {
  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [tab, setTab] = useState<Tab>("split");
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isDark, setIsDark] = useState(true);
  const [lastPaste, setLastPaste] = useState(0);
  const toastRef = useRef<ToastManagerHandles>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  // live conversion
  useEffect(() => {
    const result = convertToMarkdown(input);
    setMarkdown(result);
    setWordCount(input.trim() ? input.trim().split(/\s+/).length : 0);
    setCharCount(input.length);
  }, [input]);

  const handlePaste = useCallback(async () => {
    const now = Date.now();
    if (now - lastPaste < 800) return;
    setLastPaste(now);
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        setInput(text);
        toastRef.current?.show("Text pasted and converted!", "success");
      }
    } catch {
      toastRef.current?.show("Clipboard access denied", "error");
    }
  }, [lastPaste]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        handlePaste();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handlePaste]);

  const copyMarkdown = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toastRef.current?.show("Markdown copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRaw = async () => {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const downloadMd = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "converted.md";
    a.click();
  };

  const reset = () => {
    setInput("");
    setMarkdown("");
  };

  const insertSnippet = (prefix: string, suffix = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const selected = input.slice(s, e);
    const newText = input.slice(0, s) + prefix + selected + suffix + input.slice(e);
    setInput(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + prefix.length, s + prefix.length + selected.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Hash, label: "Heading", action: () => insertSnippet("## ") },
    { icon: Bold, label: "Bold", action: () => insertSnippet("**", "**") },
    { icon: Type, label: "Italic", action: () => insertSnippet("_", "_") },
    { icon: Code2, label: "Code", action: () => insertSnippet("`", "`") },
    { icon: Terminal, label: "Code Block", action: () => insertSnippet("```\n", "\n```") },
    { icon: Link, label: "Link", action: () => insertSnippet("[", "](url)") },
    { icon: List, label: "List", action: () => insertSnippet("- ") },
  ];

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-hidden">
        {/* Background glow orbs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] rounded-full bg-purple-900/5 blur-[100px]" />
        </div>

        {/* ── NAVBAR ── */}
        <nav className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              <span className="text-white">MD</span>
              <span className="text-violet-400">Maker</span>
            </span>
            <span className="hidden sm:inline text-xs text-white/30 ml-1 font-mono bg-white/5 px-2 py-0.5 rounded">v2.0</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a
              href="https://github.com/ratnesh-maurya/mdconverter"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg border border-white/10 transition-all"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="relative z-10 text-center py-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="w-3 h-3" />
              Ultra-rich markdown conversion — paste anything
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              <span className="text-white">Paste text.</span>{" "}
              <span className="bg-linear-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Get Markdown.
              </span>
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-6">
              Drop any text — articles, notes, code, docs — and watch it transform into
              beautiful, structured Markdown instantly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-white/40">
              <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-xs">
                {isMac ? "⌘" : "Ctrl"}
              </kbd>
              <span>+</span>
              <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono text-xs">V</kbd>
              <span className="text-violet-400">anywhere to paste & convert</span>
            </div>
          </motion.div>
        </div>

        {/* ── MAIN EDITOR ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative z-10 max-w-[1400px] mx-auto px-4 pb-10"
        >
          {/* Tab bar */}
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center bg-white/5 rounded-xl p-1 border border-white/10">
              {(["editor", "split", "preview"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    tab === t
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {t === "editor" ? (
                    <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /> Editor</span>
                  ) : t === "preview" ? (
                    <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Preview</span>
                  ) : (
                    <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Split</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {input && (
                <span className="text-xs text-white/30 font-mono">
                  {wordCount}w · {charCount}c
                </span>
              )}
              <button
                onClick={reset}
                title="Clear all"
                className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={downloadMd}
                disabled={!markdown}
                title="Download .md"
                className="p-2 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all disabled:opacity-30"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={copyMarkdown}
                disabled={!markdown}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy MD"}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {toolbarButtons.map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                title={label}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all font-medium"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={handlePaste}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border border-violet-500/20 transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Smart Paste
              </button>
            </div>
          </div>

          {/* Panes */}
          <div
            className={`grid gap-3 ${
              tab === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {/* ── INPUT PANE ── */}
            <AnimatePresence>
              {(tab === "editor" || tab === "split") && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#111118] border border-white/5 rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-xs text-white/30 ml-1 font-mono">input.txt</span>
                    </div>
                    {input && (
                      <span className="text-xs text-violet-400/60 font-mono">
                        {input.split("\n").length} lines
                      </span>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={`Paste or type anything here…\n\nExamples:\n• Meeting notes, articles, docs\n• JSON, code snippets\n• Lists, tables, definitions\n• Any raw text\n\nMDMaker converts it all to beautiful Markdown.`}
                      className="w-full h-[520px] bg-[#0d0d14] border border-t-0 border-white/5 rounded-b-xl resize-none p-5 text-sm text-white/80 font-mono leading-relaxed placeholder:text-white/15 focus:outline-none focus:border-violet-500/30 focus:bg-[#0f0f18] transition-all"
                      spellCheck={false}
                    />
                    {!input && (
                      <div className="absolute bottom-5 right-5 pointer-events-none">
                        <div className="text-xs text-white/10 font-mono text-right space-y-1">
                          <div>⌘V to paste</div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PREVIEW PANE ── */}
            <AnimatePresence>
              {(tab === "preview" || tab === "split") && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col"
                >
                  {/* Preview tabs */}
                  <PreviewPane
                    markdown={markdown}
                    onCopyRaw={copyRaw}
                    copiedRaw={copiedRaw}
                    hasContent={!!markdown}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stats bar */}
          {markdown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex flex-wrap items-center gap-4 px-4 py-2.5 bg-white/2 border border-white/5 rounded-xl text-xs text-white/30 font-mono"
            >
              <StatItem label="Words" value={wordCount} />
              <StatItem label="Chars" value={charCount} />
              <StatItem label="Lines" value={markdown.split("\n").length} />
              <StatItem
                label="Headings"
                value={(markdown.match(/^#{1,6}\s/gm) || []).length}
              />
              <StatItem
                label="Code blocks"
                value={(markdown.match(/^```/gm) || []).length / 2}
              />
              <StatItem
                label="Links"
                value={(markdown.match(/\[.+?\]\(.+?\)/g) || []).length}
              />
            </motion.div>
          )}
        </motion.div>

        {/* ── FEATURE PILLS ── */}
        <section className="relative z-10 py-10 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Smart headings",
                "Code detection",
                "Auto bullet lists",
                "Table formatting",
                "URL → links",
                "Bold & italic",
                "Task lists",
                "Blockquotes",
                "Key-value pairs",
                "File paths",
                "Real-time preview",
                "Download .md",
              ].map((feat) => (
                <span
                  key={feat}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/3 border border-white/8 text-white/40 font-medium"
                >
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center text-xs text-white/25">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>
              Made by{" "}
              <a
                href="https://www.ratnesh-maurya.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400/70 hover:text-violet-300 transition-colors"
              >
                Ratnesh Maurya
              </a>
            </span>
            <div className="flex items-center gap-4">
              <a href="https://github.com/ratnesh-maurya/mdconverter" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
              <a href="https://x.com/ratnesh_maurya_" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                Twitter
              </a>
              <a href="https://blog.ratnesh-maurya.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
                Blog
              </a>
            </div>
          </div>
        </footer>

        <ToastManager ref={toastRef} />
      </div>
    </div>
  );
}

// ─── Preview Pane Component ────────────────────────────────────────────────────

function PreviewPane({
  markdown,
  onCopyRaw,
  copiedRaw,
  hasContent,
}: {
  markdown: string;
  onCopyRaw: () => void;
  copiedRaw: boolean;
  hasContent: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"rendered" | "raw">("rendered");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#111118] border border-white/5 rounded-t-xl">
        <div className="flex items-center gap-1 bg-black/20 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("rendered")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "rendered"
                ? "bg-violet-600 text-white"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <Eye className="w-3 h-3 inline mr-1" />
            Rendered
          </button>
          <button
            onClick={() => setActiveTab("raw")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              activeTab === "raw"
                ? "bg-violet-600 text-white"
                : "text-white/30 hover:text-white/60"
            }`}
          >
            <Code2 className="w-3 h-3 inline mr-1" />
            Raw MD
          </button>
        </div>
        <button
          onClick={onCopyRaw}
          disabled={!hasContent}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white disabled:opacity-30 transition-colors"
        >
          {copiedRaw ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedRaw ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex-1 bg-[#0d0d14] border border-t-0 border-white/5 rounded-b-xl overflow-hidden">
        {!hasContent ? (
          <div className="flex flex-col items-center justify-center h-[520px] text-white/15 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="font-medium text-white/20">Preview will appear here</p>
              <p className="text-xs mt-1">Start typing or paste text on the left</p>
            </div>
          </div>
        ) : activeTab === "rendered" ? (
          <div className="h-[520px] overflow-y-auto p-6 prose-container">
            <MarkdownRenderer content={markdown} />
          </div>
        ) : (
          <pre className="h-[520px] overflow-auto p-5 text-xs font-mono text-emerald-400/80 leading-relaxed whitespace-pre-wrap">
            {markdown}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── Markdown Renderer ─────────────────────────────────────────────────────────

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-white/90 mb-3 mt-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-violet-500 rounded-full inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-white/80 mb-2 mt-4">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-white/70 mb-2 mt-3">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-white/60 mb-3 leading-relaxed text-sm">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 space-y-1.5 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 space-y-1.5 pl-4 list-decimal text-white/60 text-sm">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-white/60 text-sm flex items-start gap-2 before:content-['▸'] before:text-violet-500 before:text-xs before:mt-0.5 before:shrink-0">
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-white/70">{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-500/30 transition-colors"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500/50 pl-4 my-4 bg-violet-500/5 py-3 rounded-r-lg text-white/50 text-sm italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-white/10 my-6" />,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left px-4 py-2.5 text-white/70 font-semibold text-xs uppercase tracking-wider border-b border-white/10">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-white/50 text-sm border-b border-white/5">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/2 transition-colors">{children}</tr>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = !!className;
            const lang = className?.replace("language-", "") ?? "";
            if (isBlock) {
              return (
                <div className="mb-4 rounded-xl overflow-hidden border border-white/5">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a24] border-b border-white/5">
                    <span className="text-xs font-mono text-violet-400/70">{lang || "code"}</span>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                      <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                    </div>
                  </div>
                  <pre className="bg-[#0a0a12] p-4 overflow-x-auto">
                    <code className="text-xs font-mono text-emerald-400/90 leading-relaxed">
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="bg-white/8 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ─── Stat Item ─────────────────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-white/20">{label}</span>
      <span className="text-violet-400/60 font-semibold">{value}</span>
    </span>
  );
}
