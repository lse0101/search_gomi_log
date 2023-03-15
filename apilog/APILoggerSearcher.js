require('web-streams-polyfill')
const {Client} = require('@elastic/elasticsearch');
const dayjs = require("dayjs");
const os = require("os");
const fs = require("fs");
const inquirer = require("inquirer");

dayjs.extend(require('dayjs/plugin/utc'))

const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const shortDateRe = /^[0-9]*(d|w|M|y|h|m|s|ms)$/;
const yyyymmddhhmmssRe = /^[0-9]{14}$/;

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

/**
 * 입력된 date 옵션을 date 스트링으로 변환한다
 *
 * @param date
 * @return {*}
 */
const validatedDate = (date) => {
  if(shortDateRe.test(date)) {
    return dayjs().subtract(date.slice(0,-1),date.slice(-1)) ;
  } else if(yyyymmddhhmmssRe.test(date)) {
    return dayjs(date, 'YYYYMMDDHHmmss');
  } else {
    throw new Error('date invalidate');
  }
}

/**
 * logging 검색 날짜를 반환한다
 *
 * @param startDate
 * @param endDate
 * @return {{endDate: *, startDate: *}}
 */
const parsedDate = ({startDate, endDate}) => {
  return {
    startDate : validatedDate(startDate),
    endDate : (endDate) ? validatedDate(endDate) : dayjs()
  }
};

/**
 * logging을 검색하기 위한 옵션들을 validate한다
 *
 * @param logOpts
 * @return {Promise<any>}
 */
const validateOpts = async (logOpts) => {
  const rangeDate = parsedDate(logOpts);

  return Object.assign({},
    logOpts,
    {
      startDate: rangeDate.startDate.utc().valueOf(),
      endDate: rangeDate.endDate.utc().valueOf(),
    }
  );
};


/**
 * gomimall backend API searcher
 * dev/alpha/stage/prod에 있는 Elasticseach의 log을 검색한다
 */
class APILogSearcher {

  #searchClient

  constructor(config) {
    this.#searchClient = new Client({
      format: 'json',
      cloud: {
        id: config.cloudID
      },
      auth: {
        username: config.username,
        password: config.password
      }
    });
  }

  async #doSearch (searchOpts) {
    try {
      const result = await this.#searchClient.sql.query({
        query: `SELECT 
                  dt, 
                  ${searchOpts.target === 'batch' ? 'message' : 'request_id, message' }
                FROM "${searchOpts.index}"
                WHERE 
                  env = \'${searchOpts.profile}\'
                  AND dt BETWEEN \'${searchOpts.startDate}\' AND \'${searchOpts.endDate}\'
                ORDER BY dt ASC
        `,
      });


      if (result.rows?.length > 0) {
        await this.printLog(result);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async printLog(result) {
    let ret;

    const print = async (log) => {
      log.rows.forEach(row => console.log(`${row[0]} [${row[1]}] ${row[2]}`));
      return log;
    };

    ret = await print(result);

    while(true) {
      if(!ret.cursor) break;
      ret = await print(await this.#searchClient.sql.query({cursor: ret.cursor}));
    }

  }

  async search(opts) {
    const searchOpts = await validateOpts(opts);
    let index;

    if(searchOpts.target === 'user') {
      index = 'search-user-log-*';
    } else if(searchOpts.target === 'admin') {
      index = 'search-admin-log-*';
    } else if(searchOpts.target === 'batch')  {
      index = 'search-batch-log-*';
    } else {
      let prefix;

      if(searchOpts.profile === 'dev') {
        prefix = 'develop';
      } else if(searchOpts.profile === 'staging') {
        prefix = 'staging';
      } else {
        prefix = 'production';
      }

      searchOpts.profile = prefix;
      index = `${prefix}-search-engine-log-*`;
    }
    await this.#doSearch(Object.assign(searchOpts, {index}));
  }

}

module.exports = {APILogSearcher, setupConfig};
