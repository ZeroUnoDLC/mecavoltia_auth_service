import { PrismaClient } from '@prisma/client';
import { hash, Algorithm } from '@node-rs/argon2';

const prisma = new PrismaClient();

const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

interface SeedUser {
  email: string;
  displayName: string;
  passwordEnvVar: string;
}

// Los 3 socios. Sin endpoint público de registro: este seed es la ÚNICA vía de alta.
// La contraseña SIEMPRE viene de una variable de entorno — jamás hardcodeada acá
// (el código fuente se versiona). Si falta, el seed falla fuerte.
const SOCIOS: SeedUser[] = [
  {
    email: 'cristhian@mecavoltia.com',
    displayName: 'Cristhian de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_CRISTHIAN',
  },
  {
    email: 'fernando@mecavoltia.com',
    displayName: 'Fernando de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_FERNANDO',
  },
  {
    email: 'brayan@mecavoltia.com',
    displayName: 'Brayan de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_BRAYAN',
  },
];

function requiredPassword(envVar: string): string {
  const value = process.env[envVar];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Falta la variable ${envVar}. Definila en tu .env (dev) o en el .env del server (prod) antes de correr el seed.`,
    );
  }
  return value;
}

async function main(): Promise<void> {
  for (const socio of SOCIOS) {
    const password = requiredPassword(socio.passwordEnvVar);
    const passwordHash = await hash(password, ARGON2_OPTIONS);

    // Idempotente: si el usuario existe no se toca su contraseña.
    await prisma.user.upsert({
      where: { email: socio.email },
      update: { displayName: socio.displayName },
      create: { email: socio.email, displayName: socio.displayName, passwordHash },
    });
    console.log(`Seed OK: ${socio.email}`);
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
