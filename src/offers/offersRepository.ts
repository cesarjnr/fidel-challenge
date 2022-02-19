import { DynamoDB } from 'aws-sdk';

import { Offer } from './offersEntity';

export const TABLE_NAME = 'offers';

export const index = async (): Promise<Offer[]> => {
  const documentClient = new DynamoDB.DocumentClient();
  const { Items } = await documentClient.scan({ TableName: TABLE_NAME }).promise();

  return Items?.map((item) => (
    new Offer(
      item.id,
      item.name,
      item.brandId,
      item.locationsTotal
    )
  )) || [];
}

export const findById = async (id: string): Promise<Offer | undefined> => {
  const documentClient = new DynamoDB.DocumentClient();
  const { Item } = await documentClient
    .get({
      TableName: TABLE_NAME,
      Key: { id }
    })
    .promise();

  return Item ? new Offer(
    Item.id,
    Item.name,
    Item.brandId,
    Item.locationsTotal
  ) : undefined;
}
