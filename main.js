#!/usr/bin/env node
const {Command, Option} = require('commander');
const dayjs = require('dayjs');
const search = require('#root/Search');

const program = new Command();
const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const dateFormat = 'YYYY-MM-DDTHH:mm:ss[Z]';

program
  .addOption(new Option('-p, --profile <profile>', 'dev, stage, prod 중 하나를 선택', 'dev').choices(['dev', 'stage', 'prod']))
  .addOption(new Option('-t, --target <target>', 'user or admin', 'user').choices(['user', 'admin']))
  .requiredOption('-s, --start-date <sdate>', '검색 시작 일자')
  .requiredOption('-e, --end-date <edate>', '검색 종료일자')

program.parse(process.argv);

if(program.args.length <= 0) {
  console.log('검색할 문자열을 입력하지 않았습니다.');
  return;
}

const programOpts = program.opts();

if(!dateUnit.includes(programOpts.startDate.slice(-1))) {
  console.log('startDate invalidate');
  return;
}

if(!dateUnit.includes(programOpts.endDate.slice(-1))) {
  console.log('endDate invalidate');
  return;
}

const searchOpts = Object.assign({},
  programOpts,
  {
    startDate: dayjs().subtract(programOpts.startDate.slice(0,-1),programOpts.startDate.slice(-1)).valueOf(),
    endDate: dayjs().subtract(programOpts.endDate.slice(0,-1),programOpts.endDate.slice(-1)).valueOf(),
    msg: program.args[0]
  }
);

(async ()=>await search(searchOpts))();
