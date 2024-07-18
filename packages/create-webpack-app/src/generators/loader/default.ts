// Cspell:ignore plopfile, plopfile.js
import { NodePlopAPI, Answers, ActionType } from "../../types";
import { dirname, join, resolve } from "path";
import ejs from "ejs";
import { DynamicActionsFunction } from "node-plop";
import { fileURLToPath } from "url";
// eslint-disable-next-line node/no-missing-import
import { logger } from "../../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function (plop: NodePlopAPI) {
  // dependencies to be installed
  const dependencies: Array<string> = ["webpack-defaults"];

  await plop.load("../../utils/pkgInstallAction.js", {}, true);

  // custom helper function
  plop.setHelper("makeLoaderName", (name: string) => {
    name = plop.getHelper("kebabCase")(name);

    if (!/loader$/.test(name)) {
      name += "-loader";
    }
    return name;
  });

  plop.setDefaultInclude({ generators: true, actionTypes: true });
  plop.setPlopfilePath(resolve(__dirname, "../../plopfile.js"));

  // Define a base generator for the project structure
  plop.setGenerator("loader-default", {
    description: "Create a basic Webpack loader.",
    prompts: [
      {
        type: "input",
        name: "projectPath",
        message: "Enter the project destination:",
        default: ".",
        filter: (input) => {
          return resolve(process.cwd(), input);
        },
      },
      {
        type: "input",
        name: "name",
        message: "Loader name?",
        default: "my-loader",
        validate: (str: string): boolean => str.length > 0,
      },
      {
        type: "list",
        name: "packageManager",
        message: "Pick a package manager:",
        choices: ["npm", "yarn", "pnpm"],
        default: "npm",
        validate(input) {
          if (!input.trim()) {
            return "Package manager cannot be empty";
          }
          return true;
        },
      },
    ],
    actions: function (answers: Answers) {
      const actions: ActionType[] = ["Starting actions..."];
      answers.projectPath = join(answers.projectPath, answers.name);

      logger.error(`
				Your project must be inside a folder named ${answers.name}
				I will create this folder for you.
                `);

      const files: Array<string> = [
        "./package.json",
        "./examples/simple/src/index.js",
        "./examples/simple/src/lazy-module.js",
        "./examples/simple/src/static-esm-module.js",
        "./examples/simple/webpack.config.js",
        "./src/cjs.js",
        "./test/fixtures/simple-file.js",
        "./test/functional.test.js",
        "./test/test-utils.js",
        "./test/unit.test.js",
        "./src/index.js",
      ];

      for (const file of files) {
        actions.push({
          type: "add",
          path: join(answers.projectPath, file),
          templateFile: join(plop.getPlopfilePath(), "../templates/loader/default", `${file}.tpl`),
          transform: (content: string) => ejs.render(content, answers),
          verbose: true,
          force: true,
        });
      }
      actions.push({
        type: "pkgInstall",
        path: answers.projectPath,
        packages: dependencies,
      });
      return actions;
    } as DynamicActionsFunction,
  });
}
