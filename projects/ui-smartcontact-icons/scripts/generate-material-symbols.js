const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CODEPOINTS_FILE = path.resolve(ROOT_DIR, 'src/lib/icons/material-symbols-rounded.codepoints');
const GENERATED_TS_FILE = path.resolve(ROOT_DIR, 'src/lib/icons/sc-material-symbols.generated.ts');
const GENERATED_CSS_FILE = path.resolve(ROOT_DIR, 'src/lib/styles/material-symbols-icons.generated.css');

function toLabel(name) {
    return name
        .split('_')
        .map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part)
        .join(' ');
}

function parseCodepoints(content) {
    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [name, codepoint] = line.split(/\s+/);

            if (!name || !codepoint) {
                throw new Error(`Invalid codepoint line: ${line}`);
            }

            return {
                name,
                glyph: name,
                label: toLabel(name),
                codepoint,
                keywords: Array.from(new Set(name.split('_').filter(Boolean)))
            };
        });
}

function stringLiteral(value) {
    return JSON.stringify(value);
}

function buildTypescript(icons) {
    const items = icons.map((icon) => {
        const keywords = `[${icon.keywords.map(stringLiteral).join(', ')}]`;

        return `    { name: ${stringLiteral(icon.name)}, glyph: ${stringLiteral(icon.glyph)}, label: ${stringLiteral(icon.label)}, codepoint: ${stringLiteral(icon.codepoint)}, keywords: ${keywords} }`;
    });

    const glyphs = icons.map(
        (icon) => `    ${stringLiteral(icon.name)}: ${stringLiteral(icon.glyph)}`,
    );

    return [
        '/* Auto-generated from material-symbols-rounded.codepoints. Do not edit directly. */',
        '',
        '// Mapa lean nombre -> glifo, emitido como LITERAL independiente (NO derivado de',
        '// SC_MATERIAL_SYMBOLS). Es lo unico que necesita el render (resolveScIconGlyph /',
        '// isScMaterialSymbolName), de modo que el catalogo completo (label/keywords/',
        '// codepoint) se cae por tree-shaking en las apps que solo pintan iconos. Si lo',
        '// vuelves a derivar del array, el catalogo entero regresa al bundle.',
        'export const SC_MATERIAL_SYMBOL_GLYPHS = {',
        glyphs.join(',\n'),
        '};',
        '',
        'export type ScMaterialSymbolName = keyof typeof SC_MATERIAL_SYMBOL_GLYPHS;',
        '',
        '// Catalogo completo (label/keywords/codepoint), para un futuro buscador de iconos.',
        '// Solo entra al bundle si algo lo importa explicitamente (hoy nadie en runtime).',
        'export const SC_MATERIAL_SYMBOLS = [',
        items.join(',\n'),
        '] as const;',
        '',
        "export type ScMaterialSymbolCatalogItem = typeof SC_MATERIAL_SYMBOLS[number];",
        '',
    ].join('\n');
}

function buildCss(icons) {
    const rules = icons.map((icon) => [
        `.sc-icon-font--${icon.name}::before {`,
        `  content: ${stringLiteral(icon.glyph)};`,
        '}',
    ].join('\n'));

    return [
        '/* Auto-generated from material-symbols-rounded.codepoints. Do not edit directly. */',
        ...rules,
        '',
    ].join('\n\n');
}

function main() {
    if (!fs.existsSync(CODEPOINTS_FILE)) {
        throw new Error(`Missing codepoints file: ${CODEPOINTS_FILE}`);
    }

    const icons = parseCodepoints(fs.readFileSync(CODEPOINTS_FILE, 'utf8'));

    fs.writeFileSync(GENERATED_TS_FILE, buildTypescript(icons), 'utf8');
    fs.writeFileSync(GENERATED_CSS_FILE, buildCss(icons), 'utf8');

    console.log(`[icons] Generated ${icons.length} Material Symbols.`);
}

main();
