import { db, Usuario } from '../database/connection';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'onbus_super_secret_key_12345';

function validarCPF(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma = soma + parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma = soma + parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCpf.substring(10, 11))) return false;

  return true;
}

function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export class UsuarioService {
  static async register(data: any): Promise<Omit<Usuario, 'senha'>> {
    const { nome, cpf, email, senha } = data;

    if (!nome || !cpf || !email || !senha) {
      throw new Error('Preencha todos os campos obrigatórios (nome, cpf, email, senha).');
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!validarCPF(cleanCpf)) {
      throw new Error('CPF inválido. Forneça um CPF válido de 11 dígitos.');
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!validarEmail(cleanEmail)) {
      throw new Error('Formato de e-mail inválido.');
    }

    // Verificar se CPF ou email já existem
    const existingCpf = await db.usuarios.findOne({ cpf: cleanCpf });
    if (existingCpf) throw new Error('CPF já cadastrado no sistema.');

    const existingEmail = await db.usuarios.findOne({ email: cleanEmail });
    if (existingEmail) throw new Error('E-mail já cadastrado no sistema.');

    const hashedPassword = await bcrypt.hash(senha, 10);
    const userId = randomUUID();

    const newUser: Usuario = {
      id: userId,
      nome,
      cpf: cleanCpf,
      email: cleanEmail,
      senha: hashedPassword,
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.usuarios.insert(newUser);

    const { senha: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async login(data: any): Promise<{ token: string; user: Omit<Usuario, 'senha'> }> {
    const { email, senha } = data;

    if (!email || !senha) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const user = await db.usuarios.findOne({ email });
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    if (user.status !== 'ativo') {
      throw new Error('Esta conta está suspensa ou desativada.');
    }

    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const token = jwt.sign({ id: user.id, cpf: user.cpf, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    const { senha: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  static async getProfile(id: string): Promise<Omit<Usuario, 'senha'> | null> {
    const user = await db.usuarios.findOne({ id });
    if (!user) return null;
    const { senha: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(id: string, data: any): Promise<Omit<Usuario, 'senha'>> {
    const { nome, email } = data;

    const user = await db.usuarios.findOne({ id });
    if (!user) throw new Error('Usuário não encontrado.');

    if (email && email !== user.email) {
      const cleanEmail = email.trim().toLowerCase();
      if (!validarEmail(cleanEmail)) {
        throw new Error('Formato de e-mail inválido.');
      }
      const existingEmail = await db.usuarios.findOne({ email: cleanEmail });
      if (existingEmail) throw new Error('E-mail já está em uso.');
    }

    const updatedData: Partial<Usuario> = {
      nome: nome || user.nome,
      email: email ? email.trim().toLowerCase() : user.email,
      updated_at: new Date().toISOString(),
    };

    await db.usuarios.update({ id }, updatedData);

    const updatedUser = { ...user, ...updatedData };
    const { senha: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  static async deleteAccountLGPD(id: string): Promise<void> {
    const user = await db.usuarios.findOne({ id });
    if (!user) throw new Error('Usuário não encontrado.');

    console.log(`LGPD Hard Delete solicitado para o usuário: ${user.nome} (${user.cpf})`);

    // Obter todos os cartões do usuário para remover suas transações correspondentes
    const cartoes = await db.cartoes.find({ usuario_id: id });
    for (const cartao of cartoes) {
      await db.transacoes.delete({ cartao_id: cartao.id });
    }

    // Excluir cartões do usuário
    await db.cartoes.delete({ usuario_id: id });

    // Excluir conta de usuário
    await db.usuarios.delete({ id });

    console.log(`LGPD Hard Delete concluído com sucesso para o ID: ${id}`);
  }
}
