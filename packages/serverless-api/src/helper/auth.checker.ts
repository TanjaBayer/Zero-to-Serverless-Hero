import { AuthChecker } from 'type-graphql';
import { Context } from '../model/context.model';
import { GraphQLError } from 'graphql';
import { Token } from '../interface/token.interface';
import jwkToPem from 'jwk-to-pem';
import { TokenExpiredError, decode, verify } from 'jsonwebtoken';

const keysCache = {};
const userPoolUrl = `https://cognito-idp.${process.env.REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;

export const customAuthChecker: AuthChecker<Context, string> = async ({
  context,
}) => {
  if (!context.authToken) {
    throw new GraphQLError('No valid Token', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  checkTokenAndUpdateUserId(context);
  return true;
};

export async function checkTokenAndUpdateUserId(context: Partial<Context>) {
  let token: Token;
  try {
    const tokenParts = context.authToken.split('Bearer ');
    const authToken = tokenParts[tokenParts.length - 1];
    token = await verifyToken(authToken);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new GraphQLError('Token is expired', {
        extensions: { code: 'FORBIDDEN' },
      });
    } else {
      throw new GraphQLError(err.message, {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  }
  console.log(token);
  if (!token?.sub) {
    throw new GraphQLError('Token is not valid', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  context.userId = token.sub;
}
export async function verifyToken(
  rawToken: string
): Promise<Token | undefined> {
  const decodedToken = decode(rawToken, { complete: true });
  if (!decodedToken) {
    return undefined;
  }
  let pem = keysCache[decodedToken.header.kid];
  // this is a fallback to load a new set of keys
  // according to the documentation, this should be done in case of rotation
  if (!pem) {
    try {
      await loadKeys(userPoolUrl);
      pem = keysCache[decodedToken.header.kid];
    } catch (err) {
      console.error('Failed loading JWKS keys: ', err);
      return undefined;
    }
  }
  // if pem is still not found, the requestor is maybe using a wrong key (from other stage or forged)
  if (!pem) {
    throw new GraphQLError('Token is not supported', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return verify(rawToken, pem, {
    issuer: userPoolUrl,
  }) as Token;
}

async function loadKeys(userPoolUrl: string): Promise<void> {
  const respones = await fetch(`${userPoolUrl}/.well-known/jwks.json`);
  const data = await respones.json();
  const keys = data.keys;
  for (const key of keys) {
    const pem = jwkToPem(key);
    keysCache[key.kid] = pem;
  }
  return;
}
