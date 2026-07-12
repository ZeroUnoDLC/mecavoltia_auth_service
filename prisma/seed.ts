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
  devFallback: string;
}

// Los 3 socios. Sin endpoint público de registro: este seed es la ÚNICA vía de alta.
const SOCIOS: SeedUser[] = [
  {
    email: 'cristhian@mecavoltia.com',
    displayName: 'Cristhian de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_CRISTHIAN',
    devFallback: 'cambiar_en_primer_login_c',
  },
  {
    email: 'fernando@mecavoltia.com',
    displayName: 'Fernando de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_FERNANDO',
    devFallback: 'cambiar_en_primer_login_f',
  },
  {
    email: 'brayan@mecavoltia.com',
    displayName: 'Brayan de la Cruz',
    passwordEnvVar: 'SEED_PASSWORD_BRAYAN',
    devFallback: 'cambiar_en_primer_login_b',
  },
];

async function main(): Promise<void> {
  for (const socio of SOCIOS) {
    const password = process.env[socio.passwordEnvVar] ?? socio.devFallback;
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
