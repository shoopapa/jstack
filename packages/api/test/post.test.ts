import { afterEach, describe, expect, it } from "vitest";

import { createCaller, createFixtures } from "./harness";

const fx = createFixtures();
afterEach(fx.cleanup);

describe("post router", () => {
  it("creates and lists posts within the caller's org", async () => {
    const org = await fx.organization();
    const owner = await fx.member(org, "owner");
    const caller = createCaller(owner);

    await caller.post.create({ title: "Hello", body: "World" });
    const posts = await caller.post.list();

    expect(posts).toHaveLength(1);
    expect(posts[0]?.title).toBe("Hello");
  });

  it("never leaks posts across organizations", async () => {
    const orgA = await fx.organization();
    const orgB = await fx.organization();
    const a = createCaller(await fx.member(orgA, "owner"));
    const b = createCaller(await fx.member(orgB, "owner"));

    const { id } = await a.post.create({ title: "Secret", body: "" });

    expect(await b.post.list()).toHaveLength(0);
    await expect(b.post.byId({ id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("forbids members from deleting posts", async () => {
    const org = await fx.organization();
    const owner = createCaller(await fx.member(org, "owner"));
    const member = createCaller(await fx.member(org, "member"));

    const { id } = await owner.post.create({ title: "Keep me", body: "" });

    await expect(member.post.delete({ id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
