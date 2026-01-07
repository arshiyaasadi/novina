import { prisma } from "@/infrastructure/database/prisma";
import { User } from "../models/user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? User.fromPrisma(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? User.fromPrisma(user) : null;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    const user = await prisma.user.create({
      data,
    });

    return User.fromPrisma(user);
  }
}

