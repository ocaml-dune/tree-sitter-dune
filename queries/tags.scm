; Tags for symbol navigation in Dune files.
;
; tree-sitter-tags only allows @name, @doc, @definition.*, @reference.* and
; @local.* captures, so patterns can only be keyed on node types.  Names whose
; role depends on the field (a library's own name vs. a module list) are not
; tagged.

; Library dependencies, including (re_export ...)
(stanza_field
  (library_name) @name) @reference.library

; Package dependencies in dune-project
(package_dep
  (package_name) @name) @reference.package

; Public names; "-" means no public name
(stanza_field
  (public_name) @name
  (#not-eq? @name "-")) @definition.public_name

; Rule targets
(stanza_field
  (file_name_target
    (file_name) @name)) @definition.target
