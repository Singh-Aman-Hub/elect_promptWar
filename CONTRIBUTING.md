# Contributing to ElectVoice

Thank you for your interest in contributing to ElectVoice! We welcome contributions from the community to help make election education more accessible in India.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ElectVoice.git
   cd ElectVoice
   ```
3. **Install dependencies** for both the client and the server:
   ```bash
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   ```

## Environment Setup

Before running the application, you need to set up your environment variables:

1. In both the `client` and `server` directories, copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open the `.env` files and fill in the required API keys (Gemini API, Google Maps API, Custom Search API, etc.).

## Development Workflow

1. Create a **feature branch** for your changes:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. We use **Conventional Commits** for our commit messages. Please follow this format:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `style:` for formatting/UI changes
   - `refactor:` for code restructuring
   - `test:` for adding or updating tests

   Example: `feat: add support for regional language translation`

## Code Standards

We use **ESLint** and **Prettier** to maintain code quality and consistency. 
- Ensure your editor is configured to use the project's configuration.
- Run the linter before pushing your code:
  ```bash
  cd client && npm run lint
  ```

## Testing

Please ensure that your changes do not break existing functionality by running the tests:

- **Frontend Tests**:
  ```bash
  cd client && npm test
  ```
- **Backend Tests**:
  ```bash
  cd server && npm test
  ```

## Pull Request Process

1. **Describe your changes** in detail in the PR description.
2. **Link any related issues** if applicable.
3. Ensure all tests pass and there are no linting errors.
4. Once your PR is submitted, it will be reviewed by the maintainers. We may ask for changes or clarifications before merging.

Thank you for contributing!
