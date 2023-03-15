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
    .choices(['user', 'admin', 'batch', 'search']))
  .requiredOption('-s, --start-date <sdate>', '검색 시작 일자')
  .option('-e, --end-date <edate>', '검색 종료일자')
  .action(async (opts) => {
    const config = await setupConfig();
    const search = new APILogSearcher(config);

    await search.search(opts);
  });

const logStreamListAction = async (name) => {
  const lists = await sqsLogger.listLogStreams(name);
  const choices = lists.logStreams.map(l => `${l.dt}|${l.logStreamName}`);

  choices.forEach(c=> console.log(c));
};

program
  .command('search-qlog')
  .action(async () => {
    await logStreamListAction(process.argv[3]);
  });

program
  .command('qlog')
  .action(async () => {
    const streamName = process.argv[3];
    if(!streamName || streamName.trim() === '') {
      console.error('logStreamName을 입력해주세요');
    } else {
      await sqsLogger.printLog(process.argv[3].split('|')[1]);
    }
  });


program.parse(process.argv);

