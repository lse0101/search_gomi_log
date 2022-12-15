const {Command, Option} = require('commander');

const program = new Command();

program
  .addOption(new Option('-p, --profile <profile>', 'dev, stage, prod 중 하나를 선택', 'dev').choices(['dev', 'stage', 'prod']))
  .addOption(new Option('-t, --target <target>', 'user or admin', 'user').choices(['user', 'admin']))
  .option('-s, --start-date <sdate>', '검색 시작 일자')
  .option('-e, --end-date <edate>', '검색 종료일자')

program.parse(process.argv);

console.log(program.opts().profile)





