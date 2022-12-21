#!/usr/bin/env node
const {Command, Option} = require('commander');
const dayjs = require('dayjs');
const inquirer = require('inquirer');
const os = require('os');
const fs = require('fs');
const Search = require('#root/Search');


const program = new Command();
const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const configDirRoot = `${os.homedir()}/.gomi`;
const configFile = `${configDirRoot}/es_config`;


const main = async () => {
  const config = await setupConfig();
  const searchOpts = await parseOptions();
  const search = new Search(config);

  await search.search(searchOpts);
};

const setupConfig = async () => {
  if(fs.existsSync(configFile)) {
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

const parseOptions = async () => {

  program
    .addOption(new Option('-p, --profile <profile>', 'dev, stage, prod 중 하나를 선택', 'dev')
      .choices(['dev', 'staging', 'prod']))
    .addOption(new Option('-t, --target <target>', 'user or admin', 'user')
      .choices(['user', 'admin']))
    .requiredOption('-s, --start-date <sdate>', '검색 시작 일자')
    .requiredOption('-e, --end-date <edate>', '검색 종료일자')

  program.parse(process.argv);

  if(program.args.length <= 0) {
    console.log('검색할 문자열을 입력하지 않았습니다.');
    return;
  }

  const programOpts = program.opts();

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

(async ()=> await main())();
