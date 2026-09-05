import { test } from "node:test";
import assert from "node:assert/strict";
import {
  USERNAME_RE,
  splitFullName,
  usernameBase,
  usernameCandidates,
} from "../signup-username.ts";

test("usernameBase folds a business name to a lowercase handle", () => {
  assert.equal(usernameBase("Tony Touch Barbershop"), "tonytouchbarbershop");
  assert.equal(usernameBase("  Cut & Crown Salon!  "), "cutcrownsalon");
  assert.equal(usernameBase("Polished Nail Bar #2"), "polishednailbar2");
});

test("usernameBase folds diacritics and drops non-ASCII", () => {
  assert.equal(usernameBase("Café Olé"), "cafeole");
  assert.equal(usernameBase("Peluquería Niño"), "peluquerianino");
  assert.equal(usernameBase("理髪店 Barber"), "barber");
});

test("usernameBase falls back when too short or empty", () => {
  assert.equal(usernameBase(""), "shop");
  assert.equal(usernameBase("A1"), "shop");
  assert.equal(usernameBase("!!!"), "shop");
  assert.equal(usernameBase("abc"), "abc");
});

test("usernameBase caps length so a suffix still fits the username rule", () => {
  const long = usernameBase("The Absolutely Enormous Multi Location Franchise Group LLC");
  assert.equal(long.length, 24);
  assert.match(`${long}200`, USERNAME_RE);
});

test("every candidate satisfies the shared username rule", () => {
  const seen: string[] = [];
  for (const c of usernameCandidates("Tony Touch Barbershop", 5)) {
    assert.match(c, USERNAME_RE);
    seen.push(c);
  }
  assert.deepEqual(seen, [
    "tonytouchbarbershop",
    "tonytouchbarbershop2",
    "tonytouchbarbershop3",
    "tonytouchbarbershop4",
    "tonytouchbarbershop5",
  ]);
});

test("candidates are bounded", () => {
  const all = [...usernameCandidates("x", 10)];
  assert.equal(all.length, 10);
  assert.equal(all[0], "shop");
  assert.equal(all[9], "shop10");
});

test("splitFullName handles the shapes Stripe sends", () => {
  assert.deepEqual(splitFullName("Tony Rivera", "Fallback"), {
    first_name: "Tony",
    last_name: "Rivera",
  });
  assert.deepEqual(splitFullName("  Mary Ann  Smith-Jones ", "Fallback"), {
    first_name: "Mary",
    last_name: "Ann Smith-Jones",
  });
  assert.deepEqual(splitFullName("Cher", "Fallback"), { first_name: "Cher", last_name: "" });
  assert.deepEqual(splitFullName(null, "Tony Touch"), {
    first_name: "Tony Touch",
    last_name: "",
  });
  assert.deepEqual(splitFullName("   ", "Tony Touch"), {
    first_name: "Tony Touch",
    last_name: "",
  });
});
