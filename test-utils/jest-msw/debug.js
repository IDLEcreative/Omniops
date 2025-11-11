export function configureMswDebug() {
  if (process.env.MSW_DEBUG === 'true') {
    return;
  }

  process.env.DEBUG = undefined;
  process.env.NODE_DEBUG = undefined;
}
