require('web-streams-polyfill')
const {Client} = require('@elastic/elasticsearch');

class Search {

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

  async search(searchOpts) {
    const index = searchOpts.target === 'user' ? 'search-user-log-*' : 'search-admin-log-*'
    await this.#doSearch(Object.assign(searchOpts, {index}));
  }

}

module.exports = Search;
