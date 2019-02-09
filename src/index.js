let disparity = require('disparity');
let inquirer = require('inquirer');
let {Command, flags} = require('@oclif/command');
let { join } = require('path');
let { readFileSync, writeFileSync, existsSync } = require('fs');

let messages = require('./messages.js');

class UpdateHerokuBuildScriptCommand extends Command {
  async run() {
    let {flags, args} = this.parse(UpdateHerokuBuildScriptCommand)
    let { directory } = args;

    let pkgContents = this.readPackageJson(directory);
    let pkg = this.parsePackageJson(pkgContents);

    let scripts = pkg.scripts || {};

    let hasScripts = pkg.hasOwnProperty('scripts');
    let hasOptedIn = pkg.hasOwnProperty('heroku-build-change-opt-in') && pkg['heroku-build-change-opt-in'] === true;
    let hasBuildScript = scripts.hasOwnProperty('build');
    let hasPostinstallScript = scripts.hasOwnProperty('postinstall');
    let hasHerokuPostBuildScript = scripts.hasOwnProperty('heroku-postbuild');

    let postinstallIsRunBuild = hasPostinstallScript && [
      'npm run build',
      'yarn run build',
      'yarn build'
    ].includes(scripts['postinstall'].trim());

    // if there are no scripts, there is nothing to do
    if (!hasScripts) {
      return this.nothingToDo();
    }

    // if they have already opted-in, there is nothing to do
    if (hasOptedIn) {
      return this.nothingToDo();
    }

    // TODO: if the postinstall script is the same as the build script

    if (hasPostinstallScript) {
      if (hasBuildScript && !hasHerokuPostBuildScript) {
        if (postinstallIsRunBuild) {
          // in this case, we can remove the postinstall, and opt-in to the build change
          this.promptToRemovePostinstall(pkg);
        } else {
          // offer to move postinstall to heroku-postbuild or keep it and 
          // add an empty heroku-postbuild
          this.promptToMovePostinstallToHerokuPostBuild(pkg);
        }
      } else if (hasHerokuPostBuildScript) {
        return this.nothingToDo();
      } else {
        // has postinstall script, but no build script, will not be affected by changes
        return this.nothingToDo();
      }
    } else if (!hasBuildScript) {
    // if there is no build script, there is nothing to do 
      return this.nothingToDo();
    } else if (hasHerokuPostBuildScript) {
      // if there is already a heroku-postbuild, there is nothing to do
      return this.nothingToDo();
    } else {
      // if there is a build script, but not a heroku-postbuild script, 
      // offer to add an empty heroku-postbuild script
      this.promptEmptyHerokuPostbuild(pkg);
    }
    
    this.log(('\nWe suggest the following changes:\n'));
    let diff = disparity.unified(pkgContents, JSON.stringify(pkg, null, 2) + '\n', {
      paths: ['package.json', 'package.json'],
    });

    this.log(diff);

    let answer = 'No';

    if (flags.yes) {
      answer = 'Yes';
    } else if (flags.no) {
      answer = 'No'
    } else {
      let result = await inquirer.prompt({
        type: 'list',
        message: "Would you like to apply these changes?",
        name: 'answer',
        choices: [
          'Yes',
          'No'
        ]
      });
      answer = result.answer;
    }

    if (answer === 'Yes') {
      this.writeNewPackageJson(directory, pkg);
    } else {
      this.userDeniedChanges();
    }
  }

  userDeniedChanges() {
    this.log(messages.deniedChanges());
  }

  promptEmptyHerokuPostbuild(pkg) {
    this.log(messages.emptyHerokuPostbuild(pkg))
    pkg.scripts['heroku-postbuild'] = "echo Skip build on Heroku"
  }

  promptToRemovePostinstall(pkg) {
    this.log(messages.removePostinstall(pkg));
    delete pkg.scripts.postinstall;
    pkg['heroku-build-change-opt-in'] = true;
  }

  promptToMovePostinstallToHerokuPostBuild(pkg) {
    this.log(messages.promptToMovePostinstallToHerokuPostBuild(pkg));
    pkg.scripts['heroku-postbuild'] = pkg.scripts.postinstall;
    delete pkg.scripts.postinstall;
  }

  nothingToDo() {
    this.log(messages.nothingToDo());
  }

  parsePackageJson(contents) {
    let pkg;
    try {
      pkg = JSON.parse(contents);
    } catch (e) {
      console.log(e);
      return this.error("package.json was invalid JSON and could not be updated");
    }
    return pkg;
  }

  writeNewPackageJson(dir, pkg) {
    let packageJsonLocation = join(dir, 'package.json');
    if (!existsSync(packageJsonLocation)) {
      this.error("An unexpected error occured. Expected a file at " + packageJsonLocation);
    } 
    writeFileSync(packageJsonLocation, JSON.stringify(pkg, null, 2) + '\n');
    this.log(`\nWrote changes to ${packageJsonLocation}`);
  }

  readPackageJson(dir) {
    let packageJsonLocation = join(dir, 'package.json');
    if (!existsSync(packageJsonLocation)) {
      return this.error(`No package.json found in ${dir}.

This command is designed to be run in the root directory of a Heroku app with a package.json file. Run
with --help for more information.`);
    }
    let f = readFileSync(packageJsonLocation);
    return f.toString();
  }
}

UpdateHerokuBuildScriptCommand.args = [
  { 
    name: 'directory', 
    default: process.cwd(),
    description: "The directory of the application to migrate. Defaults to the current directory.",
  }
];

UpdateHerokuBuildScriptCommand.description = `A one-time migration tool to help you get your builds running on Heroku with a single command
...
Extra documentation goes here
`;

UpdateHerokuBuildScriptCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  // add --yes to default to making the change
  yes: flags.boolean({
    char: 'y',
    description: "Default to answering yes to changes",
    hidden: true,
  }),
  // add --no to default to not making the change
  no: flags.boolean({
    char: 'n',
    description: "Default to answering no to changes",
    hidden: true,
  })
}

module.exports = UpdateHerokuBuildScriptCommand
