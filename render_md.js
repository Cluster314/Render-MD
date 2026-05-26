(function() {
    // 1. Inject Prism & KaTeX Theme and Layout CSS
    const prismTheme = document.createElement('link');
    prismTheme.rel = 'stylesheet';
    prismTheme.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    document.head.appendChild(prismTheme);

    const katexTheme = document.createElement('link');
    katexTheme.rel = 'stylesheet';
    katexTheme.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(katexTheme);

    const style = document.createElement('style');
    style.innerHTML = `
        md { display: none; }
        .md-rendered { display: block; }

        /* Multiline Code Block Container */
        .code-block-wrapper {
            margin: 1.5rem 0;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #333;
            background: #1e1e1e;
        }

        /* Top Header Bar */
        .code-block-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2d2d2d;
            padding: 8px 16px;
            border-bottom: 1px solid #333;
            user-select: none;
        }

        .code-block-lang {
            font-family: sans-serif;
            font-size: 12px;
            font-weight: 600;
            color: #aaa;
            letter-spacing: 0.5px;
        }

        /* Copy Button */
        .copy-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .copy-btn:hover { background: rgba(255,255,255,0.1); }
        .copy-btn svg { fill: #aaa; transition: fill 0.2s; }
        .copy-btn:hover svg { fill: #fff; }

        /* Pre Block adjustments */
        .code-block-wrapper pre {
            margin: 0 !important;
            padding: 1.2rem !important;
            border: none !important;
            border-radius: 0 !important;
            overflow-x: auto;
        }
        
        code[class*="language-"] {
            font-family: 'Consolas', 'Monaco', monospace;
            line-height: 1.5;
            background: transparent !important;
        }

        /* Inline Code Formatting */
        :not(pre) > code {
            background: #2d2d2d !important;
            color: #f78c6c !important;
            padding: 3px 6px !important;
            border-radius: 4px;
            font-family: monospace;
        }

        /* LaTeX Styling tweaks */
        .katex-display {
            overflow-x: auto;
            overflow-y: hidden;
            padding: 0.5rem 0;
        }
    `;
    document.head.appendChild(style);

    const copyIcon = `<svg width="14" height="14" viewBox="0 0 24 24"><path d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" /></svg>`;
    const checkIcon = `<svg width="14" height="14" viewBox="0 0 24 24"><path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" /></svg>`;

    const LANGUAGE_NAMES = {
        'js': 'JavaScript', 'javascript': 'JavaScript',
        'ts': 'TypeScript', 'typescript': 'TypeScript',
        'py': 'Python', 'python': 'Python',
        'rb': 'Ruby', 'ruby': 'Ruby',
        'html': 'HTML', 'css': 'CSS',
        'md': 'Markdown', 'markdown': 'Markdown',
        'sh': 'Terminal', 'bash': 'Terminal', 'zsh': 'Terminal',
        'json': 'JSON', 'yml': 'YAML', 'yaml': 'YAML',
        'cpp': 'C++', 'cs': 'C#'
    };

    const getCleanLangName = (rawLang) => {
        if (!rawLang) return 'Unknown';
        const lower = rawLang.toLowerCase();
        return LANGUAGE_NAMES[lower] || 'Unknown';
    };

    // Load dependencies synchronously in order (Marked -> KaTeX -> Prism)
    const loadDependencies = () => {
        return new Promise((resolve) => {
            const loadScript = (src, callback) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = callback;
                document.head.appendChild(script);
            };

            loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', () => {
                loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js', () => {
                    loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js', () => {
                        loadScript('https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js', resolve);
                    });
                });
            });
        });
    };

    // Setup KaTeX extension configuration for marked
    const configureMarkedWithLatex = () => {
        const inlineMathReg = /^\$([^$\n]+?)\$/;
        const blockMathReg = /^\$\$([\s\S]+?)\$\$/;

        marked.use({
            extensions: [
                {
                    name: 'blockMath',
                    level: 'block',
                    start(src) { return src.indexOf('$$'); },
                    tokenizer(src, tokens) {
                        const match = blockMathReg.exec(src);
                        if (match) {
                            return { type: 'blockMath', raw: match[0], math: match[1].trim() };
                        }
                    },
                    renderer(token) {
                        try {
                            return katex.renderToString(token.math, { displayMode: true, throwOnError: false });
                        } catch (err) {
                            return `<span class="katex-error">${token.raw}</span>`;
                        }
                    }
                },
                {
                    name: 'inlineMath',
                    level: 'inline',
                    start(src) { return src.indexOf('$'); },
                    tokenizer(src, tokens) {
                        const match = inlineMathReg.exec(src);
                        if (match) {
                            return { type: 'inlineMath', raw: match[0], math: match[1].trim() };
                        }
                    },
                    renderer(token) {
                        try {
                            return katex.renderToString(token.math, { displayMode: false, throwOnError: false });
                        } catch (err) {
                            return `<span class="katex-error">${token.raw}</span>`;
                        }
                    }
                }
            ]
        });
    };

    const render = () => {
        configureMarkedWithLatex();

        document.querySelectorAll('md').forEach(mdTag => {
            const div = document.createElement('div');
            div.className = 'md-rendered';
            
            const lines = mdTag.textContent.split('\n');
            const minIndent = lines.filter(l => l.trim()).reduce((min, line) => {
                const match = line.match(/^\s*/);
                return match[0].length < min ? match[0].length : min;
            }, Infinity);
            const cleanMD = lines.map(line => line.slice(minIndent)).join('\n').trim();

            div.innerHTML = marked.parse(cleanMD);

            // Prism Post-processing for wrappers
            div.querySelectorAll('pre').forEach(pre => {
                const codeEl = pre.querySelector('code');
                if (!codeEl) return;

                const langClass = Array.from(codeEl.classList).find(c => c.startsWith('language-'));
                const rawLangName = langClass ? langClass.replace('language-', '') : '';
                const displayName = getCleanLangName(rawLangName);

                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';

                const header = document.createElement('div');
                header.className = 'code-block-header';
                header.innerHTML = `
                    <span class="code-block-lang">${displayName}</span>
                    <button class="copy-btn">${copyIcon}</button>
                `;

                const btn = header.querySelector('.copy-btn');
                btn.onclick = () => {
                    navigator.clipboard.writeText(codeEl.innerText).then(() => {
                        btn.innerHTML = checkIcon;
                        setTimeout(() => { btn.innerHTML = copyIcon; }, 1500);
                    });
                };

                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(header);
                wrapper.appendChild(pre);
            });
            
            mdTag.parentNode.insertBefore(div, mdTag);
            mdTag.remove();
        });

        if (window.Prism) Prism.highlightAll();
    };

    loadDependencies().then(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', render);
        } else {
            render();
        }
    });
})();