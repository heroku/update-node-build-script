let path = require('path');
let chalk = require("chalk");
let os = require("os");

let changeDate = "Monday, March 11";
let documentationLink = "https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq";

// In testing, emojis only reliably worked on OS X
function emoji(str) {
  if (process.platform === 'darwin') {
    return str;
  }
  return ''
}

function deniedChanges() {
  return `
${emoji("⚠️  ")}${chalk.bold("No changes written to disk.")}

${emoji("📖  ")}To learn more about the upcoming change, read more at: ${documentationLink}`;
}

function emptyHerokuPostbuild(pkg) {
  return `
${emoji("⚠️  ")}This app ${chalk.bold("will")} be affected by upcoming changes!

"build": "${pkg.scripts.build}"

This "build" script is not currently being run when this app is pushed to Heroku, but
Heroku will start running it automatically starting on ${changeDate}.

${chalk.blue.bold(`We suggest adding an empty "heroku-postbuild" script to prevent any change in behavior`)}
${chalk.blue.bold(`when deploying after ${changeDate}`)}. When a "heroku-postbuild" script is present Heroku
will run it instead of the "build" script.`;
}

function removePostinstall(pkg) {
  return `
${emoji("⚠️  ")}This app ${chalk.bold("will")} be affected by upcoming changes!

"postinstall": "${pkg.scripts.postinstall}"

This script is only being used to run the "build" script. Heroku will start running the "build" script
automatically starting on ${changeDate}, and this is no longer necessary.

${chalk.blue.bold(
  'We suggest removing the "postinstall" script and opting into the change early by setting'
)}
${chalk.blue.bold("the opt-in key in your package.json.")}

If you do not make this change, then your "build" script will be executed twice when pushing
to Heroku after ${changeDate}.`;
}

function movePostinstallToBuild(pkg) {
  return `
${emoji("⚠️  ")}This app ${chalk.bold("will")} be affected by upcoming changes!

"postinstall": "${pkg.scripts.postinstall}"
"build": "${pkg.scripts.build}"

This "build" script is not currently being run when this app is pushed to Heroku, but
Heroku will start running it automatically starting on ${changeDate}.

${chalk.blue.bold(
  'We suggest moving the "postinstall" script to "build" and opting in to the new behavior.'
)}

If you do not make this change, then both your "build" and "postinstall" scripts will be
executed when pushing to Heroku after ${changeDate}.`;
}

function proposedChange(diff) {
  // take off the first 3 lines of the diff
  diff = diff.split(os.EOL).slice(3).join(os.EOL)

  return `
We suggest the following changes to package.json:

${diff}`;
}

function changesWrittenSuccessfully(packageJsonLocation) {
  let cwd = process.cwd();
  let p = path.relative(cwd, packageJsonLocation);

  return `
Wrote changes to ${chalk.bold(p)}!

Please be sure to commit your changes and redeploy:

$ git add ${p}
$ git commit -m "Adapt build scripts to Heroku changes"
$ git push heroku master
`;
}

function alreadyOptedIn() {
  return `
${emoji("✅  ")}${chalk.bold("This app has already opted in!")} You don't need to do anything else.

${emoji("📖  ")}To learn more about the upcoming change, read more at: ${documentationLink}`;
}

function noPackageJsonError(dir) {
  return `
${emoji('⚠️  ')}${chalk.red('No package.json found')}

${emoji('📖  ')}This command is designed to be run in the root directory of a Heroku app with a package.json file.

Rerun with --help for more information, or read more at: ${documentationLink}
`;
}

function invalidPackageJson() {
  return `${emoji("⚠️  ")}${chalk.red('package.json was invalid JSON and could not be updated')}

Please check your package.json to make sure it is formmated correctly`;
}

function suggestOptIn() {
  return `
${emoji("✅  ")}This app ${chalk.bold("will not")} be affected by upcoming changes!

${chalk.bold('We suggest opting in to the new behavior')} just to be sure that you will not experience
any disruption once the new behavior is made the default.`;
}

module.exports = {
  deniedChanges,
  emptyHerokuPostbuild,
  removePostinstall,
  movePostinstallToBuild,
  proposedChange,
  changesWrittenSuccessfully,
  alreadyOptedIn,
  noPackageJsonError,
  invalidPackageJson,
  suggestOptIn
};
