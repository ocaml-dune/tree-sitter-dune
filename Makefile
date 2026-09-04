.PHONY: all install test generate clean abi-version cli-version

# Detect OS for platform-specific settings
UNAME := $(shell uname)
PREFIX ?= /usr/local
PARSER_URL := tree_sitter_dune
TS_ABI_VERSION := 14
TS_CLI_VERSION := v0.27.0

# Installation directories
INCLUDEDIR := $(PREFIX)/include/tree_sitter
LIBDIR := $(PREFIX)/lib
PCDIR := $(LIBDIR)/pkgconfig

# Compiler settings
CC ?= gcc
CXX ?= g++
CFLAGS ?= -O3 -Wall -Wextra -Isrc
CXXFLAGS ?= -O3 -Wall -Wextra -Isrc -std=c++20

# Source files
SRC := src/parser.c
OBJ := $(SRC:.c=.o)

# Library settings
ifeq ($(UNAME), Darwin)
	SOEXT := dylib
	SOEXTVER := $(SOEXT)
	LINKSHARED := -dynamiclib -Wl,-install_name,$(LIBDIR)/libtree-sitter-dune.$(SOEXT) -Wl,-rpath,@executable_path/../Frameworks
else ifeq ($(UNAME), Linux)
	SOEXT := so
	SOEXTVER := $(SOEXT).0
	LINKSHARED := -shared -Wl,-soname,libtree-sitter-dune.$(SOEXT)
else
	SOEXT := so
	SOEXTVER := $(SOEXT)
	LINKSHARED := -shared
endif

LIBRARY := libtree-sitter-dune.$(SOEXT)
LIBRARY_VERSIONED := libtree-sitter-dune.$(SOEXTVER)

# Default target
all: $(LIBRARY)

# Build shared library
$(LIBRARY): $(SRC)
	$(CC) $(CFLAGS) $(LINKSHARED) $< -o $@
ifeq ($(SOEXTVER), $(SOEXT).0)
	ln -sf $@ libtree-sitter-dune.$(SOEXT)
endif

# Object files
%.o: %.c
	$(CC) $(CFLAGS) -fPIC -c $< -o $@

# Generate parser from grammar
generate:
	tree-sitter generate --abi $(TS_ABI_VERSION)

abi-version:
	@echo $(TS_ABI_VERSION)

cli-version:
	@echo $(TS_CLI_VERSION)

# Install library and headers
install: all
	install -d '$(DESTDIR)$(INCLUDEDIR)' '$(DESTDIR)$(LIBDIR)' '$(DESTDIR)$(PCDIR)'
	install -m755 $(LIBRARY) '$(DESTDIR)$(LIBDIR)'/$(LIBRARY_VERSIONED)
	install -m644 bindings/c/tree-sitter-dune.h '$(DESTDIR)$(INCLUDEDIR)'/tree-sitter-dune.h
	install -m644 bindings/c/tree-sitter-dune.pc '$(DESTDIR)$(PCDIR)'/tree-sitter-dune.pc
ifeq ($(SOEXTVER), $(SOEXT).0)
	cd '$(DESTDIR)$(LIBDIR)' && ln -sf $(LIBRARY_VERSIONED) $(LIBRARY)
endif

# Uninstall
uninstall:
	rm -f '$(DESTDIR)$(LIBDIR)'/libtree-sitter-dune.*
	rm -f '$(DESTDIR)$(INCLUDEDIR)'/tree-sitter-dune.h
	rm -f '$(DESTDIR)$(PCDIR)'/tree-sitter-dune.pc

# Run tests
test:
	tree-sitter test

# Clean build artifacts
clean:
	rm -f $(OBJ) $(LIBRARY) libtree-sitter-dune.$(SOEXT) libtree-sitter-dune.$(SOEXT).0
	rm -rf build/
