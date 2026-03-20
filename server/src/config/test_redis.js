import connection from "./redis.js";

async function test() {
  try {
    await connection.set("test", "hello");
    const val = await connection.get("test");
    console.log("Redis working:", val);
    process.exit(0);
  } catch (err) {
    console.error("Redis failed:", err);
    process.exit(1);
  }
}

test();