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
  Hash,
  List,
  Bold,
  Link2,
  Terminal,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Type,
  AlignLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import ToastManager, {
  ToastManagerHandles,
} from "./components/ui/toast-manager";

// ─── Theme ────────────────────────────────────────────────────────────────────

function useTheme() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mdmaker-theme");
    if (stored === "light") setDark(false);
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      localStorage.setItem("mdmaker-theme", next ? "dark" : "light");
      return next;
    });
  };

  return { dark, toggle };
}

// ─── Converter ────────────────────────────────────────────────────────────────

function isCodeLikeLine(line: string): boolean {
  const t = line.trim();
  return /^[{\[]/.test(t) || /^"[^"]*"\s*:/.test(t) || /^\s{2,}/.test(line);
}

function isRegularText(trimmed: string): boolean {
  return (
    /^[A-Z]/.test(trimmed) &&
    !isCodeLikeLine(trimmed) &&
    !/^(import|export|const|let|var|function|class|def|if|for|while)/.test(
      trimmed
    )
  );
}

function processInline(text: string): string {
  let s = text;
  if (/[*_`\[\]]/.test(s)) return s; // already has markdown
  s = s.replace(/(https?:\/\/[^\s)>]+)/g, "[$1]($1)");
  s = s.replace(
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
    "[$1](mailto:$1)"
  );
  s = s.replace(
    /\b([a-zA-Z0-9._/-]+\.(js|ts|tsx|jsx|json|css|scss|html|md|yaml|yml|toml|env|sh|py|go|rb|rs))\b/g,
    "`$1`"
  );
  s = s.replace(/\b([A-Z]{3,})\b/g, "**$1**");
  s = s.replace(
    /\b(React|Next\.js|TypeScript|JavaScript|TailwindCSS|Tailwind|Prisma|GraphQL|Node\.js|Vercel|Supabase|PostgreSQL|MongoDB|Docker|Kubernetes|Redis|AWS|GCP|Azure)\b/g,
    "`$1`"
  );
  return s;
}

function convertToMarkdown(text: string): string {
  if (!text.trim()) return "";

  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      out.push("");
      i++;
      continue;
    }

    // passthrough: already markdown
    if (
      /^#{1,6}\s/.test(trimmed) ||
      /^```/.test(trimmed) ||
      /^---+$/.test(trimmed)
    ) {
      out.push(raw);
      i++;
      continue;
    }

    // code block detection
    const codeStart =
      /^[{\[]/.test(trimmed) ||
      /^"[^"]*"\s*:\s*/.test(trimmed) ||
      /^(npx|npm|yarn|pnpm|bun|git|cd|ls|cat|curl|wget|docker|kubectl|aws|node|python|ruby|go|rust|cargo)\s/.test(
        trimmed
      ) ||
      /^<[a-zA-Z]/.test(trimmed) ||
      /\.(js|ts|tsx|jsx|json|css|scss|html|py|go|rb|rs|sh|yaml|yml|toml|env)$/.test(
        trimmed
      ) ||
      (/^\s{2,}/.test(raw) && trimmed.length > 0);

    if (codeStart) {
      let lang = "text";
      if (
        /^[{\[]/.test(trimmed) ||
        /^"[^"]*"\s*:/.test(trimmed)
      )
        lang = "json";
      else if (
        /^(npx|npm|yarn|pnpm|bun|git|cd|ls|curl|wget)\s/.test(trimmed)
      )
        lang = "bash";
      else if (
        /\.tsx?$/.test(trimmed) ||
        /^(import|export|const|let|var|function|class|interface|type)\s/.test(
          trimmed
        )
      )
        lang = "typescript";
      else if (/\.jsx?$/.test(trimmed)) lang = "javascript";
      else if (
        /\.py$/.test(trimmed) ||
        /^(def |class |import |from )/.test(trimmed)
      )
        lang = "python";
      else if (/\.(sh|bash)$/.test(trimmed)) lang = "bash";
      else if (/\.(css|scss)$/.test(trimmed)) lang = "css";
      else if (/\.(html|xml)$/.test(trimmed)) lang = "html";
      else if (/\.ya?ml$/.test(trimmed)) lang = "yaml";

      const codeLines: string[] = [raw];
      i++;
      while (i < lines.length) {
        const nr = lines[i];
        const nt = nr.trim();
        if (!nt) {
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && isCodeLikeLine(lines[j])) {
            codeLines.push("");
            i++;
            continue;
          }
          break;
        }
        if (isRegularText(nt)) break;
        codeLines.push(nr);
        i++;
      }
      out.push("```" + lang, ...codeLines, "```", "");
      continue;
    }

    // hr
    if (/^[*\-_]{3,}$/.test(trimmed)) {
      out.push("---");
      i++;
      continue;
    }

    // blockquote
    if (/^[>»]/.test(trimmed)) {
      out.push(`> ${trimmed.replace(/^[>»]\s*/, "")}`);
      i++;
      continue;
    }

    // table
    if (/\|/.test(trimmed) && trimmed.split("|").length >= 3) {
      const tableLines: string[] = [raw];
      i++;
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
        tableLines.push(lines[i]);
        i++;
      }
      if (
        tableLines.length >= 2 &&
        !/^[\s|:-]+$/.test(tableLines[1].trim())
      ) {
        const cols = tableLines[0].split("|").filter(Boolean).length;
        tableLines.splice(
          1,
          0,
          "| " + Array(cols).fill("---").join(" | ") + " |"
        );
      }
      out.push(...tableLines, "");
      continue;
    }

    // headings
    const isHeading =
      trimmed.length >= 2 &&
      trimmed.length <= 100 &&
      /^[A-Z]/.test(trimmed) &&
      !/[.!?,;]$/.test(trimmed) &&
      trimmed.split(" ").length <= 12 &&
      !trimmed.includes('"') &&
      !trimmed.includes("(") &&
      !/^(The|A|An|This|These|That|Those|It|He|She|They|We|I|You)\s/.test(
        trimmed
      ) &&
      !trimmed.includes("http");

    if (isHeading) {
      const prev = out.filter(Boolean).slice(-1)[0] ?? "";
      const level = prev === "" || /^##?\s/.test(prev) ? "##" : "#";
      out.push(`${level} ${trimmed}`);
      i++;
      continue;
    }

    // bullet list
    if (/^[-•*◦▪▫⁃➤➜➸→▸▹]\s+/.test(trimmed)) {
      out.push(
        `- ${processInline(trimmed.replace(/^[-•*◦▪▫⁃➤➜➸→▸▹]\s+/, ""))}`
      );
      i++;
      continue;
    }

    // numbered list
    if (/^\d+[.)]\s+/.test(trimmed)) {
      const m = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
      if (m) {
        out.push(`${m[1]}. ${processInline(m[2])}`);
        i++;
        continue;
      }
    }

    // task list
    if (/^\[[ xX]\]\s+/.test(trimmed)) {
      const checked = /^\[[xX]\]/.test(trimmed);
      const label = trimmed.replace(/^\[[ xX]\]\s+/, "");
      out.push(`- [${checked ? "x" : " "}] ${processInline(label)}`);
      i++;
      continue;
    }

    // key-value
    if (/^[A-Z][a-zA-Z ]+:\s+\S/.test(trimmed)) {
      const ci = trimmed.indexOf(":");
      const key = trimmed.slice(0, ci).trim();
      const val = trimmed.slice(ci + 1).trim();
      out.push(`**${key}:** ${processInline(val)}`);
      i++;
      continue;
    }

    // paragraph (join wrapped lines)
    const para: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,6}\s/.test(lines[i].trim()) &&
      !/^[-•*◦▪▫⁃➤➜➸→▸▹]\s/.test(lines[i].trim()) &&
      !/^\d+[.)]\s/.test(lines[i].trim()) &&
      !/\|/.test(lines[i]) &&
      !isHeadingLine(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    out.push(processInline(para.join(" ")));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function isHeadingLine(t: string): boolean {
  return (
    /^#{1,6}\s/.test(t) ||
    (t.length <= 100 &&
      /^[A-Z]/.test(t) &&
      !/[.!?,;]$/.test(t) &&
      t.split(" ").length <= 12 &&
      !t.includes('"'))
  );
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MdRenderer({ content, dark }: { content: string; dark: boolean }) {
  const prose = dark
    ? {
        h1: "text-2xl font-bold text-white mb-4 pb-2 border-b border-white/10",
        h2: "text-xl font-bold text-white/90 mb-3 mt-6",
        h3: "text-lg font-semibold text-white/80 mb-2 mt-4",
        h4: "text-base font-semibold text-white/70 mb-2 mt-3",
        p: "text-white/65 mb-3 leading-relaxed text-[0.9375rem]",
        a: "text-violet-400 hover:text-violet-300 underline underline-offset-2 decoration-violet-500/30 transition-colors",
        strong: "font-semibold text-white",
        em: "italic text-white/70",
        bq: "border-l-4 border-violet-500/50 pl-4 my-4 bg-violet-500/5 py-3 rounded-r-lg text-white/50 text-sm italic",
        hr: "border-white/10 my-6",
        th: "text-left px-4 py-2.5 text-white/70 font-semibold text-xs uppercase tracking-wider border-b border-white/10 bg-white/5",
        td: "px-4 py-2.5 text-white/55 text-sm border-b border-white/5",
        tr: "hover:bg-white/2 transition-colors",
        inlineCode: "bg-white/8 text-violet-300 px-1.5 py-0.5 rounded text-[0.82em] font-mono",
        codeLang: "text-xs font-mono text-violet-400/70",
        codeBar: "flex items-center justify-between px-4 py-2 bg-[#1a1a24] border-b border-white/5",
        codePre: "bg-[#0a0a12] p-4 overflow-x-auto",
        codeText: "text-xs font-mono text-emerald-400/90 leading-relaxed",
        li: "text-white/65 text-[0.9375rem]",
      }
    : {
        h1: "text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200",
        h2: "text-xl font-bold text-gray-800 mb-3 mt-6",
        h3: "text-lg font-semibold text-gray-800 mb-2 mt-4",
        h4: "text-base font-semibold text-gray-700 mb-2 mt-3",
        p: "text-gray-700 mb-3 leading-relaxed text-[0.9375rem]",
        a: "text-violet-600 hover:text-violet-700 underline underline-offset-2 decoration-violet-400/40 transition-colors",
        strong: "font-semibold text-gray-900",
        em: "italic text-gray-600",
        bq: "border-l-4 border-violet-400 pl-4 my-4 bg-violet-50 py-3 rounded-r-lg text-gray-600 text-sm italic",
        hr: "border-gray-200 my-6",
        th: "text-left px-4 py-2.5 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-200 bg-gray-50",
        td: "px-4 py-2.5 text-gray-600 text-sm border-b border-gray-100",
        tr: "hover:bg-gray-50 transition-colors",
        inlineCode: "bg-gray-100 text-violet-700 px-1.5 py-0.5 rounded text-[0.82em] font-mono",
        codeLang: "text-xs font-mono text-violet-500/80",
        codeBar: "flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200",
        codePre: "bg-gray-900 p-4 overflow-x-auto",
        codeText: "text-xs font-mono text-emerald-400 leading-relaxed",
        li: "text-gray-700 text-[0.9375rem]",
      };

  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className={prose.h1}>{children}</h1>,
        h2: ({ children }) => (
          <h2 className={`${prose.h2} flex items-center gap-2`}>
            <span className="w-1 h-5 bg-violet-500 rounded-full inline-block shrink-0" />
            {children}
          </h2>
        ),
        h3: ({ children }) => <h3 className={prose.h3}>{children}</h3>,
        h4: ({ children }) => <h4 className={prose.h4}>{children}</h4>,
        p: ({ children }) => <p className={prose.p}>{children}</p>,
        ul: ({ children }) => <ul className="mb-4 space-y-1.5 pl-1">{children}</ul>,
        ol: ({ children }) => (
          <ol className={`mb-4 space-y-1.5 pl-5 list-decimal ${prose.li}`}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className={`${prose.li} flex items-start gap-2`}>
            <span className="text-violet-500 text-xs mt-1.5 shrink-0">▸</span>
            <span>{children}</span>
          </li>
        ),
        strong: ({ children }) => <strong className={prose.strong}>{children}</strong>,
        em: ({ children }) => <em className={prose.em}>{children}</em>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className={prose.a}>
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className={prose.bq}>{children}</blockquote>
        ),
        hr: () => <hr className={prose.hr} />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4 rounded-lg border border-white/5">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead>{children}</thead>,
        th: ({ children }) => <th className={prose.th}>{children}</th>,
        td: ({ children }) => <td className={prose.td}>{children}</td>,
        tr: ({ children }) => <tr className={prose.tr}>{children}</tr>,
        code: ({ className, children }) => {
          const isBlock = !!className;
          const lang = className?.replace("language-", "") ?? "";
          if (isBlock) {
            return (
              <div className={`mb-4 rounded-xl overflow-hidden border ${dark ? "border-white/8" : "border-gray-200"}`}>
                <div className={prose.codeBar}>
                  <span className={prose.codeLang}>{lang || "code"}</span>
                  <div className="flex gap-1.5">
                    {["bg-red-400/40", "bg-yellow-400/40", "bg-green-400/40"].map((c) => (
                      <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                    ))}
                  </div>
                </div>
                <pre className={prose.codePre}>
                  <code className={prose.codeText}>{children}</code>
                </pre>
              </div>
            );
          }
          return <code className={prose.inlineCode}>{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ViewMode = "split" | "preview" | "editor";

export default function Home() {
  const { dark, toggle: toggleTheme } = useTheme();

  const [input, setInput] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [rawOpen, setRawOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [lastPaste, setLastPaste] = useState(0);

  const toastRef = useRef<ToastManagerHandles>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMac(/mac/i.test(navigator.platform));
  }, []);

  // live conversion
  useEffect(() => {
    setMarkdown(convertToMarkdown(input));
  }, [input]);

  // global paste shortcut
  const handleSmartPaste = useCallback(async () => {
    const now = Date.now();
    if (now - lastPaste < 800) return;
    setLastPaste(now);
    try {
      const text = await navigator.clipboard.readText();
      if (text?.trim()) {
        setInput(text);
        toastRef.current?.show("Pasted & converted!", "success");
      }
    } catch {
      toastRef.current?.show("Clipboard access denied", "error");
    }
  }, [lastPaste]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && tag !== "TEXTAREA" && tag !== "INPUT") {
        e.preventDefault();
        handleSmartPaste();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSmartPaste]);

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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.md";
    a.click();
    URL.revokeObjectURL(url);
    toastRef.current?.show("Downloaded!", "success");
  };

  const reset = () => {
    setInput("");
    setMarkdown("");
  };

  const insertSnippet = (pre: string, suf = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = input.slice(s, e);
    setInput(input.slice(0, s) + pre + sel + suf + input.slice(e));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(s + pre.length, s + pre.length + sel.length);
    }, 0);
  };

  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const chars = input.length;
  const lines = input.split("\n").length;

  const toolbarButtons = [
    { icon: Hash, label: "H2", action: () => insertSnippet("## ") },
    { icon: Bold, label: "Bold", action: () => insertSnippet("**", "**") },
    { icon: Type, label: "Italic", action: () => insertSnippet("_", "_") },
    { icon: Code2, label: "Inline", action: () => insertSnippet("`", "`") },
    { icon: Terminal, label: "Block", action: () => insertSnippet("```\n", "\n```") },
    { icon: Link2, label: "Link", action: () => insertSnippet("[", "](url)") },
    { icon: List, label: "List", action: () => insertSnippet("- ") },
    { icon: AlignLeft, label: "Quote", action: () => insertSnippet("> ") },
  ];

  // ── Theme tokens ──
  const bg = dark ? "bg-[#0a0a0f]" : "bg-gray-50";
  const navBg = dark
    ? "bg-black/30 border-white/5"
    : "bg-white/80 border-gray-200";
  const panelBg = dark ? "bg-[#0d0d15]" : "bg-white";
  const panelBorder = dark ? "border-white/8" : "border-gray-200";
  const panelHeader = dark ? "bg-[#111119]" : "bg-gray-50";
  const text = dark ? "text-white" : "text-gray-900";
  const muted = dark ? "text-white/40" : "text-gray-400";
  const textareaBg = dark ? "bg-[#0d0d15] text-white/80 placeholder:text-white/15" : "bg-white text-gray-800 placeholder:text-gray-300";
  const toolbarBg = dark ? "bg-[#0f0f18] border-white/5" : "bg-gray-50 border-gray-200";
  const toolbarBtn = dark
    ? "text-white/40 hover:text-white hover:bg-white/5"
    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100";
  const activeTab = "bg-violet-600 text-white shadow-lg shadow-violet-500/20";
  const inactiveTab = dark ? "text-white/40 hover:text-white/70" : "text-gray-500 hover:text-gray-700";
  const tabBar = dark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200";
  const rawBg = dark ? "bg-[#0a0a12] text-emerald-400/80" : "bg-gray-900 text-emerald-400";

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col transition-colors duration-200`}>
      {/* ── Background glows (dark only) ── */}
      {dark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/8 blur-[120px]" />
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav className={`sticky top-0 z-30 flex items-center justify-between px-5 py-3 border-b backdrop-blur-md ${navBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow shadow-violet-500/30">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className={`font-bold text-base tracking-tight ${text}`}>
            MD <span className="text-violet-500">Converter</span>
          </span>
          <span className={`hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded ${dark ? "bg-white/5 text-white/25" : "bg-gray-100 text-gray-400"}`}>
            v2
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${toolbarBtn}`}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a
            href="https://github.com/ratnesh-maurya/mdconverter"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${dark ? "text-white/40 hover:text-white bg-white/3 hover:bg-white/8 border-white/8" : "text-gray-500 hover:text-gray-800 bg-white hover:bg-gray-50 border-gray-200"}`}
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative z-10 text-center py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="inline-flex items-center gap-2 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-3 h-3" />
            Smart text → Markdown converter
          </div>
          <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3 ${text}`}>
            Paste text.{" "}
            <span className="text-violet-500">Get Markdown.</span>
          </h1>
          <p className={`text-sm sm:text-base max-w-lg mx-auto leading-relaxed mb-5 ${muted}`}>
            Drop any content — docs, notes, code, tables — and watch it transform
            into clean, structured Markdown in real time.
          </p>
          <div className={`flex items-center justify-center gap-1.5 text-xs ${muted}`}>
            <kbd className={`px-2 py-1 rounded text-xs font-mono border ${dark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
              {isMac ? "⌘" : "Ctrl"}
            </kbd>
            <span>+</span>
            <kbd className={`px-2 py-1 rounded text-xs font-mono border ${dark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
              V
            </kbd>
            <span className="text-violet-500">anywhere to paste & convert</span>
          </div>
        </motion.div>
      </div>

      {/* ── MAIN EDITOR ── */}
      <div className="relative z-10 flex-1 flex flex-col px-3 sm:px-5 pb-6 max-w-[1440px] w-full mx-auto">
        {/* Controls row */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          {/* View mode tabs */}
          <div className={`flex items-center rounded-xl p-1 border ${tabBar}`}>
            {(["editor", "split", "preview"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${viewMode === m ? activeTab : inactiveTab}`}
              >
                {m === "editor" ? "Editor" : m === "split" ? "Split" : "Preview"}
              </button>
            ))}
          </div>

          {/* Stats + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {input && (
              <span className={`text-[11px] font-mono hidden sm:block ${muted}`}>
                {words}w · {chars}c · {lines}L
              </span>
            )}
            <button
              onClick={reset}
              title="Clear"
              disabled={!input}
              className={`p-1.5 rounded-lg transition-all disabled:opacity-30 ${toolbarBtn}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={downloadMd}
              disabled={!markdown}
              title="Download .md"
              className={`p-1.5 rounded-lg transition-all disabled:opacity-30 ${toolbarBtn}`}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={copyMarkdown}
              disabled={!markdown}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 ${copied ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy MD"}
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`flex items-center gap-0.5 px-2 py-1 mb-2 rounded-xl border ${toolbarBg} flex-wrap`}>
          {toolbarButtons.map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              title={label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all font-medium ${toolbarBtn}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          <div className="ml-auto flex items-center">
            <button
              onClick={handleSmartPaste}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Smart Paste
            </button>
          </div>
        </div>

        {/* Editor + Preview panes */}
        <div
          className={`grid gap-2 flex-1 ${viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
          style={{ minHeight: 0 }}
        >
          {/* ── INPUT ── */}
          <AnimatePresence initial={false}>
            {(viewMode === "editor" || viewMode === "split") && (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col rounded-xl border overflow-hidden ${panelBorder}`}
              >
                {/* pane header */}
                <div className={`flex items-center justify-between px-4 py-2 border-b ${panelHeader} ${panelBorder}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    </div>
                    <span className={`text-xs font-mono ${muted}`}>input</span>
                  </div>
                  {input && (
                    <span className="text-[10px] text-violet-400/60 font-mono">
                      {lines} lines
                    </span>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Paste or type anything…\n\nExamples:\n• Articles, meeting notes, documentation\n• JSON, code snippets, scripts\n• Tables, lists, definitions\n• Any raw text content\n\nMD Converter transforms it all to beautiful Markdown instantly.`}
                  className={`flex-1 w-full resize-none p-4 text-sm font-mono leading-relaxed focus:outline-none transition-colors ${textareaBg} ${panelBg}`}
                  style={{ minHeight: "520px" }}
                  spellCheck={false}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── PREVIEW ── */}
          <AnimatePresence initial={false}>
            {(viewMode === "preview" || viewMode === "split") && (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col rounded-xl border overflow-hidden ${panelBorder}`}
              >
                {/* pane header */}
                <div className={`flex items-center justify-between px-4 py-2 border-b shrink-0 ${panelHeader} ${panelBorder}`}>
                  <div className="flex items-center gap-2">
                    <Eye className={`w-3.5 h-3.5 ${muted}`} />
                    <span className={`text-xs font-medium ${muted}`}>Preview</span>
                  </div>
                  <button
                    onClick={copyRaw}
                    disabled={!markdown}
                    className={`flex items-center gap-1 text-xs transition-all disabled:opacity-30 ${muted} hover:text-violet-400`}
                  >
                    {copiedRaw ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>

                {/* rendered output — scrollable */}
                <div
                  ref={previewRef}
                  className={`flex-1 overflow-y-auto p-5 ${panelBg}`}
                  style={{ minHeight: "420px" }}
                >
                  {markdown ? (
                    <MdRenderer content={markdown} dark={dark} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 gap-4 opacity-20">
                      <FileText className="w-12 h-12" />
                      <p className="text-sm">Preview appears here</p>
                    </div>
                  )}
                </div>

                {/* ── RAW MD collapsible ── */}
                <div className={`border-t shrink-0 ${panelBorder}`}>
                  <button
                    onClick={() => setRawOpen((o) => !o)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium transition-colors ${panelHeader} ${muted} hover:text-violet-400`}
                  >
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Raw Markdown</span>
                      {markdown && (
                        <span className="text-[10px] font-mono text-violet-500/60">
                          {markdown.split("\n").length} lines
                        </span>
                      )}
                    </div>
                    {rawOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {rawOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <pre
                          className={`text-xs font-mono leading-relaxed p-4 overflow-x-auto max-h-64 overflow-y-auto ${rawBg}`}
                        >
                          {markdown || "// Nothing converted yet"}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats bar */}
        <AnimatePresence>
          {markdown && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-2 flex flex-wrap items-center gap-4 px-4 py-2 rounded-xl border text-[11px] font-mono ${dark ? "bg-white/2 border-white/5 text-white/25" : "bg-gray-100 border-gray-200 text-gray-400"}`}
            >
              <Stat label="Words" value={words} />
              <Stat label="Chars" value={chars} />
              <Stat label="Lines" value={markdown.split("\n").length} />
              <Stat label="H" value={(markdown.match(/^#{1,6}\s/gm) || []).length} title="Headings" />
              <Stat label="Code" value={Math.floor((markdown.match(/^```/gm) || []).length / 2)} title="Code blocks" />
              <Stat label="Links" value={(markdown.match(/\[.+?\]\(.+?\)/g) || []).length} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── FEATURE CHIPS ── */}
      <section className="relative z-10 py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-2">
          {[
            "Smart headings",
            "Code detection",
            "Bullet & numbered lists",
            "Table auto-formatting",
            "URL → links",
            "Bold & italic",
            "Task lists",
            "Blockquotes",
            "Key-value pairs",
            "File paths",
            "Real-time preview",
            "Download .md",
            "Collapsible raw panel",
            "Dark & light theme",
          ].map((f) => (
            <span
              key={f}
              className={`text-[11px] px-3 py-1 rounded-full font-medium border ${dark ? "bg-white/3 border-white/8 text-white/35" : "bg-gray-100 border-gray-200 text-gray-500"}`}
            >
              {f}
            </span>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={`relative z-10 border-t py-6 px-5 ${dark ? "border-white/5" : "border-gray-200"}`}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <span className={muted}>
            Made by{" "}
            <a
              href="https://www.ratnesh-maurya.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-500 hover:text-violet-400 transition-colors"
            >
              Ratnesh Maurya
            </a>
          </span>
          <div className={`flex items-center gap-4 ${muted}`}>
            <a href="https://github.com/ratnesh-maurya/mdconverter" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors flex items-center gap-1">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
            <a href="https://x.com/ratnesh_maurya_" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">Twitter</a>
            <a href="https://blog.ratnesh-maurya.com" target="_blank" rel="noopener noreferrer" className="hover:text-violet-400 transition-colors">Blog</a>
          </div>
        </div>
      </footer>

      <ToastManager ref={toastRef} />
    </div>
  );
}

// ── Stat chip ──
function Stat({ label, value, title }: { label: string; value: number; title?: string }) {
  return (
    <span className="flex items-center gap-1" title={title ?? label}>
      <span className="opacity-50">{label}</span>
      <span className="text-violet-500/70 font-semibold">{value}</span>
    </span>
  );
}
