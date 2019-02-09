let chalk = require("chalk");

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
This app is using a "build" script:

"build": "${pkg.scripts.build}"

This script is not currently being run when this app is pushed to Heroku, but 
${chalk.blue.bold(
  `Heroku will start running the "build" script automatically starting on ${changeDate}.`
)}

We suggest adding an empty "heroku-postbuild" script to prevent any change in behavior 
when deploying after ${changeDate}. When a "heroku-postbuild" script is present Heroku 
will run it instead of the "build" script.`;
}

function removePostinstall(pkg) {
  return `
This app is using a "postinstall" script:

"postinstall": "${pkg.scripts.postinstall}"

It's only being used to run the "build" script. Heroku will start running the "build" script 
automatically starting on ${changeDate}.

${chalk.blue.bold(
  'We suggest removing the "postinstall" script and opting into the change early by setting'
)}
${chalk.blue.bold("an opt-in key in your package.json.")}

If you do not make this change, then your "build" script will be executed twice when pushing 
to Heroku after ${changeDate}.`;
}

function movePostinstallToHerokuPostbuild(pkg) {
  return `
This app is using a "postinstall" and a "build" script:

"postinstall": "${pkg.scripts.postinstall}"
"build": "${pkg.scripts.build}"

${ chalk.blue.bold('We suggest moving the "postinstall" script to "heroku-postbuild"') }

If you do not make this change, then both your "build" and "postinstall" scripts will be executed when pushing
to Heroku after ${ changeDate }.
`;
}

function proposedChange(diff) {
  return `
We suggest the following changes:
${diff}`;
}

function nothingToDo() {
  return `
${emoji("✅  ")}This app ${chalk.bold("will not")} be affected by upcoming changes! You don't need to do anything.

${emoji("📖  ")}To learn more about the upcoming change, read more at: ${documentationLink}`;
}

module.exports = {
  deniedChanges,
  emptyHerokuPostbuild,
  removePostinstall,
  movePostinstallToHerokuPostbuild,
  proposedChange,
  nothingToDo,
}
