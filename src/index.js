let disparity = require('disparity');
let inquirer = require('inquirer');
let {Command, flags} = require('@oclif/command');
let { join } = require('path');
let { readFileSync, writeFileSync, existsSync } = require('fs');

let messages = require('./messages.js');

class UpdateHerokuBuildScriptCommand extends Command {
  async run() {
    let { flags, args } = this.parse(UpdateHerokuBuildScriptCommand);
    let { directory } = args;

    let pkgContents = this.readPackageJson(directory);
    let pkg = this.parsePackageJson(pkgContents);

    let scripts = pkg.scripts || {};

    let hasScripts = pkg.hasOwnProperty("scripts");
    let hasOptedIn =
      pkg.hasOwnProperty("heroku-build-change-opt-in") &&
      pkg["heroku-build-change-opt-in"] === true;
    let hasBuildScript = scripts.hasOwnProperty("build");
    let hasPostinstallScript = scripts.hasOwnProperty("postinstall");
    let hasHerokuPostBuildScript = scripts.hasOwnProperty("heroku-postbuild");

    let postinstallIsRunBuild =
      hasPostinstallScript &&
      ["npm run build", "yarn run build", "yarn build"].includes(
        scripts["postinstall"].trim()
      );

    // if they have already opted-in, there is nothing to do
    if (hasOptedIn) {
      return this.alreadyOptedIn();
    }

    // if there are no scripts, prompt opt-in to be safe
    if (!hasScripts) {
      this.promptOptIn(pkg);
    } else if (hasPostinstallScript) {
      if (hasBuildScript && !hasHerokuPostBuildScript) {
        if (postinstallIsRunBuild) {
          // in this case, we can remove the postinstall, and opt-in to the build change
          this.promptToRemovePostinstall(pkg);
        } else {
          // offer to move postinstall to build
          this.promptToMovePostinstallToBuild(pkg);
        }
      } else if (hasHerokuPostBuildScript) {
        this.promptOptIn(pkg);
      } else {
        // has postinstall script, but no build script, will not be affected by changes
        this.promptOptIn(pkg);
      }
    } else if (!hasBuildScript) {
      this.promptOptIn(pkg);
    } else if (hasHerokuPostBuildScript) {
      this.promptOptIn(pkg);
    } else {
      // if there is a build script, but not a heroku-postbuild script,
      // offer to add an empty heroku-postbuild script
      this.promptEmptyHerokuPostbuild(pkg);
    }

    let answer = await this.promptChangeWithDiff(pkgContents, pkg, flags);

    if (answer === "Yes") {
      this.writeNewPackageJson(directory, pkg);
    } else {
      this.userDeniedChanges();
    }
  }

  async promptChangeWithDiff(pkgContents, pkg, flags) {
    let diff = disparity.unified(
      pkgContents,
      JSON.stringify(pkg, null, 2) + "\n",
      {
        paths: ["package.json", "package.json"]
      }
    );

    this.log(messages.proposedChange(diff));

    let answer = "No";
    if (flags.yes) {
      answer = "Yes";
    } else if (flags.no) {
      answer = "No";
    } else {
      let result = await inquirer.prompt({
        type: "list",
        message: "Would you like to apply these changes?",
        name: "answer",
        choices: ["Yes", "No"]
      });
      answer = result.answer;
    }
    return answer;
  }

  userDeniedChanges() {
    this.log(messages.deniedChanges());
  }

  promptEmptyHerokuPostbuild(pkg) {
    this.log(messages.emptyHerokuPostbuild(pkg));
    pkg.scripts["heroku-postbuild"] = "echo Skip build on Heroku";
    pkg["heroku-build-change-opt-in"] = true;
  }

  promptToRemovePostinstall(pkg) {
    this.log(messages.removePostinstall(pkg));
    delete pkg.scripts.postinstall;
    pkg["heroku-build-change-opt-in"] = true;
  }

  promptToMovePostinstallToBuild(pkg) {
    this.log(messages.movePostinstallToBuild(pkg));
    pkg.scripts["build"] = pkg.scripts.postinstall;
    delete pkg.scripts.postinstall;
    pkg["heroku-build-change-opt-in"] = true;
  }

  promptOptIn(pkg) {
    this.log(messages.suggestOptIn());
    pkg["heroku-build-change-opt-in"] = true;
  }

  alreadyOptedIn() {
    this.log(messages.alreadyOptedIn());
  }

  parsePackageJson(contents) {
    let pkg;
    try {
      pkg = JSON.parse(contents);
    } catch (e) {
      this.error(messages.invalidPackageJson());
    }
    return pkg;
  }

  writeNewPackageJson(dir, pkg) {
    let packageJsonLocation = join(dir, "package.json");
    if (!existsSync(packageJsonLocation)) {
      this.error(
        "An unexpected error occured. Expected a file at " + packageJsonLocation
      );
    }
    writeFileSync(packageJsonLocation, JSON.stringify(pkg, null, 2) + "\n");
    this.log(messages.changesWrittenSuccessfully(packageJsonLocation));
  }

  readPackageJson(dir) {
    let packageJsonLocation = join(dir, "package.json");
    if (!existsSync(packageJsonLocation)) {
      this.log(messages.noPackageJsonError(dir));
      process.exit(0);
    }
    let f = readFileSync(packageJsonLocation);
    return f.toString();
  }
}

UpdateHerokuBuildScriptCommand.args = [
  { 
    name: 'directory', 
    default: process.cwd(),
    description: "The directory of the Heroku Node.js application. Defaults to the current directory.",
  }
];

UpdateHerokuBuildScriptCommand.description = `A one-time migration tool to prepare your Heroku Node.js app for a build change on March 11, 2019
To make getting started with Node.js on Heroku easier we will begin executing the "build" script 
by default if it is defined in your package.json. This change will go live on Monday, March 11, 2019.

Read more about this change in our FAQ: https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq

This CLI tool is meant to be run in your app's root directory where your package.json is 
located. However you may also pass in a directory as an argument.

$ update-node-build-script

or

$ update-node-build-script $YOUR_APP_DIRECTORY
`;

UpdateHerokuBuildScriptCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  // add --yes to default to making the change
  yes: flags.boolean({
    char: 'y',
    description: "Don't prompt for an answer and just make the change",
  }),
  // add --no to default to not making the change
  no: flags.boolean({
    char: 'n',
    description: "Default to answering no to changes",
    hidden: true,
  })
}

module.exports = UpdateHerokuBuildScriptCommand
