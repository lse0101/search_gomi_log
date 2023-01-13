#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const {Command, Option} = require('commander');
const inquirer = require('inquirer');

const {APILogSearcher, setupConfig} = require('#root/apilog/APILoggerSearcher');
const sqsLogger = require('#root/sqs/SQSLogger');

const program = new Command();

program.command('es-init')
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
    const search = new APILogSearcher(config);

    await search.search(opts);
  });

const logStreamListAction = async (nextToken) => {
  const lists = await sqsLogger.listLogStreams(nextToken);
  const choices = lists.logStreams.map(l => `${l.storedBytes} [${l.dt}]| ${l.logStreamName}`);

  if(lists.nextToken) choices.push('next...');

  inquirer.prompt([
    {type: 'list',
      name: 'name',
      message: 'select logStream',
      choices
    }
  ]).then(async ans => {
    if(ans.name === 'next...') {
      await logStreamListAction(lists.nextToken);
    } else {
      await sqsLogger.printLog(ans.name.split('|')[1].trim());
    }
  });
};

program
  .command('qlog')
  .action(async () => {
    return await logStreamListAction();
  });

program.parse(process.argv);

