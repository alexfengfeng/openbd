import { SignJWT, jwtVerify } from 'jose';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error('JWT_SECRET is missing or too short');
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

export interface JWTPayload {
  userId: string;
  username: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ userId: payload.userId, username: payload.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyAuth(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
}
