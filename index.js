const util = require("util");
const exec = util.promisify(require("child_process").exec);
const core = require("@actions/core");

async function main() {
    const majorVersion = core.getInput("major-version") || 0;
    const minorVersion = core.getInput("minor-version") || 0;

    const validTag = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;

    await exec("git fetch --all --tags");

    const {stdout} = await exec("git tag");

    const maxVersion = stdout.split(/[\r\n]+/g).filter((it) => {
        return it.match(validTag);
    }).map((it) => {
        const [major,minor,patch] = it.split('.');
        return Number(major) * 1000000 * + Number(minor) * 1000 + Number(patch);
    }).reduce((maxVersion, currentVersion) => (currentVersion > maxVersion ? currentVersion : maxVersion), 0);

    const defaultVersion = (majorVersion + minorVersion) === 0 ? 1 :(majorVersion * 1000000 + minorVersion * 1000);

    const targetVersion = defaultVersion > maxVersion ? defaultVersion : maxVersion + 1;

    const targetTag = `${Math.floor(targetVersion/1000000)}.${Math.floor(targetVersion/1000)%1000}.${targetVersion%1000}`

    await exec(`git tag ${targetTag}`);

    await exec(`git push origin ${targetTag}`);

    core.setOutput("newTag", targetTag);
}

main().catch(error => core.setFailed(error.message));
