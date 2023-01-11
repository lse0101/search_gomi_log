require('web-streams-polyfill')
const {Client} = require('@elastic/elasticsearch');
const dayjs = require("dayjs");

const dateUnit = [ 'd', 'w', 'M', 'y', 'h', 'm', 's', 'ms', ];
const shortDateRe = /^[0-9]*(d|w|M|y|h|m|s|ms)$/;
const yyyymmddhhmmssRe = /^[0-9]{14}$/;

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
                  request_id,
                  message
                FROM "${searchOpts.index}"
                WHERE 
                  env = \'${searchOpts.profile}\'
                  AND dt BETWEEN \'${searchOpts.startDate}\' AND \'${searchOpts.endDate}\'
                ORDER BY dt ASC, request_id
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
    result.rows.forEach(row => console.log(`${row[0]} [${row[1]}] ${row[2]}`));

    if(result.cursor)
      await this.printLog(await this.#searchClient.sql.query({cursor: result.cursor}));
    else
      return;
  }

  async search(opts) {
    const searchOpts = await validateOpts(opts);
    const index = searchOpts.target === 'user' ? 'search-user-log-*' : 'search-admin-log-*'
    await this.#doSearch(Object.assign(searchOpts, {index}));
  }

}

module.exports = APILogSearcher;
