/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const wrap = (...a) => seq('(', ...a, ')');

const dune_stanza = ($, name, field_parser) =>
  wrap(alias(name, $.stanza_name), repeat(field_parser));

const dune_field = ($, name, value) => wrap(alias(name, $.field_name), field('value', value));

const dune_osl = (element, self) =>
  choice(repeat1(element), wrap(optional(self)));

const dune_action = ($, name, value) => wrap(alias(name, $.action_name), field('arguments', value));

const PREC = {COMMENT: 0, STRING: 1};

const atom_regexp = /[^;()"\s]+/;

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
    _atom: ($) => atom_regexp,
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
      choice($.module_name, dune_field($, 'modules', repeat($.module_name))),
    _stanza_alias: ($) =>
      dune_stanza(
        $,
        'alias',
        choice(
          dune_field($, 'name', field('alias_name', $.alias_name)),
          dune_field($, 'action', field('action', $.action)),
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
    _sf_build_if: ($) =>
      wrap(alias('build_if', $.field_name), field('value', $.blang)),
    _sf_action: ($) =>
      wrap(alias('action', $.field_name), field('value', $.action)),
    _field_test: ($) =>
      choice(
        alias($._sf_build_if, $.stanza_field),
        alias($._sf_action, $.stanza_field),
      ),
    _sf_names: ($) =>
      wrap(alias('names', $.field_name), field('value', repeat1($.module_name))),
    _sf_public_names: ($) =>
      wrap(alias('public_names', $.field_name), field('value', repeat1($.public_name))),
    _field_buildable_multi: ($) =>
      choice(
        alias($._sf_names, $.stanza_field),
        alias($._sf_public_names, $.stanza_field),
        alias($._sf_libraries, $.stanza_field),
        alias($._sf_modules, $.stanza_field),
        alias($._sf_enabled_if, $.stanza_field),
      ),
    // stanza_field is the named wrapper node type for field-value
    // pairs.  Concrete fields are hidden rules aliased to this type.
    stanza_field: ($) =>
      wrap(field('name', $.field_name), field('value', repeat($.sexp))),
    _sf_name: ($) =>
      wrap(alias('name', $.field_name), field('value', $.module_name)),
    _sf_public_name: ($) =>
      wrap(alias('public_name', $.field_name), field('value', $.public_name)),
    _sf_libraries: ($) =>
      wrap(alias('libraries', $.field_name), field('value', repeat($._lib_dep))),
    _sf_modules: ($) =>
      wrap(alias('modules', $.field_name), field('value', optional($._modules_osl))),
    _sf_enabled_if: ($) =>
      wrap(alias('enabled_if', $.field_name), field('value', $.blang)),
    _field_buildable: ($) =>
      choice(
        alias($._sf_name, $.stanza_field),
        alias($._sf_public_name, $.stanza_field),
        alias($._sf_libraries, $.stanza_field),
        alias($._sf_modules, $.stanza_field),
        alias($._sf_enabled_if, $.stanza_field),
      ),
    _modules_osl: ($) => dune_osl($.module_name, $._modules_osl),
    _sf_re_export: ($) =>
      wrap(alias('re_export', $.field_name), field('value', $.library_name)),
    _sf_select: ($) =>
      wrap(alias('select', $.field_name), field('value', $.sexps1)),
    _lib_dep: ($) =>
      choice(
        $.library_name,
        alias($._sf_re_export, $.stanza_field),
        alias($._sf_select, $.stanza_field),
      ),
    library_name: ($) => $._atom_or_qs,
    public_name: ($) => $._atom_or_qs,
    module_name: ($) => $._atom_or_qs,
    file_name: ($) => $._atom_or_qs,
    file_name_dep: ($) => $.file_name,
    file_name_target: ($) => $.file_name,
    package_name: ($) => $._atom_or_qs,
    lock_name: ($) => $._atom_or_qs,
    shell_command: ($) => $._atom_or_qs,
    _stanza_rule: ($) =>
      dune_stanza(
        $,
        'rule',
        choice(
          $.action,
          dune_field($, 'mode', $._rule_mode),
          dune_field($, 'target', $._atom_or_qs),
          dune_field($, 'targets', repeat($._target)),
          $._deps_field,
          dune_field($, 'action', $.action),
          dune_field($, 'enabled_if', $.blang),
          dune_field($, 'alias', repeat1($.alias_name)),
          dune_field($, 'package', $.package_name),
          dune_field($, 'fallback', optional($.bool)),
          dune_field($, 'locks', repeat1($.lock_name)),
        ),
      ),
    _deps_field: ($) => dune_field($, 'deps', repeat1($._dep)),
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
        dune_field($, 'promote', $._rule_mode_promote_field),
        dune_field($, 'promote-into', $.file_name),
      ),
    _rule_mode_promote_field: ($) =>
      choice(
        dune_field($, 'only', $._atom_or_qs),
        dune_field($, 'into', $.file_name),
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
          dune_field($, 'synopsis', $._atom_or_qs),
          dune_field($, 'instrumentation', $.sexp),
          dune_field(
            $,
            'wrapped',
            choice(
              optional($.bool),
              dune_field($, 'transition', $._atom_or_qs),
            ),
          ),
          dune_field($, 'kind', $.sexp),
          dune_field($, 'ppx.driver', $.sexps1),
          $.sexp,
        ),
      ),
    _stanza_toplevel: ($) =>
      dune_stanza(
        $,
        'toplevel',
        choice(
          dune_field($, 'name', $.module_name),
          dune_field($, 'libraries', repeat($._lib_dep)),
          $.sexp,
        ),
      ),
    _stanza_install: ($) =>
      dune_stanza(
        $,
        'install',
        choice(
          dune_field($, 'section', $._atom_or_qs),
          dune_field($, 'files', repeat($.sexp)),
          dune_field($, 'dirs', repeat($.sexp)),
          dune_field($, 'package', $.package_name),
          $.sexp,
        ),
      ),
    _stanza_cram: ($) =>
      dune_stanza(
        $,
        'cram',
        choice(
          dune_field($, 'applies_to', repeat($._atom_or_qs)),
          dune_field($, 'deps', repeat1($._dep)),
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
            dune_field($, 'name', $.package_name),
            dune_field($, 'synopsis', $._atom_or_qs),
            dune_field($, 'description', $._atom_or_qs),
            dune_field($, 'depends', repeat1($.package_dep)),
            dune_field($, 'conflicts', repeat1($.package_dep)),
            dune_field($, 'depopts', repeat1($.package_dep)),
            dune_field($, 'tags', repeat1($._atom_or_qs)),
            dune_field($, 'deprecated_package_names', repeat1($.package_name)),
            dune_field($, 'sites', repeat($.sexp)),
            dune_field($, 'allow_empty', $.bool),
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
          dune_field($, 'files', $.file_name),
          dune_field($, 'alias', $.alias_name),
          dune_field($, 'mode', $._rule_mode),
          dune_field($, 'enabled_if', $.blang),
          dune_field($, 'only_sources', $.blang),
          $.sexp,
        ),
      ),
    _stanza_menhir: ($) =>
      dune_stanza(
        $,
        'menhir',
        choice(
          dune_field($, 'modules', repeat1($.module_name)),
          dune_field($, 'merge_into', $.module_name),
          dune_field($, 'flags', repeat($._atom_or_qs)),
          dune_field($, 'infer', $.bool),
          dune_field($, 'explain', $.blang),
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
          dune_field($, 'archive_name', $._atom_or_qs),
          dune_field($, 'language', $._atom_or_qs),
          dune_field($, 'names', repeat1($._atom_or_qs)),
          dune_field($, 'flags', repeat($._atom_or_qs)),
          dune_field($, 'include_dirs', repeat($._atom_or_qs)),
          $.sexp,
        ),
      ),
    _stanza_plugin: ($) =>
      dune_stanza(
        $,
        'plugin',
        choice(
          dune_field($, 'name', $.module_name),
          dune_field($, 'libraries', repeat($._lib_dep)),
          dune_field($, 'optional', $.bool),
          dune_field($, 'site', wrap($.package_name, $._atom_or_qs)),
          $.sexp,
        ),
      ),
    _stanza_mdx: ($) =>
      dune_stanza(
        $,
        'mdx',
        choice(
          dune_field($, 'files', repeat($.file_name)),
          dune_field($, 'packages', repeat($.package_name)),
          dune_field($, 'deps', repeat1($._dep)),
          dune_field($, 'preludes', repeat($.file_name)),
          $.sexp,
        ),
      ),
    _stanza_coq_theory: ($) =>
      wrap(
        alias('coq.theory', $.stanza_name),
        repeat(choice(
          dune_field($, 'name', $._atom_or_qs),
          dune_field($, 'theories', repeat($._atom_or_qs)),
          dune_field($, 'modules', repeat($.module_name)),
          dune_field($, 'plugins', repeat($._atom_or_qs)),
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
