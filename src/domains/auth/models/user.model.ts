import { User as PrismaUser } from "@prisma/client";

export class User {
  constructor(
    public id: string,
    public email: string,
    public name: string | null,
    public firstName: string | null,
    public lastName: string | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(user: PrismaUser): User {
    return new User(
      user.id,
      user.email,
      user.name,
      user.firstName,
      user.lastName,
      user.createdAt,
      user.updatedAt
    );
  }
}

