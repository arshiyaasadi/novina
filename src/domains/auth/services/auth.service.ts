import { UserRepository } from "../repositories/user.repository";
import { LoginCredentials, RegisterData, AuthResponse } from "../types";
import { logger } from "@/infrastructure/logging";
import { hashPassword, verifyPassword } from "@/shared/lib/password";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    try {
      const user = await this.userRepository.findByEmail(credentials.email);

      if (!user) {
        logger.warn(`Login attempt with non-existent email: ${credentials.email}`);
        return null;
      }

      // Verify password
      const isPasswordValid = await verifyPassword(
        credentials.password,
        user.password
      );

      if (!isPasswordValid) {
        logger.warn(`Invalid password attempt for email: ${credentials.email}`);
        return null;
      }

      logger.info(`User logged in: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
        },
      };
    } catch (error) {
      logger.error("Login error", { error, email: credentials.email });
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new Error("User already exists");
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(data.password);

      const user = await this.userRepository.create({
        email: data.email,
        password: hashedPassword,
        name: data.name,
      });

      logger.info(`New user registered: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
        },
      };
    } catch (error) {
      logger.error("Registration error", { error, email: data.email });
      throw error;
    }
  }
}

