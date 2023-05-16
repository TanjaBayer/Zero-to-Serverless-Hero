import { join, resolve } from 'path';

export function getWorkspaceRoot() {
  return resolve(join(__dirname, `../../../../`));
}
