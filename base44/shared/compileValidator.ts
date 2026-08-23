// ============================================================
// compileValidator.ts — Validates generated code files for
// compilability. Checks:
// 1. Balanced braces/brackets/parens in code files
// 2. Import resolution (every import references a file in the
//    manifest or an installed npm package)
// 3. JSON validity for .jsonc/.json files
// 4. Route registration (every page has a Route in App.jsx)
// 5. Export presence (every component file exports something)
// ============================================================

export interface CompileResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileCount: number;
  checkedCount: number;
}

// ── Installed npm packages (from the app's package.json) ─────────────────
// These are the packages that can be imported without a corresponding
// file in the manifest.
const NPM_PACKAGES = new Set([
  "react", "react-dom", "react-router-dom", "react-hook-form",
  "@tanstack/react-query", "recharts", "lucide-react", "moment",
  "date-fns", "lodash", "react-markdown", "framer-motion", "three",
  "react-leaflet", "@hello-pangea/dnd", "react-quill-new",
  "tailwindcss", "clsx", "tailwind-merge", "class-variance-authority",
  "zod", "@hookform/resolvers", "sonner", "next-themes",
  "react-hot-toast", "react-resizable-panels", "vaul",
  "embla-carousel-react", "react-day-picker", "input-otp",
  "canvas-confetti", "html2canvas", "jspdf",
  "@base44/sdk", "@base44/vite-plugin",
  // Common external packages that might be in generated apps
  "next", "express", "prisma", "@prisma/client", "stripe",
  "@stripe/react-stripe-js", "@stripe/stripe-js",
  "zustand", "axios", "swr", "nodemailer", "bcrypt",
  "jsonwebtoken", "dotenv", "cors", "helmet",
  // shadcn/ui dependencies
  "@radix-ui/react-accordion", "@radix-ui/react-alert-dialog",
  "@radix-ui/react-avatar", "@radix-ui/react-checkbox",
  "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu",
  "@radix-ui/react-label", "@radix-ui/react-popover",
  "@radix-ui/react-progress", "@radix-ui/react-select",
  "@radix-ui/react-separator", "@radix-ui/react-slot",
  "@radix-ui/react-switch", "@radix-ui/react-tabs",
  "@radix-ui/react-toast", "@radix-ui/react-tooltip",
  "cmdk",
]);

// ── Balanced delimiter check ─────────────────────────────────────────────

function checkBalanced(code: string): string[] {
  const errors: string[] = [];
  const stack: { char: string; line: number }[] = [];
  const lines = code.split("\n");

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let inString = false;
    let stringChar = "";
    let inComment = false;
    let inTemplate = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const prevChar = i > 0 ? line[i - 1] : "";

      // Handle comments
      if (!inString && char === "/" && line[i + 1] === "/" && !inComment) {
        break; // rest of line is a comment
      }

      // Handle string literals
      if ((char === '"' || char === "'" || char === "`") && prevChar !== "\\") {
        if (inString && char === stringChar) {
          inString = false;
          stringChar = "";
        } else if (!inString) {
          inString = true;
          stringChar = char;
        }
      }

      if (inString) continue;

      // Track delimiters
      if (char === "{" || char === "[" || char === "(") {
        stack.push({ char, line: lineNum + 1 });
      } else if (char === "}" || char === "]" || char === ")") {
        const expected = char === "}" ? "{" : char === "]" ? "[" : "(";
        const top = stack.pop();
        if (!top || top.char !== expected) {
          errors.push(`Unmatched '${char}' at line ${lineNum + 1}`);
        }
      }
    }
  }

  // Any remaining unclosed delimiters
  for (const item of stack) {
    errors.push(`Unclosed '${item.char}' opened at line ${item.line}`);
  }

  return errors;
}

// ── Import extraction ────────────────────────────────────────────────────

function extractImports(code: string): string[] {
  const imports: string[] = [];
  // Match: import ... from "..." or import "..."
  const importRegex = /import\s+.*?from\s+["']([^"']+)["']/g;
  const importRegex2 = /import\s+["']([^"']+)["']/g;
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  while ((match = importRegex2.exec(code)) !== null) {
    imports.push(match[1]);
  }

  // Also match require("...")
  const requireRegex = /require\s*\(\s*["']([^"']+)["']\s*\)/g;
  while ((match = requireRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

// ── Check if an import resolves ───────────────────────────────────────────

function importResolves(importPath: string, filePaths: Set<string>, currentFile: string): boolean {
  // NPM package (doesn't start with . or / or @/ unless it's @base44)
  if (!importPath.startsWith(".") && !importPath.startsWith("/") && !importPath.startsWith("@/")) {
    const pkgName = importPath.split("/")[0];
    if (importPath.startsWith("@")) {
      const scoped = importPath.split("/").slice(0, 2).join("/");
      return NPM_PACKAGES.has(scoped) || NPM_PACKAGES.has(pkgName);
    }
    return NPM_PACKAGES.has(pkgName);
  }

  // @/ alias — resolve to src/
  if (importPath.startsWith("@/")) {
    const resolved = "src/" + importPath.slice(2);
    // Try exact, .jsx, .js, .tsx, .ts, /index.jsx, /index.js
    const variants = [
      resolved,
      resolved + ".jsx", resolved + ".js", resolved + ".tsx", resolved + ".ts",
      resolved + "/index.jsx", resolved + "/index.js", resolved + "/index.tsx", resolved + "/index.ts",
    ];
    return variants.some((v) => filePaths.has(v));
  }

  // Relative import — resolve from current file's directory
  if (importPath.startsWith(".")) {
    const currentDir = currentFile.includes("/")
      ? currentFile.substring(0, currentFile.lastIndexOf("/"))
      : "";
    const resolved = currentDir ? `${currentDir}/${importPath}` : importPath;
    const cleanResolved = resolved.replace(/\.\.\//g, "").replace(/\.\//g, "");
    const variants = [
      cleanResolved,
      cleanResolved + ".jsx", cleanResolved + ".js", cleanResolved + ".tsx", cleanResolved + ".ts",
      cleanResolved + "/index.jsx", cleanResolved + "/index.js",
    ];
    return variants.some((v) => filePaths.has(v));
  }

  return true; // Can't check — assume valid
}

// ── JSON validity check ──────────────────────────────────────────────────

function isValidJSON(content: string): boolean {
  try {
    // Strip JSONC comments
    const stripped = content.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    JSON.parse(stripped);
    return true;
  } catch {
    return false;
  }
}

// ── Route registration check ──────────────────────────────────────────────

function checkRouteRegistration(files: any[]): string[] {
  const errors: string[] = [];
  const appFile = files.find((f) => f.path.endsWith("App.jsx") || f.path.endsWith("App.tsx"));
  if (!appFile) return []; // No App.jsx — skip

  const appContent = appFile.content || "";
  const pageFiles = files.filter((f) => f.category === "page");

  for (const page of pageFiles) {
    // Extract the component name from the file path
    const fileName = page.path.split("/").pop() || "";
    const componentName = fileName.replace(/\.(jsx|tsx)$/, "");

    // Check if this component name appears in App.jsx's routes
    if (!appContent.includes(componentName) && !appContent.includes(page.path)) {
      // Check if the route path is registered
      const routeFromPath = page.path
        .replace(/^src\/pages?\//, "/")
        .replace(/\.(jsx|tsx)$/, "")
        .toLowerCase();
      if (!appContent.includes(routeFromPath)) {
        errors.push(`Page '${componentName}' (${page.path}) not registered in App.jsx routes`);
      }
    }
  }

  return errors;
}

// ── Export presence check ─────────────────────────────────────────────────

function checkExports(files: any[]): string[] {
  const errors: string[] = [];

  for (const f of files) {
    if (f.category === "page" || f.category === "component") {
      const content = f.content || "";
      if (!content.includes("export default") && !content.includes("export function") && !content.includes("export const")) {
        errors.push(`File '${f.path}' (${f.category}) has no export statement`);
      }
    }
  }

  return errors;
}

// ── Main compile validation ───────────────────────────────────────────────

export function validateCompilation(codeManifest: any): CompileResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = codeManifest?.files || [];

  if (files.length === 0) {
    return { valid: false, errors: ["No files to validate"], warnings, fileCount: 0, checkedCount: 0 };
  }

  // Build a set of all file paths for import resolution
  const filePaths = new Set(files.map((f: any) => f.path));

  let checkedCount = 0;

  for (const file of files) {
    const content = file.content || file.key_content || "";
    if (!content || content.trim().length < 10) continue;

    checkedCount++;

    const ext = file.path.split(".").pop()?.toLowerCase() || "";

    // 1. JSON validity for .json/.jsonc files
    if (ext === "json" || ext === "jsonc") {
      if (!isValidJSON(content)) {
        errors.push(`File '${file.path}' is not valid JSON`);
      }
      continue; // Skip other checks for JSON files
    }

    // 2. Balanced delimiters for code files
    if (["jsx", "tsx", "ts", "js", "css"].includes(ext)) {
      const balanceErrors = checkBalanced(content);
      if (balanceErrors.length > 0) {
        errors.push(`File '${file.path}' has syntax issues: ${balanceErrors.slice(0, 3).join("; ")}`);
      }
    }

    // 3. Import resolution for JS/TS files
    if (["jsx", "tsx", "ts", "js"].includes(ext)) {
      const imports = extractImports(content);
      for (const imp of imports) {
        if (!importResolves(imp, filePaths, file.path)) {
          warnings.push(`File '${file.path}' imports '${imp}' which may not resolve`);
        }
      }
    }
  }

  // 4. Route registration
  const routeErrors = checkRouteRegistration(files);
  errors.push(...routeErrors);

  // 5. Export presence
  const exportErrors = checkExports(files);
  errors.push(...exportErrors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileCount: files.length,
    checkedCount,
  };
}