import { UserRepository } from "../repositories/user.repository";
import { UserResponse, UpdateUserData } from "../types";
import { logger } from "@/infrastructure/logging";

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      logger.error("Get user error", { error, id });
      throw error;
    }
  }
}

