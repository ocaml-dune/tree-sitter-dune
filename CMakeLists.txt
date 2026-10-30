cmake_minimum_required(VERSION 3.13)

project(tree-sitter-dune
        VERSION "0.1.0"
        DESCRIPTION "Tree-sitter grammar for Dune build system files"
        HOMEPAGE_URL "https://github.com/ocaml-dune/tree-sitter-dune"
        LANGUAGES C)

if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

option(BUILD_SHARED_LIBS "Build shared libraries" ON)
option(TREE_SITTER_FEATURE_WASM "Enable WebAssembly build" OFF)

set(TREE_SITTER_DUNE_SRC
    src/parser.c
)

add_library(tree-sitter-dune ${TREE_SITTER_DUNE_SRC})

target_include_directories(tree-sitter-dune
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src>
    $<INSTALL_INTERFACE:include/tree_sitter>
)

set_target_properties(tree-sitter-dune
  PROPERTIES
    C_VISIBILITY_PRESET hidden
    POSITION_INDEPENDENT_CODE ON
    SOVERSION 0
    VERSION "0.1.0"
)

if(WIN32)
  set_target_properties(tree-sitter-dune PROPERTIES
    OUTPUT_NAME tree-sitter-dune
    PREFIX ""
  )
endif()

# Installation
include(GNUInstallDirs)

install(TARGETS tree-sitter-dune
        LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
        ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
)

install(FILES bindings/c/tree-sitter-dune.h
        DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}/tree_sitter
)

install(FILES bindings/c/tree-sitter-dune.pc
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig
)

# Export targets
install(EXPORT tree-sitter-dune-targets
        FILE tree-sitter-dune-targets.cmake
        NAMESPACE tree-sitter::
        DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/tree-sitter-dune
)

# Generate and install CMake package configuration
include(CMakePackageConfigHelpers)
configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/tree-sitter-dune-config.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-dune-config.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/tree-sitter-dune
    NO_SET_AND_CHECK_MACRO
    NO_CHECK_REQUIRED_COMPONENTS_MACRO
)
write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-dune-config-version.cmake
    VERSION "0.1.0"
    COMPATIBILITY SameMajorVersion
)

install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-dune-config.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/tree-sitter-dune-config-version.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/tree-sitter-dune
)
