FROM node:24-alpine

WORKDIR /app

RUN corepack enable

# @playwright/test is a devDependency (e2e runs from the host against this
# container's published port — browser binaries need glibc, this image is
# musl). Skip downloading Chromium/Firefox/WebKit here, they'd never run.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# pnpm's own startup dep-status check (run before every `pnpm exec`/`next
# dev`) tries an interactive confirm-before-reinstall prompt whenever
# package.json changes without the node_modules volume being rebuilt — this
# container never has a TTY to answer it. CI=true is pnpm's own documented
# fix (see the [ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY] error text):
# skip the prompt and just reinstall non-interactively.
ENV CI=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare --activate && pnpm install --frozen-lockfile

COPY . .

USER node

EXPOSE 3000

CMD ["pnpm", "dev"]
