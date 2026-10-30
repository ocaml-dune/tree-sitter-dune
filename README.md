# tree-sitter-dune

[![CI](https://github.com/ocaml-dune/tree-sitter-dune/actions/workflows/ci.yml/badge.svg)](https://github.com/ocaml-dune/tree-sitter-dune/actions)
[![npm](https://img.shields.io/npm/v/tree-sitter-dune.svg)](https://www.npmjs.com/package/tree-sitter-dune)
[![crates.io](https://img.shields.io/crates/v/tree-sitter-dune.svg)](https://crates.io/crates/tree-sitter-dune)
[![pypi](https://img.shields.io/pypi/v/tree-sitter-dune.svg)](https://pypi.org/project/tree-sitter-dune/)

Tree-sitter grammar for [Dune](https://dune.readthedocs.io/) build system files.

## Features

- **Complete dune file support**: Parses all major stanzas including `executable`, `library`, `rule`, `test`, `alias`, and more
- **dune-project support**: Full support for project metadata files including `lang`, `name`, `version`, `package`, and all project configuration stanzas
- **dune-workspace support**: Complete support for workspace configuration including `context`, `profile`, and cross-compilation setup
- **Syntax highlighting**: Comprehensive highlight queries for editor integration
- **Field markers**: Structured AST with named fields for precise code navigation
- **86+ test cases**: Extensively tested against real-world Dune files

## Supported File Types

- `dune` - Build files in each directory
- `dune-project` - Project metadata and configuration
- `dune-workspace` - Workspace-level settings and build contexts

## Installation

### NPM

```bash
npm install tree-sitter-dune
```

### Cargo

```bash
cargo add tree-sitter-dune
```

### Tree-sitter CLI

```bash
git clone https://github.com/ocaml-dune/tree-sitter-dune
cd tree-sitter-dune
npm ci                # installs the pinned tree-sitter CLI
npm run generate      # make generate, at the pinned ABI
npx tree-sitter test
```

The committed `src/parser.c` is ABI 14, because most Emacs builds cannot load
ABI 15 yet. The CLI and ABI versions are set in the `Makefile`
(`TREE_SITTER_VERSION` and `TS_ABI_VERSION`).

## Usage

### Node.js

```javascript
const Parser = require('tree-sitter');
const Dune = require('tree-sitter-dune');

const parser = new Parser();
parser.setLanguage(Dune);

const sourceCode = `
(library
 (name my_lib)
 (libraries base stdio))
`;

const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

### Rust

```rust
use tree_sitter::Parser;

fn main() {
    let mut parser = Parser::new();
    parser.set_language(&tree_sitter_dune::LANGUAGE.into()).expect("Error loading Dune grammar");

    let source_code = r#"
(library
 (name my_lib)
 (libraries base stdio))
"#;

    let tree = parser.parse(source_code, None).unwrap();
    println!("{}", tree.root_node().to_sexp());
}
```

### Python

```python
from tree_sitter import Language, Parser
import tree_sitter_dune

parser = Parser()
parser.set_language(Language(tree_sitter_dune.language(), "dune"))

source_code = b"""
(library
 (name my_lib)
 (libraries base stdio))
"""

tree = parser.parse(source_code)
print(tree.root_node.sexp())
```

### Go

```go
package main

import (
    "context"
    "fmt"
    sitter "github.com/tree-sitter/go-tree-sitter"
    dune "github.com/ocaml-dune/tree-sitter-dune/bindings/go"
)

func main() {
    parser := sitter.NewParser()
    parser.SetLanguage(sitter.NewLanguage(dune.Language()))

    sourceCode := []byte(`
(library
 (name my_lib)
 (libraries base stdio))
`)

    tree := parser.Parse(sourceCode, nil)
    fmt.Println(tree.RootNode().ToSexp())
}
```

## Editor Integration

### Neovim

With [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter):

```lua
require'nvim-treesitter.configs'.setup {
  ensure_installed = { "dune" },
  highlight = {
    enable = true,
  },
}
```

### Emacs

[neocaml](https://github.com/bbatsov/neocaml) provides `neocaml-dune-mode`, a tree-sitter based major mode for dune, dune-project, and dune-workspace files. It uses Emacs's built-in `treesit` library (Emacs 29+).

## Grammar Coverage

### dune files

✅ **Fully Supported:**
- `executable`, `executables` - Build executables
- `library` - OCaml libraries
- `test`, `tests` - Test executables
- `rule` - Custom build rules with actions
- `alias` - Named build targets
- `install` - Installation rules
- `toplevel` - Custom toplevels
- `copy_files` - File copying with globs
- `include` - Include dune fragments
- `menhir` - Menhir parser generator
- `ocamllex`, `ocamlyacc` - Lexer/parser generation
- `foreign_library` - C/C++ libraries
- `plugin` - Compiler plugins
- `mdx` - Markdown executable blocks
- `coq.theory` - Coq integration
- `cram` - Cram tests
- `subdir` - Nested directories
- `env` - Environment configuration
- `ignored_subdirs` - Ignore directories
- `deprecated_library_name` - Library renaming
- Actions: `run`, `bash`, `copy`, `diff`, `write-file`, `with-stdout-to`, `progn`, and 15+ more

**Coverage:** 30/34 stanzas (88%), ~99% real-world usage

### dune-project files

✅ **Fully Supported (100% coverage):**
- `lang` - Language version (required)
- `name`, `version`, `license` - Project metadata
- `authors`, `maintainers`, `maintenance_intent` - Contributors
- `homepage`, `documentation`, `bug_reports` - URLs
- `source` - Repository information (github/git/uri)
- `package` - Package definitions with complex dependencies
- `generate_opam_files`, `opam_file_location` - OPAM integration
- `using` - Extension configuration (menhir, coq, etc.)
- `formatting` - Formatter settings
- `dialect` - Custom dialects
- `pin` - Pin dependencies
- `warnings` - Compiler warnings config
- `explicit_js_mode` - JavaScript mode
- `subst` - Watermarking
- Boolean flags: `accept_alternative_dune_file_name`, `executables_implicit_empty_intf`, `expand_aliases_in_sandbox`, `implicit_transitive_deps`, `map_workspace_root`, `use_standard_c_and_cxx_flags`, `wrapped_executables`

**Coverage:** 29/29 stanzas (100%)

### dune-workspace files

✅ **Fully Supported:**
- `context` - Build contexts
  - `(context default)` - Default context
  - `(context (opam ...))` - Opam switch contexts
  - Fields: `switch`, `name`, `profile`, `toolchain`, `host`, `target`
  - Flags: `merlin`, `generate_merlin_rules`, `disable_dynamically_linked_foreign_archives`
  - Additional: `root`, `lock_dir`, `paths`, `env`, `fdo`, `targets`
- `profile` - Build profile selection (dev/release/custom)

## Development

### Building

```bash
npm ci
npm run generate
```

`npm ci` also builds the Node binding, which fails on Node 26 (CI uses Node 20).
For grammar work only the CLI is needed:
`npm ci --ignore-scripts && npm rebuild tree-sitter-cli`.

### Testing

```bash
npx tree-sitter test
```

This runs the corpus tests in `test/corpus/` and the tag assertions in
`test/tags/`.

### Debugging

```bash
npx tree-sitter parse test/examples/dune
npx tree-sitter parse --debug test/examples/dune-project
```

## Contributing

Contributions are welcome! Please:

1. Add tests for any new features in `test/corpus/`
2. Ensure all tests pass with `npx tree-sitter test`
3. Update this README if adding new stanza support
4. Follow the existing code style

### Adding New Stanzas

1. Define the stanza in `grammar.js`:
   ```javascript
   _stanza_my_new_stanza: ($) =>
     dune_stanza(
       $,
       "my_stanza",
       choice(
         alias($._sf_my_field, $.stanza_field),
         $.sexp,
       ),
     ),
   _sf_my_field: ($) => dune_field($, "my_field", $.value_type),
   ```

   Each field is a hidden `_sf_*` rule aliased to `stanza_field`, so every
   field gets one wrapper node. Reuse an existing `_sf_*` rule when one fits.

2. Add it to the `stanza` choice list
3. Create tests in `test/corpus/`
4. Run `npm run generate && npx tree-sitter test`

## Resources

- [Dune Documentation](https://dune.readthedocs.io/)
- [Tree-sitter Documentation](https://tree-sitter.github.io/)
- [Grammar Development Guide](https://tree-sitter.github.io/tree-sitter/creating-parsers)

## License

MIT
