const {expect, test} = require('@oclif/test');
const cmd = require('..');
const tmp = require('tmp');
const path = require('path');
const fs = require('fs-extra');

// Copy from test/fixtures to a tmp dir
function getFixture(name) {
  let fixtureDir = `./test/fixtures/${name}`;
  let fixture = tmp.dirSync();
  fs.copySync(fixtureDir, fixture.name)
  return fixture.name
}

function readJSON(fixtureDir) {
  let p = path.join(fixtureDir, 'package.json');
  return JSON.parse(fs.readFileSync(p).toString());
}

describe('already-opted-in', () => {
  test
    .stdout()
    .do(() => cmd.run([getFixture("already-opted-in")]))
    .it('tells the user they dont need to do more if theyve opted in', ctx => {
      expect(ctx.stdout).to.contain('You don\'t need to do anything')
      expect(ctx.stdout).to.contain(
        "https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq"
      );
    });
});

describe("build-with-heroku-posbuild", () => {
  let f = getFixture("build-with-heroku-postbuild");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests opting in", ctx => {
      expect(ctx.stdout).to.contain("will not be affected by upcoming changes");
      expect(ctx.stdout).to.contain("We suggest opting in to the new behavior");

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
    });
});

describe("build-without-heroku-postbuild", () => {
  let f = getFixture("build-without-heroku-postbuild");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests an empty heroku-postbuild script", ctx => {
      expect(ctx.stdout).to.contain("will be affected by upcoming changes");
      expect(ctx.stdout).to.contain(
        `We suggest adding an empty "heroku-postbuild" script to prevent any change in behavior`
      );

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
      expect(pkg.scripts["heroku-postbuild"]).to.equal(
        "echo Skip build on Heroku"
      );
    });
});

describe("heroku-postbuild-only", () => {
  let f = getFixture("heroku-postbuild-only");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests opting in", ctx => {
      expect(ctx.stdout).to.contain("will not be affected by upcoming changes");
      expect(ctx.stdout).to.contain("We suggest opting in to the new behavior");

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
    });
});

describe("no-scripts", () => {
  let f = getFixture("no-scripts");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests opting in", ctx => {
      expect(ctx.stdout).to.contain("will not be affected by upcoming changes");
      expect(ctx.stdout).to.contain("We suggest opting in to the new behavior");

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
    });
});

describe("postinstall-and-build", () => {
  let f = getFixture("postinstall-and-build");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("moves postinstall to build and opts in", ctx => {
      expect(ctx.stdout).to.contain("will be affected by upcoming changes");
      expect(ctx.stdout).to.contain(`We suggest moving the "postinstall" script to "build" and opting in to the new behavior`);

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
      expect(pkg.scripts["build"]).to.equal("echo postinstall");
      expect(pkg.scripts["postinstall"]).to.be.undefined
    });
});

describe("postinstall-and-build-and-heroku-postbuild", () => {
  let f = getFixture("postinstall-and-build-and-heroku-postbuild");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests opting in", ctx => {
      expect(ctx.stdout).to.contain(
        "will not be affected by upcoming changes"
      );
      expect(ctx.stdout).to.contain(
        "We suggest opting in to the new behavior"
      );

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
    });
});

describe("postinstall-is-run-build", () => {
  let f = getFixture("postinstall-is-run-build");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("removes postinstall", ctx => {
      expect(ctx.stdout).to.contain("will be affected by upcoming changes");
      expect(ctx.stdout).to.contain(
        `We suggest removing the "postinstall" script and opting into the change early`
      );

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
      expect(pkg.scripts["build"]).to.equal("react-scripts build")
      expect(pkg["postinstall"]).to.be.undefined;
    });
});

describe("postinstall-is-yarn-build", () => {
  let f = getFixture("postinstall-is-yarn-build");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("removes postinstall", ctx => {
      expect(ctx.stdout).to.contain("will be affected by upcoming changes");
      expect(ctx.stdout).to.contain(
        `We suggest removing the "postinstall" script and opting into the change early`
      );

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
      expect(pkg.scripts["build"]).to.equal("react-scripts build");
      expect(pkg["postinstall"]).to.be.undefined;
    });
});

describe("postinstall-is-yarn-run-build", () => {
  let f = getFixture("postinstall-is-yarn-run-build");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("removes postinstall", ctx => {
      expect(ctx.stdout).to.contain("will be affected by upcoming changes");
      expect(ctx.stdout).to.contain(
        `We suggest removing the "postinstall" script and opting into the change early`
      );

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
      expect(pkg.scripts["build"]).to.equal("react-scripts build");
      expect(pkg["postinstall"]).to.be.undefined;
    });
});

describe("postinstall-only", () => {
  let f = getFixture("postinstall-only");
  test
    .stdout()
    .do(() => cmd.run([f, "-y"]))
    .it("suggests opting in", ctx => {
      expect(ctx.stdout).to.contain("will not be affected by upcoming changes");
      expect(ctx.stdout).to.contain("We suggest opting in to the new behavior");

      let pkg = readJSON(f);
      expect(pkg["heroku-run-build-script"]).to.be.true;
    });
});