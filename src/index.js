let disparity = require('disparity');
let inquirer = require('inquirer');
let chalk = require('chalk');
let {Command, flags} = require('@oclif/command');
let { join } = require('path');
let { readFileSync, writeFileSync, existsSync } = require('fs');

let changeDate = "Monday, Nov 13";
let documentationLink = "https://devcenter.heroku.com";

class UpdateHerokuBuildScriptCommand extends Command {
  async run() {
    let {flags, args} = this.parse(UpdateHerokuBuildScriptCommand)
    let { directory } = args;

    let pkgContents = this.readPackageJson(directory);
    let pkg = this.parsePackageJson(pkgContents);

    let scripts = pkg.scripts || {};

    let hasScripts = pkg.hasOwnProperty('scripts');
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

    if (hasPostinstallScript) {
      if (hasBuildScript && !hasHerokuPostBuildScript) {
        if (postinstallIsRunBuild) {
          // in this case, we can remove the postinstall, and opt-in to the build change
          await this.promptToRemovePostinstall(pkg);
        } else {
          // offer to move postinstall to heroku-postbuild or keep it and 
          // add an empty heroku-postbuild
          await this.promptToMovePostinstallToHerokuPostBuild(pkg);
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

    let { answer } = await inquirer.prompt({
      type: 'list',
      message: "Would you like to apply these changes?",
      name: 'answer',
      choices: [
        'Yes',
        'No'
      ]
    });

    if (answer === 'Yes') {
      this.writeNewPackageJson(directory, pkg);
    } else {
      this.userDeniedChanges();
    }
  }


  userDeniedChanges() {
    this.log(`
${chalk.bold('No changes written to disk.')}
    
To learn more about the upcoming change, read more at: ${documentationLink}`);
  }

  async promptEmptyHerokuPostbuild(pkg) {
    this.log(`
This app is using a "build" script:

"build": "${pkg.scripts.build}"

This script is not currently being run when this app is pushed to Heroku, but 
${chalk.blue.bold(`Heroku will start running the "build" script automatically starting on ${changeDate}.`)}

We suggest adding an empty "heroku-postbuild" script to prevent any change in behavior 
when deploying after ${changeDate}. When a "heroku-postbuild" script is present Heroku 
will run it instead of the "build" script.`)
    pkg.scripts['heroku-postbuild'] = "echo Skip build on Heroku"
  }

  async promptToRemovePostinstall(pkg) {
    this.log(`
This app is using a "postinstall" script:

"postinstall": "${pkg.scripts.postinstall}"

It's only being used to run the "build" script. Heroku will start running the "build" script 
automatically starting on ${changeDate}.

${chalk.blue.bold('We suggest removing the "postinstall" script and opting into the change early by setting')}
${chalk.blue.bold('an opt-in key in your package.json.')}

If you do not make this change, then your "build" script will be executed twice when pushing 
to Heroku after ${changeDate}.`);

    delete pkg.scripts.postinstall;
    pkg['heroku-build-change-opt-in'] = true;
  }

  promptToMovePostinstallToHerokuPostBuild(pkg) {
    this.log(`
This app is using a "postinstall" and a "build" script:

"postinstall": "${pkg.scripts.postinstall}" 
"build": "${pkg.scripts.build}" 

${chalk.blue.bold('We suggest moving this script to "heroku-postbuild"')}

If you do not make this change, then both your "build" and "postinstall" scripts will be executed twice when pushing
to Heroku after ${ changeDate }.
`);

    pkg.scripts['heroku-postbuild'] = pkg.scripts.postinstall;
    delete pkg.scripts.postinstall;
  }

  nothingToDo() {
    this.log(`
This app ${chalk.bold('will not')} be affected by upcoming changes, and no modifications are needed.`);
    this.exit(0);
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
      return this.error("No package.json");
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
}

module.exports = UpdateHerokuBuildScriptCommand
