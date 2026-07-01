const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env manualmente
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  const newPassword = process.argv[2];
  if (!newPassword) {
    console.error("Error: Falta especificar la nueva contrasena.");
    process.exit(1);
  }

  const email = 'manager@manager.com';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Actualizar u obtener el usuario administrador en la base de datos
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      status: 'active'
    },
    create: {
      name: 'Project',
      lastName: 'Manager',
      email,
      password: hashedPassword,
      role: 'project_manager',
      status: 'active'
    }
  });

  console.log(`EXITO: La contrasena del administrador (${email}) ha sido restablecida.`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error al actualizar la base de datos:", err);
  process.exit(1);
});
