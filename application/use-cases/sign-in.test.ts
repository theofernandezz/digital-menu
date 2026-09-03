import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { SignInUseCase } from "@/application/use-cases/sign-in";
import { InvalidCredentialsError } from "@/domain/errors/domain-errors";
import { FakeAuthProvider } from "@/application/__tests__/fakes";

describe("SignInUseCase", () => {
  it("signs in with valid credentials", async () => {
    const auth = new FakeAuthProvider();
    const useCase = new SignInUseCase(auth);
    await expect(useCase.execute({ email: "admin@digitalmenu.local", password: "correct-password" })).resolves.toBeUndefined();
  });

  it("rejects a malformed email before ever calling the auth provider", async () => {
    const auth = new FakeAuthProvider();
    const useCase = new SignInUseCase(auth);
    await expect(useCase.execute({ email: "not-an-email", password: "x" })).rejects.toThrow(ZodError);
  });

  it("propagates InvalidCredentialsError from the auth provider on wrong credentials", async () => {
    const auth = new FakeAuthProvider();
    auth.signInError = new InvalidCredentialsError();
    const useCase = new SignInUseCase(auth);

    await expect(useCase.execute({ email: "admin@digitalmenu.local", password: "wrong" })).rejects.toThrow(
      InvalidCredentialsError,
    );
  });
});
