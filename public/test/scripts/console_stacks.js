Test.describe(`Test source mapping of console errors.`, async () => {
  await Test.toggleExceptionLogging(true);
  await Test.selectConsole();
  await Test.toggleFilter("warn", true);

  // These tests should be more exhaustive...
  await Test.waitForMessage("console.trace() ConsoleTrace");
  await Test.waitForMessage("ConsoleWarn");
  await Test.waitForMessage("ConsoleError");
  await Test.waitForMessage("Assertion failed: ConsoleAssert");
  await Test.waitForMessage("Error: UncaughtError");
  await Test.waitForMessage("Object { number: 42 }");
  await Test.waitForMessage("Object { number: 12 }");
  await Test.waitForMessage("uncaught exception: [object Object]");
});
