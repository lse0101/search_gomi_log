#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const {Command, Option} = require('commander');
const dayjs = require('dayjs');
const inquirer = require('inquirer');

const Search = require('#root/Search');

const program = new Command();
const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const configDirRoot = `${os.homedir()}/.gomi`;
const configFile = `${configDirRoot}/es_config`;


const setupConfig = async (newInit = false) => {
  if(fs.existsSync(configFile) && !newInit) {
    return JSON.parse(fs.readFileSync(configFile));
  }

  const result = await inquirer.prompt([
    {type: 'input', name: 'cloudID', message:'input cloud ID'},
    {type: 'input', name: 'username', message:'input username'},
    {type: 'input', name: 'password', message:'input password'},
  ]);

  try {
    if(!fs.existsSync(configDirRoot)) fs.mkdirSync(configDirRoot);

    fs.writeFileSync(configFile, JSON.stringify(result));
    return result;
  } catch(err) {
    console.error(err);
    throw err;
  }

}

const validateOpts = async (programOpts) => {

  if(!dateUnit.includes(programOpts.startDate.slice(-1))) {
    throw new Error('startDate invalidate');
  }

  if(!dateUnit.includes(programOpts.endDate.slice(-1))) {
    throw new Error('endDate invalidate');
  }

  return Object.assign({},
    programOpts,
    {
      startDate: dayjs().subtract(programOpts.startDate.slice(0,-1),programOpts.startDate.slice(-1)).valueOf(),
      endDate: dayjs().subtract(programOpts.endDate.slice(0,-1),programOpts.endDate.slice(-1)).valueOf(),
      msg: program.args[0]
    }
  );

};

program.command('init')
  .action(async ()=> {
    await setupConfig(true);
  });
program
  .command('log')
  .addOption(new Option('-p, --profile <profile>', 'dev, stage, prod 중 하나를 선택')
    .default('dev')
    .choices(['dev', 'alpha', 'staging', 'prod']))
  .addOption(new Option('-t, --target <target>', 'user or admin')
    .default('user')
    .choices(['user', 'admin']))
  .requiredOption('-s, --start-date <sdate>', '검색 시작 일자')
  .requiredOption('-e, --end-date <edate>', '검색 종료일자')
  .action(async (opts) => {
    const config = await setupConfig();
    const searchOpts = await validateOpts(opts);
    const search = new Search(config);

    await search.search(searchOpts);
  });

program.parse(process.argv);

