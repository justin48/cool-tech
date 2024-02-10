import { execa } from "execa";

if (process.env.NODE_ENV === "production") {
  await import("./index.ts");
} else {
  const command =
    'tsx watch --clear-screen-false --ignore "app/**" --ignore "build/**" --ignore "node_modules/**" --inspect ./index.ts';
  execa(command, {
    stdio: ["ignore", "inherit", "inherit"],
    shell: true,
    env: {
      FORCE_COLOR: true,
      MOCKS: true,
      ...process.env,
    },
    windowsHide: false,
  });
}
