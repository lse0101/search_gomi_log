#!/usr/bin/env node
const os = require('os');
const fs = require('fs');
const {Command, Option} = require('commander');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'))
const inquirer = require('inquirer');

const {APILogSearcher, setupConfig} = require('#root/apilog/APILoggerSearcher');

const program = new Command();

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
    const search = new APILogSearcher(config);

    await search.search(opts);
  });

program.parse(process.argv);

