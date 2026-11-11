//! This crate provides Dune build system support for the [tree-sitter][] parsing library.
//!
//! Typically, you will use the [LANGUAGE][] constant to add this language to a
//! tree-sitter [Parser][], and then use the parser to parse some code:
//!
//! ```
//! use tree_sitter::Parser;
//!
//! let code = r#"
//! (library
//!  (name my_lib)
//!  (libraries base stdio))
//! "#;
//! let mut parser = Parser::new();
//! let language = tree_sitter_dune::LANGUAGE;
//! parser
//!     .set_language(&language.into())
//!     .expect("Error loading Dune parser");
//! let tree = parser.parse(code, None).unwrap();
//! assert!(!tree.root_node().has_error());
//! ```
//!
//! [Parser]: https://docs.rs/tree-sitter/*/tree_sitter/struct.Parser.html
//! [tree-sitter]: https://tree-sitter.github.io/

use tree_sitter_language::LanguageFn;

extern "C" {
    fn tree_sitter_dune() -> *const ();
}

/// The tree-sitter [`LanguageFn`][LanguageFn] for this grammar.
///
/// [LanguageFn]: https://docs.rs/tree-sitter-language/*/tree_sitter_language/struct.LanguageFn.html
pub const LANGUAGE: LanguageFn = unsafe { LanguageFn::from_raw(tree_sitter_dune) };

/// The content of the [`node-types.json`][] file for this grammar.
///
/// [`node-types.json`]: https://tree-sitter.github.io/tree-sitter/using-parsers#static-node-types
pub const NODE_TYPES: &str = include_str!("../../src/node-types.json");

/// The syntax highlighting query for this language.
pub const HIGHLIGHTS_QUERY: &str = include_str!("../../queries/highlights.scm");

/// The injections query for this language.
pub const INJECTIONS_QUERY: &str = include_str!("../../queries/injections.scm");

/// The symbol tagging query for this language.
pub const TAGS_QUERY: &str = include_str!("../../queries/tags.scm");

#[cfg(test)]
mod tests {
    #[test]
    fn test_can_load_grammar() {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(&super::LANGUAGE.into())
            .expect("Error loading Dune parser");
    }

    // Editors load the queries through these constants, so a query that
    // names a node or field the grammar no longer has must fail here.
    #[test]
    fn test_highlights_query_is_valid() {
        tree_sitter::Query::new(&super::LANGUAGE.into(), super::HIGHLIGHTS_QUERY)
            .expect("Invalid highlights query");
    }

    #[test]
    fn test_injections_query_is_valid() {
        tree_sitter::Query::new(&super::LANGUAGE.into(), super::INJECTIONS_QUERY)
            .expect("Invalid injections query");
    }

    #[test]
    fn test_tags_query_is_valid() {
        tree_sitter::Query::new(&super::LANGUAGE.into(), super::TAGS_QUERY)
            .expect("Invalid tags query");
    }

    #[test]
    fn test_node_types_matches_grammar() {
        let language: tree_sitter::Language = super::LANGUAGE.into();
        for kind in ["source_file", "stanza", "ocaml_syntax"] {
            assert!(
                super::NODE_TYPES.contains(&format!("\"type\": \"{kind}\"")),
                "node-types.json has no {kind} node"
            );
            assert_ne!(
                language.id_for_node_kind(kind, true),
                0,
                "grammar has no {kind} node"
            );
        }
    }
}
