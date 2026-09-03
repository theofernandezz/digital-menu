import { describe, expect, it } from "vitest";
import { SignOutUseCase } from "@/application/use-cases/sign-out";
import { FakeAuthProvider } from "@/application/__tests__/fakes";

describe("SignOutUseCase", () => {
  it("calls signOut on the auth provider", async () => {
    const auth = new FakeAuthProvider();
    const useCase = new SignOutUseCase(auth);

    await useCase.execute();

    expect(auth.signOutCalled).toBe(true);
  });
});
