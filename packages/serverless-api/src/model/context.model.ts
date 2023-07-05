export class Context {
  clientId: string;
  clientIp: string;
  authToken: string;
  // from auth.checker.ts
  userId?: string;
}
