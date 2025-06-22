import bcrypt from "bcrypt";

export async function checkPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}
