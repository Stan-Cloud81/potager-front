# Contributing to Potager

Thank you for your interest in contributing to Potager! This document provides guidelines and instructions for contributing.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** explaining why this enhancement would be useful
- **Possible implementation** if you have ideas

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## Development Setup

1. Clone your fork:
```bash
git clone https://github.com/your-username/potager-front.git
cd potager-front
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types when possible
- Define proper interfaces and types in `src/types/`

### React

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and variable names
- Extract reusable logic into custom hooks

### Styling

- Use Tailwind CSS for styling
- Follow existing patterns for consistency
- Keep styles responsive (mobile-first approach)

### Code Formatting

- Run linter before committing:
```bash
npm run lint
```

### Commit Messages

Follow conventional commits format:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(plants): add search functionality
fix(auth): resolve token refresh issue
docs(readme): update deployment instructions
```

## Project Structure

```
/src
  /api          - API client functions
  /components   - Reusable UI components
  /contexts     - React contexts
  /hooks        - Custom React hooks
  /pages        - Page components
  /types        - TypeScript type definitions
  /utils        - Utility functions
```

## Testing

Before submitting a PR:

1. Test your changes locally
2. Ensure the build passes:
```bash
npm run build
```

3. Check for TypeScript errors:
```bash
npm run build
```

## Questions?

Feel free to open an issue with the `question` label if you have any questions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
