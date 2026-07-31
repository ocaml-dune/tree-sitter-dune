/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const wrap = (...a) => seq('(', ...a, ')');

const dune_stanza = ($, name, field_parser) =>
  wrap(alias(name, $.stanza_name), repeat(field_parser));

const dune_field = ($, name, value) =>
  wrap(field('name', alias(name, $.field_name)), field('value', value));

const dune_osl = (element, self) =>
  choice(repeat1(element), wrap(optional(self)));

const dune_action = ($, name, value) => wrap(alias(name, $.action_name), field('arguments', value));

const PREC = {COMMENT: 0, STRING: 1};

const atom_regexp = /[^;()"\s]+/;

// A pform cannot contain whitespace, parens, quotes or comments; stopping
// there keeps an unterminated %{ from running on to a later }.
const pform_regexp = /%\{[^}\s()";]+\}/;

const seq_regexp = (a, b) => new RegExp(a.source + b.source);

module.exports = grammar({
  name: 'dune',

  extras: ($) => [$.comment, /\s+/],

  rules: {
    source_file: ($) => choice($.ocaml_syntax, repeat($.stanza)),
    ocaml_syntax: ($) => seq('(* -*- tuareg -*- *)', repeat(/.+/)),
    sexp: ($) => choice($._atom_or_qs, $._list),
    sexps1: ($) => repeat1($.sexp),
    _atom_or_qs: ($) => choice($._atom, $.quoted_string, $.multiline_string),
    quoted_string: ($) => seq('"', repeat($._quoted_string_char), '"'),
    multiline_string: ($) => /("\\[\|>].*\n\s*)+/,
    _quoted_string_char: ($) =>
      token.immediate(
        prec(
          PREC.STRING,
          choice(/[^\\"]/, seq('\\', choice('n', '\n', '\r', 'r', '"', '\\'))),
        ),
      ),
    interpolation: ($) => pform_regexp,
    _atom: ($) => choice($.interpolation, atom_regexp),
    named_variable: ($) => seq_regexp(/:/, atom_regexp),
    _list: ($) => wrap(repeat($.sexp)),
    comment: ($) => token(prec(PREC.COMMENT, /;.*/)),
    stanza: ($) =>
      choice(
        // dune-project stanzas
        $._stanza_lang,
        $._stanza_name,
        $._stanza_version,
        $._stanza_generate_opam_files,
        $._stanza_source,
        $._stanza_authors,
        $._stanza_maintainers,
        $._stanza_license,
        $._stanza_homepage,
        $._stanza_documentation_url,
        $._stanza_bug_reports,
        $._stanza_package,
        $._stanza_using,
        $._stanza_formatting,
        $._stanza_dialect,
        $._stanza_explicit_js_mode,
        $._stanza_pin,
        $._stanza_warnings,
        $._stanza_accept_alternative_dune_file_name,
        $._stanza_executables_implicit_empty_intf,
        $._stanza_expand_aliases_in_sandbox,
        $._stanza_implicit_transitive_deps,
        $._stanza_map_workspace_root,
        $._stanza_opam_file_location,
        $._stanza_subst,
        $._stanza_use_standard_c_and_cxx_flags,
        $._stanza_wrapped_executables,
        $._stanza_maintenance_intent,
        // dune-workspace stanzas
        $._stanza_context,
        $._stanza_profile,
        $._stanza_config,
        $._stanza_lock_dir,
        $._stanza_repository,
        // dune stanzas (env is shared between dune and workspace)
        $._stanza_executable,
        $._stanza_executables,
        $._stanza_rule,
        $._stanza_library,
        dune_stanza($, 'vendored_dirs', $.sexp),
        $._stanza_alias,
        dune_stanza($, 'ocamllex', $._field_modules_maybe_inline),
        dune_stanza($, 'ocamlyacc', $._field_modules_maybe_inline),
        dune_stanza($, 'include_subdirs', $.sexp),
        $._stanza_test,
        $._stanza_tests,
        dune_stanza($, 'data_only_dirs', $.file_name),
        $._stanza_ignored_subdirs,
        $._stanza_cram,
        dune_stanza($, 'dirs', $.sexp),
        $._stanza_copy_files,
        $._stanza_menhir,
        $._stanza_include,
        $._stanza_foreign_library,
        $._stanza_plugin,
        $._stanza_mdx,
        $._stanza_coq_theory,
        $._stanza_deprecated_library_name,
        $._stanza_toplevel,
        $._stanza_install,
        dune_stanza($, 'documentation', $.sexp),
        $._stanza_env,
        $._stanza_subdir,
        $.sexp,
      ),
    _field_modules_maybe_inline: ($) =>
      choice($.module_name, alias($._sf_modules_list, $.stanza_field)),
    _stanza_alias: ($) =>
      dune_stanza(
        $,
        'alias',
        choice(
          alias($._sf_name_alias, $.stanza_field),
          alias($._sf_action_alias, $.stanza_field),
          $._deps_field,
          $.sexp,
        ),
      ),
    _stanza_subdir: ($) =>
      wrap(alias('subdir', $.stanza_name), field('directory', $.file_name), field('stanzas', repeat1($.stanza))),
    _stanza_executable: ($) =>
      dune_stanza($, 'executable', choice($._field_buildable, $.sexp)),
    _stanza_executables: ($) =>
      dune_stanza($, 'executables', choice($._field_buildable_multi, $.sexp)),
    _stanza_test: ($) =>
      dune_stanza($, 'test', choice($._field_buildable, $._field_test, $.sexp)),
    _stanza_tests: ($) =>
      dune_stanza($, 'tests', choice($._field_buildable_multi, $._field_test, $.sexp)),
    // stanza_field is the named wrapper node type for field-value pairs.
    // Concrete fields are hidden _sf_* rules aliased to this type; this body
    // is never matched directly, it only names the type.
    stanza_field: ($) =>
      wrap(field('name', $.field_name), field('value', repeat($.sexp))),
    _field_test: ($) =>
      choice(
        alias($._sf_build_if, $.stanza_field),
        alias($._sf_action, $.stanza_field),
      ),
    _field_buildable_multi: ($) =>
      choice(
        alias($._sf_names, $.stanza_field),
        alias($._sf_public_names, $.stanza_field),
        alias($._sf_libraries, $.stanza_field),
        alias($._sf_modules, $.stanza_field),
        alias($._sf_enabled_if, $.stanza_field),
      ),
    _field_buildable: ($) =>
      choice(
        alias($._sf_name_module, $.stanza_field),
        alias($._sf_public_name, $.stanza_field),
        alias($._sf_libraries, $.stanza_field),
        alias($._sf_modules, $.stanza_field),
        alias($._sf_enabled_if, $.stanza_field),
      ),
    _modules_osl: ($) => dune_osl($.module_name, $._modules_osl),
    _lib_dep: ($) =>
      choice(
        $.library_name,
        alias($._sf_re_export, $.stanza_field),
        alias($._sf_select, $.stanza_field),
      ),
    // Shared _sf_* field rules (used across multiple stanzas)
    _sf_name_module: ($) => dune_field($, 'name', $.module_name),
    _sf_name_package: ($) => dune_field($, 'name', $.package_name),
    _sf_name_atom: ($) => dune_field($, 'name', $._atom_or_qs),
    _sf_name_alias: ($) => dune_field($, 'name', field('alias_name', $.alias_name)),
    _sf_public_name: ($) => dune_field($, 'public_name', $.public_name),
    _sf_names: ($) => dune_field($, 'names', repeat1($.module_name)),
    _sf_names_atom: ($) => dune_field($, 'names', repeat1($._atom_or_qs)),
    _sf_public_names: ($) => dune_field($, 'public_names', repeat1($.public_name)),
    _sf_libraries: ($) => dune_field($, 'libraries', repeat($._lib_dep)),
    _sf_modules: ($) => dune_field($, 'modules', optional($._modules_osl)),
    _sf_modules_list: ($) => dune_field($, 'modules', repeat($.module_name)),
    _sf_modules_list1: ($) => dune_field($, 'modules', repeat1($.module_name)),
    _sf_enabled_if: ($) => dune_field($, 'enabled_if', $.blang),
    _sf_build_if: ($) => dune_field($, 'build_if', $.blang),
    _sf_action: ($) => dune_field($, 'action', $.action),
    _sf_action_alias: ($) => dune_field($, 'action', field('action', $.action)),
    _sf_deps: ($) => dune_field($, 'deps', repeat1($._dep)),
    _sf_re_export: ($) => dune_field($, 're_export', $.library_name),
    _sf_select: ($) => dune_field($, 'select', $.sexps1),
    _sf_package: ($) => dune_field($, 'package', $.package_name),
    _sf_files_sexp: ($) => dune_field($, 'files', repeat($.sexp)),
    _sf_files_file: ($) => dune_field($, 'files', $.file_name),
    _sf_files_filelist: ($) => dune_field($, 'files', repeat($.file_name)),
    _sf_flags: ($) => dune_field($, 'flags', repeat($._atom_or_qs)),
    _sf_alias_single: ($) => dune_field($, 'alias', $.alias_name),
    _sf_alias_list: ($) => dune_field($, 'alias', repeat1($.alias_name)),
    _sf_synopsis: ($) => dune_field($, 'synopsis', $._atom_or_qs),
    _sf_description: ($) => dune_field($, 'description', $._atom_or_qs),
    _sf_instrumentation: ($) => dune_field($, 'instrumentation', $.sexp),
    _sf_kind: ($) => dune_field($, 'kind', $.sexp),
    _sf_ppx_driver: ($) => dune_field($, 'ppx.driver', $.sexps1),
    _sf_wrapped: ($) =>
      dune_field(
        $,
        'wrapped',
        choice(
          optional($.bool),
          alias($._sf_transition, $.stanza_field),
        ),
      ),
    _sf_transition: ($) => dune_field($, 'transition', $._atom_or_qs),
    _sf_section: ($) => dune_field($, 'section', $._atom_or_qs),
    _sf_dirs_sexp: ($) => dune_field($, 'dirs', repeat($.sexp)),
    _sf_sites: ($) => dune_field($, 'sites', repeat($.sexp)),
    _sf_mode_rule: ($) => dune_field($, 'mode', $._rule_mode),
    _sf_target: ($) => dune_field($, 'target', $._atom_or_qs),
    _sf_targets: ($) => dune_field($, 'targets', repeat($._target)),
    _sf_fallback: ($) => dune_field($, 'fallback', optional($.bool)),
    _sf_locks: ($) => dune_field($, 'locks', repeat1($.lock_name)),
    _sf_only_sources: ($) => dune_field($, 'only_sources', $.blang),
    _sf_applies_to: ($) => dune_field($, 'applies_to', repeat($._atom_or_qs)),
    _sf_merge_into: ($) => dune_field($, 'merge_into', $.module_name),
    _sf_infer: ($) => dune_field($, 'infer', $.bool),
    _sf_explain: ($) => dune_field($, 'explain', $.blang),
    _sf_archive_name: ($) => dune_field($, 'archive_name', $._atom_or_qs),
    _sf_language: ($) => dune_field($, 'language', $._atom_or_qs),
    _sf_include_dirs: ($) => dune_field($, 'include_dirs', repeat($._atom_or_qs)),
    _sf_optional: ($) => dune_field($, 'optional', $.bool),
    _sf_site: ($) => dune_field($, 'site', wrap($.package_name, $._atom_or_qs)),
    _sf_packages: ($) => dune_field($, 'packages', repeat($.package_name)),
    _sf_preludes: ($) => dune_field($, 'preludes', repeat($.file_name)),
    _sf_theories: ($) => dune_field($, 'theories', repeat($._atom_or_qs)),
    _sf_plugins: ($) => dune_field($, 'plugins', repeat($._atom_or_qs)),
    _sf_depends: ($) => dune_field($, 'depends', repeat1($.package_dep)),
    _sf_conflicts: ($) => dune_field($, 'conflicts', repeat1($.package_dep)),
    _sf_depopts: ($) => dune_field($, 'depopts', repeat1($.package_dep)),
    _sf_tags: ($) => dune_field($, 'tags', wrap(repeat($.tag_name))),
    _sf_deprecated_package_names: ($) => dune_field($, 'deprecated_package_names', repeat1($.package_name)),
    _sf_allow_empty: ($) => dune_field($, 'allow_empty', $.bool),
    _sf_promote: ($) => dune_field($, 'promote', $._rule_mode_promote_field),
    _sf_promote_into: ($) => dune_field($, 'promote-into', $.file_name),
    _sf_only: ($) => dune_field($, 'only', $._atom_or_qs),
    _sf_into: ($) => dune_field($, 'into', $.file_name),
    library_name: ($) => $._atom_or_qs,
    public_name: ($) => $._atom_or_qs,
    module_name: ($) => $._atom_or_qs,
    file_name: ($) => $._atom_or_qs,
    file_name_dep: ($) => $.file_name,
    file_name_target: ($) => $.file_name,
    package_name: ($) => $._atom_or_qs,
    tag_name: ($) => $._atom_or_qs,
    lock_name: ($) => $._atom_or_qs,
    shell_command: ($) => $._atom_or_qs,
    _stanza_rule: ($) =>
      dune_stanza(
        $,
        'rule',
        choice(
          $.action,
          alias($._sf_mode_rule, $.stanza_field),
          alias($._sf_target, $.stanza_field),
          alias($._sf_targets, $.stanza_field),
          $._deps_field,
          alias($._sf_action, $.stanza_field),
          alias($._sf_enabled_if, $.stanza_field),
          alias($._sf_alias_list, $.stanza_field),
          alias($._sf_package, $.stanza_field),
          alias($._sf_fallback, $.stanza_field),
          alias($._sf_locks, $.stanza_field),
        ),
      ),
    _deps_field: ($) => alias($._sf_deps, $.stanza_field),
    _dep: ($) =>
      choice(
        wrap($.named_variable, repeat1($._dep)),
        wrap('universe'),
        wrap('sandbox', $._atom_or_qs),
        wrap('env_var', $._atom_or_qs),
        wrap(choice('alias', 'alias_rec'), $.alias_name),
        wrap('source_tree', $.file_name),
        wrap('package', $.package_name),
        wrap('glob_files', repeat1($._atom_or_qs)),
        $.file_name,
      ),
    _target: ($) => choice($.file_name_target, wrap('dir', $.file_name_target)),
    bool: ($) => choice('true', 'false'),
    _rule_mode: ($) =>
      choice(
        'fallback',
        'promote',
        alias($._sf_promote, $.stanza_field),
        alias($._sf_promote_into, $.stanza_field),
      ),
    _rule_mode_promote_field: ($) =>
      choice(
        alias($._sf_only, $.stanza_field),
        alias($._sf_into, $.stanza_field),
      ),
    blang: ($) => choice($._atom_or_qs, wrap($.blang_op, repeat1($.blang))),
    blang_op: ($) => choice('=', '<>', '>', '<', '>=', '<=', 'or', 'and'),
    field_name: ($) => $._atom_or_qs,
    alias_name: ($) => $._atom_or_qs,
    action: ($) =>
      choice(
        dune_action($, 'bash', $.shell_command),
        dune_action($, 'cat', $.file_name_dep),
        dune_action($, 'cmp', seq($.file_name_dep, $.file_name_dep)),
        dune_action($, 'chdir', seq($.file_name, $.action)),
        dune_action($, 'copy', seq($.file_name_dep, $.file_name_target)),
        dune_action($, 'copy#', seq($.file_name_dep, $.file_name_target)),
        dune_action($, 'diff', seq($.file_name_dep, $.file_name_dep)),
        dune_action($, 'diff?', seq($.file_name_dep, $.file_name_dep)),
        dune_action($, 'echo', repeat1($._atom_or_qs)),
        dune_action($, 'ignore-stdout', $.action),
        dune_action($, 'no-infer', $.action),
        dune_action($, 'pipe-outputs', repeat1($.action)),
        dune_action($, 'progn', repeat($.action)),
        dune_action($, 'run', seq($.file_name_dep, repeat($._atom_or_qs))),
        dune_action($, 'setenv', seq($._atom_or_qs, $._atom_or_qs, $.action)),
        dune_action($, 'system', $.shell_command),
        dune_action(
          $,
          'with-accepted-exit-codes',
          seq($._atom_or_qs, $.action),
        ),
        dune_action($, 'with-outputs-to', seq($.file_name_target, $.action)),
        dune_action($, 'with-stderr-to', seq($.file_name_target, $.action)),
        dune_action($, 'with-stdout-to', seq($.file_name_target, $.action)),
        dune_action($, 'write-file', seq($.file_name_target, $._atom_or_qs)),
      ),
    _stanza_library: ($) =>
      dune_stanza(
        $,
        'library',
        choice(
          $._field_buildable,
          alias($._sf_synopsis, $.stanza_field),
          alias($._sf_instrumentation, $.stanza_field),
          alias($._sf_wrapped, $.stanza_field),
          alias($._sf_kind, $.stanza_field),
          alias($._sf_ppx_driver, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_toplevel: ($) =>
      dune_stanza(
        $,
        'toplevel',
        choice(
          alias($._sf_name_module, $.stanza_field),
          alias($._sf_libraries, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_install: ($) =>
      dune_stanza(
        $,
        'install',
        choice(
          alias($._sf_section, $.stanza_field),
          alias($._sf_files_sexp, $.stanza_field),
          alias($._sf_dirs_sexp, $.stanza_field),
          alias($._sf_package, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_cram: ($) =>
      dune_stanza(
        $,
        'cram',
        choice(
          alias($._sf_applies_to, $.stanza_field),
          $._deps_field,
          $.sexp,
        ),
      ),
    _stanza_env: ($) =>
      dune_stanza($, 'env', $.sexp),
    // dune-project stanzas
    _stanza_lang: ($) =>
      wrap(
        alias('lang', $.stanza_name),
        field('language', $._atom_or_qs),
        field('version', $._atom_or_qs),
      ),
    _stanza_name: ($) =>
      wrap(alias('name', $.stanza_name), field('project_name', $._atom_or_qs)),
    _stanza_version: ($) =>
      wrap(alias('version', $.stanza_name), field('version', $._atom_or_qs)),
    _stanza_generate_opam_files: ($) =>
      wrap(alias('generate_opam_files', $.stanza_name), field('enabled', $.bool)),
    _stanza_source: ($) =>
      wrap(
        alias('source', $.stanza_name),
        choice(
          wrap('github', field('repo', $._atom_or_qs)),
          wrap('git', field('url', $._atom_or_qs)),
          wrap('uri', field('url', $._atom_or_qs)),
        ),
      ),
    _stanza_authors: ($) =>
      wrap(alias('authors', $.stanza_name), repeat1(field('author', $._atom_or_qs))),
    _stanza_maintainers: ($) =>
      wrap(alias('maintainers', $.stanza_name), repeat1(field('maintainer', $._atom_or_qs))),
    _stanza_license: ($) =>
      wrap(alias('license', $.stanza_name), field('license', $._atom_or_qs)),
    _stanza_homepage: ($) =>
      wrap(alias('homepage', $.stanza_name), field('url', $._atom_or_qs)),
    _stanza_documentation_url: ($) =>
      prec(1, wrap(alias('documentation', $.stanza_name), field('url', $._atom_or_qs))),
    _stanza_bug_reports: ($) =>
      wrap(alias('bug_reports', $.stanza_name), field('url', $._atom_or_qs)),
    _stanza_using: ($) =>
      wrap(
        alias('using', $.stanza_name),
        field('extension', $._atom_or_qs),
        field('version', $._atom_or_qs),
      ),
    _stanza_formatting: ($) =>
      wrap(
        alias('formatting', $.stanza_name),
        choice(
          $._atom_or_qs, // disabled, ocamlformat, etc.
          wrap('enabled_for', repeat1($._atom_or_qs)),
        ),
      ),
    _stanza_dialect: ($) =>
      wrap(alias('dialect', $.stanza_name), repeat($.sexp)),
    _stanza_explicit_js_mode: ($) =>
      wrap(alias('explicit_js_mode', $.stanza_name)),
    _stanza_cram_project: ($) =>
      wrap(alias('cram', $.stanza_name), field('enable', $._atom_or_qs)),
    _stanza_package: ($) =>
      wrap(
        alias('package', $.stanza_name),
        repeat(
          choice(
            alias($._sf_name_package, $.stanza_field),
            alias($._sf_synopsis, $.stanza_field),
            alias($._sf_description, $.stanza_field),
            alias($._sf_depends, $.stanza_field),
            alias($._sf_conflicts, $.stanza_field),
            alias($._sf_depopts, $.stanza_field),
            alias($._sf_tags, $.stanza_field),
            alias($._sf_deprecated_package_names, $.stanza_field),
            alias($._sf_sites, $.stanza_field),
            alias($._sf_allow_empty, $.stanza_field),
            $.sexp,
          ),
        ),
      ),
    package_dep: ($) =>
      choice(
        $.package_name,
        wrap($.package_name, repeat1($.version_constraint)),
      ),
    version_constraint: ($) =>
      choice(
        wrap('=', $._atom_or_qs),
        wrap('>=', $._atom_or_qs),
        wrap('>', $._atom_or_qs),
        wrap('<=', $._atom_or_qs),
        wrap('<', $._atom_or_qs),
        wrap('<>', $._atom_or_qs),
        wrap('and', repeat1($.version_constraint)),
        wrap('or', repeat1($.version_constraint)),
        $._atom_or_qs, // for :dev, :with-test, etc.
      ),
    // dune-workspace stanzas
    _stanza_context: ($) =>
      wrap(
        alias('context', $.stanza_name),
        choice(
          'default',
          $._context_opam,
        ),
      ),
    _context_opam: ($) =>
      wrap(
        'opam',
        repeat(
          choice(
            wrap('switch', field('switch', $._atom_or_qs)),
            wrap('name', field('context_name', $._atom_or_qs)),
            wrap('profile', field('profile', $._atom_or_qs)),
            wrap('toolchain', field('toolchain', $._atom_or_qs)),
            wrap('host', field('host_context', $._atom_or_qs)),
            wrap('target', field('target_triple', $._atom_or_qs)),
            wrap('merlin'),
            wrap('generate_merlin_rules'),
            wrap('disable_dynamically_linked_foreign_archives', $.bool),
            wrap('root', field('opam_root', $._atom_or_qs)),
            wrap('lock_dir', field('lock_dir', $._atom_or_qs)),
            wrap('paths', repeat($.sexp)),
            wrap('env', repeat($.sexp)),
            wrap('fdo', field('target_exe', $._atom_or_qs)),
            wrap('targets', repeat($._atom_or_qs)),
            $.sexp,
          ),
        ),
      ),
    _stanza_profile: ($) =>
      wrap(alias('profile', $.stanza_name), field('profile_name', $._atom_or_qs)),
    // Additional dune stanzas
    _stanza_copy_files: ($) =>
      dune_stanza(
        $,
        'copy_files',
        choice(
          alias($._sf_files_file, $.stanza_field),
          alias($._sf_alias_single, $.stanza_field),
          alias($._sf_mode_rule, $.stanza_field),
          alias($._sf_enabled_if, $.stanza_field),
          alias($._sf_only_sources, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_menhir: ($) =>
      dune_stanza(
        $,
        'menhir',
        choice(
          alias($._sf_modules_list1, $.stanza_field),
          alias($._sf_merge_into, $.stanza_field),
          alias($._sf_flags, $.stanza_field),
          alias($._sf_infer, $.stanza_field),
          alias($._sf_explain, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_include: ($) =>
      wrap(alias('include', $.stanza_name), $.file_name),
    _stanza_foreign_library: ($) =>
      dune_stanza(
        $,
        'foreign_library',
        choice(
          alias($._sf_archive_name, $.stanza_field),
          alias($._sf_language, $.stanza_field),
          alias($._sf_names_atom, $.stanza_field),
          alias($._sf_flags, $.stanza_field),
          alias($._sf_include_dirs, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_plugin: ($) =>
      dune_stanza(
        $,
        'plugin',
        choice(
          alias($._sf_name_module, $.stanza_field),
          alias($._sf_libraries, $.stanza_field),
          alias($._sf_optional, $.stanza_field),
          alias($._sf_site, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_mdx: ($) =>
      dune_stanza(
        $,
        'mdx',
        choice(
          alias($._sf_files_filelist, $.stanza_field),
          alias($._sf_packages, $.stanza_field),
          $._deps_field,
          alias($._sf_preludes, $.stanza_field),
          $.sexp,
        ),
      ),
    _stanza_coq_theory: ($) =>
      wrap(
        alias('coq.theory', $.stanza_name),
        repeat(choice(
          alias($._sf_name_atom, $.stanza_field),
          alias($._sf_theories, $.stanza_field),
          alias($._sf_modules_list, $.stanza_field),
          alias($._sf_plugins, $.stanza_field),
          $.sexp,
        )),
      ),
    _stanza_deprecated_library_name: ($) =>
      wrap(
        alias('deprecated_library_name', $.stanza_name),
        seq(
          field('old_name', $.library_name),
          field('new_name', $.library_name),
        ),
      ),
    _stanza_ignored_subdirs: ($) =>
      wrap(alias('ignored_subdirs', $.stanza_name), repeat1($.file_name)),
    // Additional dune-project stanzas
    _stanza_pin: ($) =>
      wrap(
        alias('pin', $.stanza_name),
        repeat(wrap($.package_name, $._atom_or_qs)),
      ),
    _stanza_warnings: ($) =>
      wrap(alias('warnings', $.stanza_name), $._atom_or_qs),
    _stanza_accept_alternative_dune_file_name: ($) =>
      wrap(alias('accept_alternative_dune_file_name', $.stanza_name)),
    _stanza_executables_implicit_empty_intf: ($) =>
      wrap(alias('executables_implicit_empty_intf', $.stanza_name)),
    _stanza_expand_aliases_in_sandbox: ($) =>
      wrap(alias('expand_aliases_in_sandbox', $.stanza_name)),
    _stanza_implicit_transitive_deps: ($) =>
      wrap(alias('implicit_transitive_deps', $.stanza_name), optional($.bool)),
    _stanza_map_workspace_root: ($) =>
      wrap(alias('map_workspace_root', $.stanza_name), optional($.bool)),
    _stanza_opam_file_location: ($) =>
      wrap(alias('opam_file_location', $.stanza_name), $._atom_or_qs),
    _stanza_subst: ($) =>
      wrap(alias('subst', $.stanza_name)),
    _stanza_use_standard_c_and_cxx_flags: ($) =>
      wrap(alias('use_standard_c_and_cxx_flags', $.stanza_name), optional($.bool)),
    _stanza_wrapped_executables: ($) =>
      wrap(alias('wrapped_executables', $.stanza_name), optional($.bool)),
    _stanza_maintenance_intent: ($) =>
      wrap(alias('maintenance_intent', $.stanza_name), $._atom_or_qs),
    // Additional dune-workspace stanzas (note: env is shared with dune files)
    _stanza_config: ($) =>
      wrap(alias('config', $.stanza_name), repeat($.sexp)),
    _stanza_lock_dir: ($) =>
      wrap(alias('lock_dir', $.stanza_name), field('path', $._atom_or_qs)),
    _stanza_repository: ($) =>
      wrap(alias('repository', $.stanza_name), repeat($.sexp)),
  },
});
