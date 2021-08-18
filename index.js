const core = require('@actions/core')
const semver = require('semver')

async function run() {
  try {
    const bump = core.getInput('bump', { required: true })
    let version = core.getInput('version', { required: true })
    const identifier = core.getInput('preid', { required: false }) || ""
    console.log(`Using version "${version}" with bump rule "${bump}" and identifier "${identifier}"`)

    version = semver.inc(version, bump, identifier)

    core.exportVariable('VERSION', version.toString())
    core.setOutput('version', version.toString())
    core.setOutput('version_optimistic', `${semver.major(version)}.${semver.minor(version)}`)

    console.log(`Result: "${version.toString()}"`)
  }
  catch (error) {
    core.setFailed(error.message)
  }
}

run()
