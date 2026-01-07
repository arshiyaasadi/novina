import { prisma } from "@/infrastructure/database/prisma";
import { Content } from "../models/content.model";
import { CreateContentData, UpdateContentData } from "../types";

export class ContentRepository {
  async findById(id: string): Promise<Content | null> {
    const content = await prisma.content.findUnique({
      where: { id },
    });

    return content ? Content.fromPrisma(content) : null;
  }

  async findByAuthor(authorId: string): Promise<Content[]> {
    const contents = await prisma.content.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
    });

    return contents.map(Content.fromPrisma);
  }

  async create(data: CreateContentData): Promise<Content> {
    const content = await prisma.content.create({
      data,
    });

    return Content.fromPrisma(content);
  }

  async update(id: string, data: UpdateContentData): Promise<Content> {
    const content = await prisma.content.update({
      where: { id },
      data,
    });

    return Content.fromPrisma(content);
  }

  async delete(id: string): Promise<void> {
    await prisma.content.delete({
      where: { id },
    });
  }
}

