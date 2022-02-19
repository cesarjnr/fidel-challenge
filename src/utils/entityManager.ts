import { DynamoDB } from 'aws-sdk';

import { Offer } from '../offers/offersEntity';
import { Location } from '../locations/locationsEntity';

type Entity = Offer | Location;

const ENTITIES_TABLES = new Map([
  ['Offer', 'offers'],
  ['Location', 'locations']
]);

export const transactPersist = async (entities: Entity[]): Promise<void> => {
  const dynamodb = new DynamoDB();
  const documentClient = new DynamoDB.DocumentClient();
  const { TableNames } = await dynamodb.listTables().promise();

  const putOperations = entities.map((entity) => {
    const tableName = ENTITIES_TABLES.get(entity.constructor.name);

    if (!tableName || !TableNames?.includes(tableName)) {
      throw new Error(`No table was found for entity '${entity.constructor.name}'`);
    }

    return {
      Put: {
        TableName: tableName,
        Item: entity
      }
    }
  });

  await documentClient.transactWrite({ TransactItems: putOperations }).promise();
}
