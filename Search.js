const {Client} = require('@elastic/elasticsearch');

const searchClient = new Client({
  format:'json',
  cloud: {
    id: 'GomiMall:YXAtc291dGhlYXN0LTEuYXdzLmZvdW5kLmlvOjQ0MyQyODE4MTBjMzAzMzU0NzQ5YjMzODZkNDk3NzA5OGNiNiRlMDkyNzY5OGI5NzA0NGE4OWNkNGUwOWI1M2M4M2FhYQ==',
  },
  auth: {
    username: 'elastic',
    password: 'Efnq6BMT8xoOyEYeTjfaAksv'
  }
});

const doSearch = async (searchOpts) => {
  try {
    const result = await searchClient.sql.query({
      query: `SELECT 
                request_id, 
                message 
              FROM 
                "${searchOpts.index}" 
              WHERE 
                dt BETWEEN \'${searchOpts.startDate}\' AND \'${searchOpts.endDate}\' 
              ORDER BY dt, request_id     
          `,
    });

    if(result.rows?.length > 0) {
      result.rows.forEach(row => console.log(row[1]));
    }
  } catch(err) {
    console.error(err);
  }

}

const search = async (searchOpts) => {
  await doSearch(Object.assign(searchOpts, {index: 'search-user-log-*'}));
}

module.exports = search;
