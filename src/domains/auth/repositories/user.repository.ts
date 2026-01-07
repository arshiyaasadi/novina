// Prisma is currently disabled in this project but kept for future use
// import { prisma } from "@/infrastructure/database/prisma";
import { User } from "../models/user.model";

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    // Prisma is disabled - returning null
    // const user = await prisma.user.findUnique({
    //   where: { email },
    // });
    // return user ? User.fromPrisma(user) : null;
    return null;
  }

  async findById(id: string): Promise<User | null> {
    // Prisma is disabled - returning null
    // const user = await prisma.user.findUnique({
    //   where: { id },
    // });
    // return user ? User.fromPrisma(user) : null;
    return null;
  }

  async create(data: {
    email: string;
    password: string;
    name?: string;
  }): Promise<User> {
    // Prisma is disabled - throwing error to indicate not implemented
    // const user = await prisma.user.create({
    //   data,
    // });
    // return User.fromPrisma(user);
    throw new Error("Prisma is disabled. User creation is not implemented.");
  }
}

