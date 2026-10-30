package tree_sitter_dune_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_dune "github.com/ocaml-dune/tree-sitter-dune/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_dune.Language())
	if language == nil {
		t.Errorf("Error loading Dune grammar")
	}
}
