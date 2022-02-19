import { DynamoDB } from 'aws-sdk';

import { Location } from './locationsEntity';

export const TABLE_NAME = 'locations';
export const BRAND_ID_HAS_OFFER_INDEX_NAME = 'brandId-hasOffer-index';

export const index = async (): Promise<Location[]> => {
  const documentClient = new DynamoDB.DocumentClient();
  const { Items } = await documentClient.scan({ TableName: TABLE_NAME }).promise();

  return Items?.map((item) => (
    new Location(
      item.id,
      item.address,
      item.brandId,
      item.hasOffer,
      item.offerId
    )
  )) || [];
}

export const findById = async (id: string): Promise<Location | undefined> => {
  const documentClient = new DynamoDB.DocumentClient();
  const { Item } = await documentClient
    .get({
      TableName: TABLE_NAME,
      Key: { id }
    })
    .promise();

  return Item ? new Location(
    Item.id,
    Item.address,
    Item.brandId,
    Item.hasOffer,
    Item.offerId
  ): undefined;
}

export const getByBrandId = async (brandId: string, hasOffer?: boolean): Promise<Location[]> => {
  const documentClient = new DynamoDB.DocumentClient();
  const { Items } = await documentClient
    .query({
      TableName: TABLE_NAME,
      IndexName: BRAND_ID_HAS_OFFER_INDEX_NAME,
      ExpressionAttributeValues: {
        ':brandId': brandId,
        ':hasOffer': isNaN(Number(hasOffer)) ? undefined : Number(hasOffer)
      },
      KeyConditionExpression: 'brandId = :brandId'
        .concat(hasOffer !== undefined ? ' AND hasOffer = :hasOffer': '')
    })
    .promise();

  return Items?.map((item) => (
    new Location(
      item.id,
      item.address,
      item.brandId,
      item.hasOffer,
      item.offerId
    )
  )) || [];
}
