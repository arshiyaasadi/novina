import { Content as PrismaContent } from "@prisma/client";

export class Content {
  constructor(
    public id: string,
    public title: string,
    public body: string | null,
    public published: boolean,
    public authorId: string,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  static fromPrisma(content: PrismaContent): Content {
    return new Content(
      content.id,
      content.title,
      content.body,
      content.published,
      content.authorId,
      content.createdAt,
      content.updatedAt
    );
  }
}

