const watchClient = require('aws-sdk/clients/cloudwatchlogs');
const dayjs = require('dayjs');
dayjs.extend(require('dayjs/plugin/utc'))

const region = 'ap-southeast-1'
const logGroupName = '/aws/lambda/kr-commerce-gomimall-sqs-consumer-prod-partnercenter';

class SQSLogger {
  cwClient;
  constructor() {
    this.cwClient = new watchClient({region});
  }

  async listLogStreams(name) {
    return await this.cwClient.describeLogStreams({limit: 10, descending:true, logGroupName, logStreamNamePrefix:name})
      .promise()
      .then(log => {
        return {
          logStreams : log.logStreams.map(l => {
            return {
              dt: dayjs(l.firstEventTimestamp).utc().format('YYYY-MM-DD_HH:mm:ss'),
              storedBytes : l.storedBytes,
              logStreamName : l.logStreamName
            }
          }),
          nextToken: log.nextToken
        }
      });
  }

  async printLog(logStreamName, nextToken) {
    const listEvents = await this.cwClient.getLogEvents({logGroupName, logStreamName, startFromHead: true, nextToken }).promise();

    listEvents.events.forEach(e => console.log(e.message));

    if(listEvents.events.length !== 0)
      await this.printLog(logStreamName, listEvents.nextForwardToken);
    else
      return;
  }
}

module.exports = new SQSLogger();
