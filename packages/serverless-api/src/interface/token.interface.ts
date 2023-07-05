export interface Token {
  sub: string;
  event_id: string;
  token_use: 'access';
  scope: string;
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
  jti: string;
  client_id: string;
  username: string;
}
