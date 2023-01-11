#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const {Command, Option} = require('commander');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'))
const inquirer = require('inquirer');

const apiLoggerSearcher = require('#root/apilog/APILoggerSearcher');

const program = new Command();
const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const configDirRoot = `${os.homedir()}/.gomi`;
const configFile = `${configDirRoot}/es_config`;
const shortDateRe = /^[0-9]*(d|w|M|y|h|m|s|ms)$/;
const yyyymmddhhmmssRe = /^[0-9]{14}$/;


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


const validatedDate = (date) => {
  if(shortDateRe.test(date)) {
    return dayjs().subtract(date.slice(0,-1),date.slice(-1)) ;
  } else if(yyyymmddhhmmssRe.test(date)) {
    return dayjs(date, 'YYYYMMDDHHmmss');
  } else {
    throw new Error('date invalidate');
  }
}

const parsedDate = ({startDate, endDate}) => {
  return {
    startDate : validatedDate(startDate),
    endDate : (endDate) ? validatedDate(endDate) : dayjs()
  }
};

const validateOpts = async (programOpts) => {
  const rangeDate = parsedDate(programOpts);

  return Object.assign({},
    programOpts,
    {
      startDate: rangeDate.startDate.utc().valueOf(),
      endDate: rangeDate.endDate.utc().valueOf(),
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
  .option('-e, --end-date <edate>', '검색 종료일자')
  .action(async (opts) => {
    const config = await setupConfig();
    const searchOpts = await validateOpts(opts);
    const search = new apiLoggerSearcher(config);

    await search.search(searchOpts);
  });

program.parse(process.argv);

