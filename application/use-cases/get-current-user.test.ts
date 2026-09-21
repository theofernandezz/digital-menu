import { describe, expect, it } from "vitest";
import { GetCurrentUserUseCase } from "@/application/use-cases/get-current-user";
import { FAKE_USER_ID, FakeAuthProvider } from "@/application/__tests__/fakes";

describe("GetCurrentUserUseCase", () => {
  it("returns the signed-in user", async () => {
    const auth = new FakeAuthProvider();
    auth.currentEmail = "owner@example.test";

    const user = await new GetCurrentUserUseCase(auth).execute();

    expect(user).toEqual({ id: FAKE_USER_ID, email: "owner@example.test" });
  });

  it("returns null, not an error, when nobody is signed in", async () => {
    const auth = new FakeAuthProvider();
    auth.currentUserId = null;

    const user = await new GetCurrentUserUseCase(auth).execute();

    expect(user).toBeNull();
  });
});
