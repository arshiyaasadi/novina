import { ContentRepository } from "../repositories/content.repository";
import { CreateContentData, UpdateContentData, ContentResponse } from "../types";
import { logger } from "@/infrastructure/logging";

export class ContentService {
  private contentRepository: ContentRepository;

  constructor() {
    this.contentRepository = new ContentRepository();
  }

  async getById(id: string): Promise<ContentResponse | null> {
    try {
      const content = await this.contentRepository.findById(id);
      if (!content) return null;

      return {
        id: content.id,
        title: content.title,
        body: content.body,
        published: content.published,
        authorId: content.authorId,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };
    } catch (error) {
      logger.error("Get content error", { error, id });
      throw error;
    }
  }

  async getByAuthor(authorId: string): Promise<ContentResponse[]> {
    try {
      const contents = await this.contentRepository.findByAuthor(authorId);
      return contents.map((content) => ({
        id: content.id,
        title: content.title,
        body: content.body,
        published: content.published,
        authorId: content.authorId,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      }));
    } catch (error) {
      logger.error("Get contents by author error", { error, authorId });
      throw error;
    }
  }

  async create(data: CreateContentData): Promise<ContentResponse> {
    try {
      const content = await this.contentRepository.create(data);
      logger.info(`Content created: ${content.id}`);

      return {
        id: content.id,
        title: content.title,
        body: content.body,
        published: content.published,
        authorId: content.authorId,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };
    } catch (error) {
      logger.error("Create content error", { error, data });
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateContentData
  ): Promise<ContentResponse | null> {
    try {
      const content = await this.contentRepository.update(id, data);
      logger.info(`Content updated: ${id}`);

      return {
        id: content.id,
        title: content.title,
        body: content.body,
        published: content.published,
        authorId: content.authorId,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      };
    } catch (error) {
      logger.error("Update content error", { error, id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.contentRepository.delete(id);
      logger.info(`Content deleted: ${id}`);
    } catch (error) {
      logger.error("Delete content error", { error, id });
      throw error;
    }
  }
}

