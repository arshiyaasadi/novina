import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "../services/auth.service";
import { LoginCredentials, RegisterData, loginSchema, registerSchema } from "../types";
import { logger } from "@/infrastructure/logging";
import { ErrorResponses } from "@/shared/types/errors";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(request: NextRequest) {
    try {
      const body = await request.json();

      // Validate input
      const validationResult = loginSchema.safeParse(body);
      if (!validationResult.success) {
        const errorResponse = ErrorResponses.validation(validationResult.error.errors);
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const credentials: LoginCredentials = validationResult.data;
      const result = await this.authService.login(credentials);

      if (!result) {
        const errorResponse = ErrorResponses.unauthorized();
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      return NextResponse.json(result);
    } catch (error) {
      logger.error("Login controller error", { error });
      const errorResponse = ErrorResponses.internalServerError();
      return NextResponse.json(errorResponse.error, { status: errorResponse.status });
    }
  }

  async register(request: NextRequest) {
    try {
      const body = await request.json();

      // Validate input
      const validationResult = registerSchema.safeParse(body);
      if (!validationResult.success) {
        const errorResponse = ErrorResponses.validation(validationResult.error.errors);
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const registerData: RegisterData = validationResult.data;
      const result = await this.authService.register(registerData);

      return NextResponse.json(result, { status: 201 });
    } catch (error: unknown) {
      logger.error("Register controller error", { error });

      if (error instanceof Error && error.message === "User already exists") {
        const errorResponse = ErrorResponses.conflict("User already exists");
        return NextResponse.json(errorResponse.error, { status: errorResponse.status });
      }

      const errorResponse = ErrorResponses.internalServerError();
      return NextResponse.json(errorResponse.error, { status: errorResponse.status });
    }
  }
}

