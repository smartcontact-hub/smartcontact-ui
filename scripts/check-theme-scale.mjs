import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const rootDir = process.cwd();
const presetDir = join(rootDir, "projects", "ui-smartcontact", "src", "lib", "theme", "sc-preset");
const primeStylesDir = join(rootDir, "node_modules", "@primeuix", "styles", "dist");
const cssFile = join(presetDir, "css.ts");

const requiredSelectorsByModule = new Map([
    ["autocomplete", [".p-autocomplete .p-autocomplete-input-multiple", ".p-autocomplete .p-autocomplete-input-chip input"]],
    ["button", [".p-component.p-button"]],
    ["datepicker", [".p-datepicker-day-view", ".p-datepicker-time-picker span"]],
    ["editor", [".p-editor .ql-container"]],
    ["inputchips", [".p-inputchips .p-inputchips-input-item input"]],
    ["inputtext", [".p-component.p-inputtext"]],
    ["select", [".p-select .p-select-label"]],
    ["terminal", [".p-terminal .p-terminal-prompt-value"]],
    ["textarea", [".p-component.p-textarea"]],
    ["togglebutton", [".p-component.p-togglebutton"]]
]);

const walk = (dir, predicate = () => true) => {
    if (!existsSync(dir)) {
        return [];
    }

    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);

        if (entry.isDirectory()) {
            return walk(path, predicate);
        }

        return predicate(path) ? [path] : [];
    });
};

const read = (path) => readFileSync(path, "utf8");
const toRelative = (path) => relative(rootDir, path).replaceAll("\\", "/");
const issues = [];
const warnings = [];

const css = read(cssFile);

const modulesWithFixedFontSize = walk(primeStylesDir, (path) => path.endsWith("index.mjs"))
    .filter((path) => read(path).includes("font-size: 1rem"))
    .map((path) => path.split(/[\\/]/).at(-2))
    .sort();

for (const moduleName of modulesWithFixedFontSize) {
    const selectors = requiredSelectorsByModule.get(moduleName);

    if (!selectors?.some((selector) => css.includes(selector))) {
        issues.push(`Missing central CSS coverage for PrimeUIX module "${moduleName}".`);
    }
}

const presetComponentFiles = walk(presetDir, (path) =>
    path.endsWith(".ts") && !["index.ts", "css.ts"].includes(path.split(/[\\/]/).at(-1))
);

for (const file of presetComponentFiles) {
    if (/\bcss\s*:/.test(read(file))) {
        issues.push(`Component preset contains local css property: ${toRelative(file)}.`);
    }
}

const styleFiles = walk(join(rootDir, "projects"), (path) => /\.(css|scss)$/.test(path));

for (const file of styleFiles) {
    if (/html\s*\{[^}]*font-size\s*:\s*(14px|87\.5%|0\.875rem)/s.test(read(file))) {
        issues.push(`Global html font-size scale override found: ${toRelative(file)}.`);
    }
}

const pxValuePattern = /-?\d*\.?\d+px\b/g;
const presetPxValues = [];

for (const file of presetComponentFiles) {
    const content = read(file);
    let match;

    while ((match = pxValuePattern.exec(content))) {
        presetPxValues.push(`${toRelative(file)} -> ${match[0]}`);
    }
}

if (presetPxValues.length > 0) {
    issues.push(
        `Preset must not contain px values (${presetPxValues.length} found).`,
        ...presetPxValues.slice(0, 12).map((item) => `  ${item}`)
    );
}

console.log(`PrimeUIX modules with font-size: 1rem: ${modulesWithFixedFontSize.join(", ") || "none"}`);
console.log(`Checked component preset files: ${presetComponentFiles.length}`);

if (warnings.length > 0) {
    console.warn(["Warnings:", ...warnings].join("\n"));
}

if (issues.length > 0) {
    console.error(["Theme scale audit failed:", ...issues.map((issue) => `  - ${issue}`)].join("\n"));
    process.exitCode = 1;
} else {
    console.log("Theme scale audit passed.");
}
