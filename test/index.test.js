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

describe('update-node-build-script', () => {

  test
  .stdout()
  .do(() => cmd.run([getFixture("already-opted-in")]))
  .it('tells the user they dont need to do more if theyve opted in', ctx => {
    expect(ctx.stdout).to.contain('You don\'t need to do anything')
    expect(ctx.stdout).to.contain(
      "https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq"
    );
  });

  // test
  // .stdout()
  // .do(() => cmd.run([getFixture("already-opted-in")]))
  // .it('tells the user they dont need to do more if theyve opted in', ctx => {
  //   expect(ctx.stdout).to.contain('You don\'t need to do anything')
  //   expect(ctx.stdout).to.contain(
  //     "https://help.heroku.com/P5IMU3MP/heroku-node-js-build-script-change-faq"
  //   );
  // });

  // test
  // .stdout()
  // .do(() => cmd.run(['--name', 'jeff']))
  // .it('runs hello --name jeff', ctx => {
  //   expect(ctx.stdout).to.contain('hello jeff')
  // });
})
