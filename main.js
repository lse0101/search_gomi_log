const {Client} = require('@elastic/elasticsearch');

const search = new Client({
  format:'json',
  cloud: {
    id: 'GomiMall:YXAtc291dGhlYXN0LTEuYXdzLmZvdW5kLmlvOjQ0MyQyODE4MTBjMzAzMzU0NzQ5YjMzODZkNDk3NzA5OGNiNiRlMDkyNzY5OGI5NzA0NGE4OWNkNGUwOWI1M2M4M2FhYQ==',
  },
  auth: {
    username: 'elastic',
    password: 'Efnq6BMT8xoOyEYeTjfaAksv'
  }
});



const run = async () => {
  const result = await search.sql.query({
    query: 'SELECT request_id, message FROM "search-user-log-*" where dt > now() - INTERVAL 2 HOURS',
    fetch_size: 1
  });

  console.log(result.rows[0][0]);
}

run().catch(console.log);











