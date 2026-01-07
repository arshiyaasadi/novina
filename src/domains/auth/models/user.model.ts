// Prisma is currently disabled - PrismaUser type is not available
// import { User as PrismaUser } from "@prisma/client";

export class User {
  constructor(
    public id: string,
    public email: string,
    public password: string,
    public name: string | null,
    public firstName: string | null,
    public lastName: string | null,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  // Prisma is disabled - this method is not used
  // static fromPrisma(user: PrismaUser): User {
  //   return new User(
  //     user.id,
  //     user.email,
  //     user.name,
  //     user.firstName,
  //     user.lastName,
  //     user.createdAt,
  //     user.updatedAt
  //   );
  // }
}

