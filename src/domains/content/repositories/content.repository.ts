// Prisma is currently disabled in this project but kept for future use
// import { prisma } from "@/infrastructure/database/prisma";
import { Content } from "../models/content.model";
import { CreateContentData, UpdateContentData } from "../types";

export class ContentRepository {
  async findById(id: string): Promise<Content | null> {
    // Prisma is disabled - returning null
    // const content = await prisma.content.findUnique({
    //   where: { id },
    // });
    // return content ? Content.fromPrisma(content) : null;
    return null;
  }

  async findByAuthor(authorId: string): Promise<Content[]> {
    // Prisma is disabled - returning empty array
    // const contents = await prisma.content.findMany({
    //   where: { authorId },
    //   orderBy: { createdAt: "desc" },
    // });
    // return contents.map(Content.fromPrisma);
    return [];
  }

  async create(data: CreateContentData): Promise<Content> {
    // Prisma is disabled - throwing error to indicate not implemented
    // const content = await prisma.content.create({
    //   data,
    // });
    // return Content.fromPrisma(content);
    throw new Error("Prisma is disabled. Content creation is not implemented.");
  }

  async update(id: string, data: UpdateContentData): Promise<Content> {
    // Prisma is disabled - throwing error to indicate not implemented
    // const content = await prisma.content.update({
    //   where: { id },
    //   data,
    // });
    // return Content.fromPrisma(content);
    throw new Error("Prisma is disabled. Content update is not implemented.");
  }

  async delete(id: string): Promise<void> {
    // Prisma is disabled - no-op
    // await prisma.content.delete({
    //   where: { id },
    // });
    // Do nothing
  }
}

