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
        query: `SELECT request_id,
                       message
                FROM "${searchOpts.index}"
                WHERE dt BETWEEN \'${searchOpts.startDate}\' AND \'${searchOpts.endDate}\'
                ORDER BY request_id
        `,
      });

      if (result.rows?.length > 0) {
        result.rows.forEach(row => console.log(`[${row[0]}] ${row[1]}`));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async search(searchOpts) {
    await this.#doSearch(Object.assign(searchOpts, {index: 'search-user-log-*'}));
  }

}

module.exports = Search;
