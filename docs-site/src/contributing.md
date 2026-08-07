# Contributing to ALP

Thank you for your interest in contributing to the Autonomous Lifecycle Protocol! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to abide by the [Contributor Covenant Code of Conduct](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/blob/main/CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. Check the [existing issues](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/issues) to avoid duplicates
2. Collect relevant information (version, OS, steps to reproduce)

Create a bug report with:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- ALP version (`alp --version`)
- OS and Node.js version

### Suggesting Features

Feature requests are welcome! Please:

1. Check [existing issues](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/issues) and [discussions](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/discussions)
2. Describe the problem you're solving
3. Propose a solution with examples
4. Consider backward compatibility

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit with a clear message (`git commit -m "feat: add my feature"`)
6. Push to your fork (`git push origin feature/my-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

- Node.js 24+ and npm 10+
- Git
- A code editor (VS Code recommended)

### Clone and Install

```bash
git clone https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP.git
cd Autonomous-Lifecycle-Protocol-ALP
npm ci
```

### Build

```bash
# Build all workspaces
npm run build

# Build specific workspace
npm run build --workspace @autonomous-lifecycle-protocol-alp/parser
npm run build --workspace @autonomous-lifecycle-protocol-alp/cli
npm run build --workspace @autonomous-lifecycle-protocol-alp/sdk
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm test --workspace @autonomous-lifecycle-protocol-alp/parser
npm test --workspace @autonomous-lifecycle-protocol-alp/cli
```

## Project Structure

```
Autonomous-Lifecycle-Protocol-ALP/
├── parser/                  # TypeScript ALP parser
│   ├── src/
│   │   ├── parser.ts
│   │   ├── graph.ts
│   │   ├── loop.ts
│   │   └── ...
│   └── tests/
├── cli/                     # CLI tool
│   ├── src/
│   │   ├── commands/
│   │   └── index.ts
│   └── tests/
├── sdk/
│   ├── typescript/          # TypeScript SDK
│   ├── python/              # Python SDK
│   ├── java/                # Java SDK
│   ├── rust/                # Rust SDK
│   └── go/                  # Go SDK
├── mcp-server/              # MCP server
├── docs-site/               # Documentation
├── integrations/            # IDE integrations
│   ├── claude-code/
│   ├── cursor/
│   └── github/
└── sham/                    # SHAM IDE
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Follow [Effective TypeScript](https://effectivetypescript.com/) patterns
- Write tests for all new features
- Use meaningful variable and function names

### Python

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints
- Write tests using pytest
- Use docstrings for public APIs

### General

- Write clear, self-documenting code
- Add comments only when necessary
- Keep functions small and focused
- Use descriptive commit messages

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(parser): add support for @timeline objects
fix(cli): resolve race condition in LockManager
docs(spec): update versioning section for v80.0.0
test(sdk): add integration tests for Go SDK
```

## Testing

All contributions must include tests:

```bash
# Run parser tests
npm test --workspace @autonomous-lifecycle-protocol-alp/parser

# Run CLI tests
npm test --workspace @autonomous-lifecycle-protocol-alp/cli

# Run Python SDK tests
cd sdk/python && pytest

# Run Go SDK tests
cd sdk/go && go test -v ./...
```

## Documentation

- Update `docs-site/src/` for user-facing changes
- Update JSDoc/docstrings for API changes
- Add examples for new features
- Update the changelog if applicable

## Release Process

Releases are tagged with semantic versions:

1. Update version numbers in `package.json` files
2. Update `docs-site/src/releases.md`
3. Create a git tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
4. Push the tag: `git push origin vX.Y.Z`
5. The publish workflow will handle the rest

## Getting Help

- <Icon name="book" /> Read the [documentation](/)
- <Icon name="message-circle" /> Join [GitHub Discussions](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/discussions)
- <Icon name="bug" /> Report issues in [GitHub Issues](https://github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/issues)
- <Icon name="mail" /> Reach out to maintainers via GitHub

## Recognition

Contributors are recognized in:
- Release notes
- The documentation
- GitHub contributors graph

Thank you for contributing to ALP!
