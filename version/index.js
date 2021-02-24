// based on https://github.com/cycjimmy/semantic-release-action/blob/dfad37820f3a2d2aa920d244ac1120a1c5c6349b/index.js
const path = require('path');
const exec = require('../src/_exec');

const getUpdatedProjects = files => files.reduce((projects, file) => {
  const match = file.match(/src\/(\w+\.\w+)\//);

  if (!match) return projects;

  const project = match[1];
  return projects.includes(project) ? projects : [...projects, project];
}, []);

const getAllProjects = async (sharedProject, excludeSharedProject) => {
  const core = require('@actions/core');

  const {stdout} = await exec('ls src');
  const projects = stdout.trim().split('\n');
  return excludeSharedProject
    ? projects.filter(project => project === sharedProject)
    : projects;
};

const outputProjects = projects => {
  console.log('The following projects will receive a version update');
  console.log(projects);

  core.setOutput('version_list', projects);
};

const run = async () => {
  const {stdout, stderr} = await exec('npm ci --only=prod', {
    cwd: path.resolve(__dirname)
  });
  console.log(stdout);
  if (stderr) {
    return Promise.reject(stderr);
  }

  const core = require('@actions/core');

  const sharedProject = core.getInput('shared_project');
  const excludeSharedProject = Boolean(core.getInput('exclude_shared_project'));

  const {stdout: tag} = await exec('git describe --tags --abbrev=0');
  const {stdout: files} = await exec(`git diff --name-only HEAD ${tag}`);

  let projects = getUpdatedProjects(files.trim().split('\n'));
  if (projects.includes(sharedProject)) {
    projects = getAllProjects(sharedProject, excludeSharedProject);
  }
  outputProjects(projects);
};

run().catch(console.error);
