const catppuccinLatte = {
  plain: {
    color: '#4c4f69',
    backgroundColor: '#eff1f5',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#9ca0b0', fontStyle: 'italic' } },
    { types: ['punctuation'], style: { color: '#5c5f77' } },
    { types: ['namespace'], style: { opacity: 0.7 } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol', 'deleted'], style: { color: '#fe640b' } },
    { types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: '#40a02b' } },
    { types: ['operator', 'entity', 'url'], style: { color: '#179299' } },
    { types: ['atrule', 'attr-value', 'keyword'], style: { color: '#8839ef' } },
    { types: ['function', 'class-name'], style: { color: '#1e66f5' } },
    { types: ['regex', 'important', 'variable'], style: { color: '#df8e1d' } },
    { types: ['important', 'bold'], style: { fontWeight: 'bold' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
  ],
};

const catppuccinMocha = {
  plain: {
    color: '#cdd6f4',
    backgroundColor: '#1e1e2e',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#6c7086', fontStyle: 'italic' } },
    { types: ['punctuation'], style: { color: '#bac2de' } },
    { types: ['namespace'], style: { opacity: 0.7 } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol', 'deleted'], style: { color: '#fab387' } },
    { types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: '#a6e3a1' } },
    { types: ['operator', 'entity', 'url'], style: { color: '#94e2d5' } },
    { types: ['atrule', 'attr-value', 'keyword'], style: { color: '#cba6f7' } },
    { types: ['function', 'class-name'], style: { color: '#89b4fa' } },
    { types: ['regex', 'important', 'variable'], style: { color: '#f9e2af' } },
    { types: ['important', 'bold'], style: { fontWeight: 'bold' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
  ],
};

export { catppuccinLatte, catppuccinMocha };
